package com.FishOnBid.FishOnBid_Backend.ai.vision;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Vision Analysis Service for fish quality assessment using GPT-4o.
 * 
 * Feature Flags:
 * - ai.vision.enabled=false (default): Uses deterministic mock logic
 * - ai.vision.enabled=true: Calls OpenAI GPT-4o Vision API (requires OPENAI_API_KEY)
 * 
 * This architecture allows:
 * 1. Zero-cost development and testing
 * 2. Easy switch to real AI without code changes
 * 3. Graceful fallback if API is unavailable
 */
@Service
@Slf4j
public class VisionAnalysisService {

    @Value("${ai.vision.enabled:false}")
    private boolean visionEnabled;

    @Value("${openai.api.key:}")
    private String openAiApiKey;

    @Value("${openai.vision.model:gpt-4o}")
    private String visionModel;

    @Autowired
    private ObjectMapper objectMapper;

    private WebClient openAiClient;

    // Base freshness scores by fish type (deterministic mock)
    private static final Map<String, Integer> FISH_BASE_SCORES = Map.of(
            "tuna", 88,
            "salmon", 85,
            "mackerel", 82,
            "sardine", 78,
            "pomfret", 80,
            "kingfish", 86,
            "seer fish", 84,
            "prawns", 75,
            "lobster", 90,
            "crab", 77
    );

    @PostConstruct
    private void init() {
        this.openAiClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Content-Type", "application/json")
                .codecs(config -> config.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
        log.info("VisionAnalysisService initialized: enabled={}, mode={}",
                visionEnabled, visionEnabled && isApiConfigured() ? "GPT-4o" : "MOCK");
    }

    /**
     * Analyze fish image for quality assessment.
     */
    public VisionAnalysisResponseDTO analyze(VisionAnalysisRequestDTO request) {
        long startTime = System.currentTimeMillis();

        log.info("Vision analysis requested for fish type: {}, enabled: {}, hasImage: {}",
                request.getFishType(), visionEnabled, request.hasImage());

        VisionAnalysisResponseDTO response;

        if (visionEnabled && isApiConfigured() && request.hasImage()) {
            try {
                response = callGpt4oVisionApi(request);
            } catch (Exception e) {
                log.error("GPT-4o Vision API call failed, falling back to mock: {}", e.getMessage());
                response = generateMockedAnalysis(request);
            }
        } else {
            if (visionEnabled && !isApiConfigured()) {
                log.warn("Vision enabled but OPENAI_API_KEY not configured, using mock");
            }
            response = generateMockedAnalysis(request);
        }

        long processingTime = System.currentTimeMillis() - startTime;
        response.setProcessingTimeMs(processingTime);

        log.info("Vision analysis complete: score={}, fishType={}, confidence={}, mocked={}, time={}ms",
                response.getFreshnessScore(),
                response.getDetectedFishType(),
                response.getConfidence(),
                response.isMocked(),
                processingTime);

        return response;
    }

    /**
     * Call OpenAI GPT-4o Vision API for real fish image analysis.
     * Sends the image as base64 in a multimodal chat completion request.
     */
    private VisionAnalysisResponseDTO callGpt4oVisionApi(VisionAnalysisRequestDTO request) {
        log.info("VISION_GPT4O_START: calling OpenAI {} for image analysis", visionModel);

        // Build the image content - support both base64 and URL
        Map<String, Object> imageContent;
        if (request.getImageBase64() != null && !request.getImageBase64().isBlank()) {
            String base64Data = request.getImageBase64();
            // Add data URI prefix if not present
            if (!base64Data.startsWith("data:")) {
                base64Data = "data:image/jpeg;base64," + base64Data;
            }
            imageContent = Map.of(
                    "type", "image_url",
                    "image_url", Map.of("url", base64Data, "detail", "low")
            );
        } else {
            imageContent = Map.of(
                    "type", "image_url",
                    "image_url", Map.of("url", request.getImageUrl(), "detail", "low")
            );
        }

        // Build the prompt
        String analysisPrompt = """
                You are a marine biologist and fish quality expert. Analyze this fish image carefully.
                
                Provide your assessment in the following JSON format ONLY (no markdown, no extra text):
                {
                  "fishType": "the species name of the fish (e.g., Tuna, Salmon, Mackerel, Pomfret, Prawns, Sardine, Kingfish, Seer Fish, Lobster, Crab)",
                  "freshnessScore": <integer 0-100>,
                  "qualityGrade": "PREMIUM|GOOD|ACCEPTABLE|LOW",
                  "confidence": <decimal 0.0-1.0>,
                  "explanation": "brief 1-2 sentence explanation of visual indicators observed"
                }
                
                Freshness scoring guide:
                - 90-100 (PREMIUM): Bright clear eyes, vivid red gills, firm shiny skin, ocean-fresh smell
                - 70-89 (GOOD): Slightly cloudy eyes, pinkish-red gills, firm skin with good sheen
                - 50-69 (ACCEPTABLE): Cloudy eyes, brownish gills, slightly soft flesh, mild odor
                - Below 50 (LOW): Sunken/opaque eyes, brown/grey gills, mushy flesh, strong odor
                
                If the image does not contain fish, set fishType to "Unknown", freshnessScore to 0, and explain what you see.
                """;

        // Build request body for OpenAI Chat Completions API
        Map<String, Object> requestBody = Map.of(
                "model", visionModel,
                "messages", List.of(
                        Map.of("role", "user", "content", List.of(
                                Map.of("type", "text", "text", analysisPrompt),
                                imageContent
                        ))
                ),
                "max_tokens", 300,
                "temperature", 0.3
        );

        // Call the OpenAI API
        String responseBody = openAiClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + openAiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(30))
                .block();

        // Parse the response
        return parseGpt4oResponse(responseBody);
    }

    /**
     * Parse GPT-4o response JSON into VisionAnalysisResponseDTO.
     */
    private VisionAnalysisResponseDTO parseGpt4oResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String content = root.path("choices").path(0).path("message").path("content").asText();

            // Clean up: remove markdown code block wrappers if present
            content = content.trim();
            if (content.startsWith("```json")) {
                content = content.substring(7);
            }
            if (content.startsWith("```")) {
                content = content.substring(3);
            }
            if (content.endsWith("```")) {
                content = content.substring(0, content.length() - 3);
            }
            content = content.trim();

            JsonNode analysis = objectMapper.readTree(content);

            String fishType = analysis.path("fishType").asText("Unknown");
            int freshnessScore = analysis.path("freshnessScore").asInt(70);
            String qualityGrade = analysis.path("qualityGrade").asText("GOOD");
            double confidence = analysis.path("confidence").asDouble(0.7);
            String explanation = analysis.path("explanation").asText("AI vision analysis completed.");

            // Clamp values to valid ranges
            freshnessScore = Math.max(0, Math.min(100, freshnessScore));
            confidence = Math.max(0.0, Math.min(1.0, confidence));

            log.info("VISION_GPT4O_PARSED: fishType={}, score={}, grade={}, confidence={}",
                    fishType, freshnessScore, qualityGrade, confidence);

            return VisionAnalysisResponseDTO.builder()
                    .freshnessScore(freshnessScore)
                    .confidence(confidence)
                    .qualityGrade(qualityGrade)
                    .explanation(explanation)
                    .detectedFishType(fishType)
                    .isMocked(false)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse GPT-4o vision response: {}", e.getMessage());
            throw new RuntimeException("Vision API response parsing failed", e);
        }
    }

    /**
     * Generate deterministic mock analysis based on fish type.
     */
    private VisionAnalysisResponseDTO generateMockedAnalysis(VisionAnalysisRequestDTO request) {
        String fishType = request.getFishType() != null
                ? request.getFishType().toLowerCase().trim()
                : "unknown";

        int baseScore = FISH_BASE_SCORES.getOrDefault(fishType, 75);
        int variance = Math.abs(fishType.hashCode() % 10) - 5;
        int finalScore = Math.max(50, Math.min(100, baseScore + variance));

        if (request.hasImage()) {
            finalScore = Math.min(100, finalScore + 3);
        }

        // Capitalize fish type for display
        String displayFishType = fishType.substring(0, 1).toUpperCase() + fishType.substring(1);

        return VisionAnalysisResponseDTO.createMocked(displayFishType, finalScore);
    }

    /**
     * Check if OpenAI API is configured
     */
    private boolean isApiConfigured() {
        return openAiApiKey != null && !openAiApiKey.isBlank();
    }

    /**
     * Check if vision analysis is available
     */
    public boolean isAvailable() {
        return true; // Always available — mock fallback
    }

    /**
     * Get service status for health checks
     */
    public Map<String, Object> getStatus() {
        return Map.of(
                "enabled", visionEnabled,
                "apiConfigured", isApiConfigured(),
                "mode", visionEnabled && isApiConfigured() ? "GPT-4o" : "MOCK",
                "model", visionModel,
                "available", isAvailable()
        );
    }
}

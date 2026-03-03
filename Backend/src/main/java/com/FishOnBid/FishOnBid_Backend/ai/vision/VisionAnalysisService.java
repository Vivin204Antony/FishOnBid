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
 * Vision Analysis Service for fish quality assessment using Google Gemini 1.5 Flash.
 *
 * Why Gemini instead of GPT-4o?
 * - Free tier: 1,500 requests/day (Zero cost for prototyping)
 * - ~66× cheaper than GPT-4o on paid tier ($0.075 vs $5 per 1M tokens)
 * - Multimodal vision quality is excellent for fish image analysis
 *
 * Feature Flags:
 * - ai.vision.enabled=false (default): Uses deterministic mock logic
 * - ai.vision.enabled=true + gemini.api.key set: Calls Gemini 1.5 Flash Vision API
 *
 * Gemini REST API:
 * POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}
 */
@Service
@Slf4j
public class VisionAnalysisService {

    @Value("${ai.vision.enabled:false}")
    private boolean visionEnabled;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.vision.model:gemini-1.5-flash}")
    private String visionModel;

    @Autowired
    private ObjectMapper objectMapper;

    private WebClient geminiClient;

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
        this.geminiClient = WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                .defaultHeader("Content-Type", "application/json")
                .codecs(config -> config.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();

        log.info("VisionAnalysisService initialized: enabled={}, model={}, mode={}",
                visionEnabled, visionModel,
                visionEnabled && isApiConfigured() ? "GEMINI_LIVE" : "MOCK");
    }

    /**
     * Analyze fish image for quality assessment.
     */
    public VisionAnalysisResponseDTO analyze(VisionAnalysisRequestDTO request) {
        long startTime = System.currentTimeMillis();

        log.info("Vision analysis requested: fishType={}, enabled={}, hasImage={}",
                request.getFishType(), visionEnabled, request.hasImage());

        VisionAnalysisResponseDTO response;

        if (visionEnabled && isApiConfigured() && request.hasImage()) {
            try {
                response = callGeminiVisionApi(request);
            } catch (Exception e) {
                log.error("Gemini Vision API call failed, falling back to mock: {}", e.getMessage());
                response = generateMockedAnalysis(request);
            }
        } else {
            if (visionEnabled && !isApiConfigured()) {
                log.warn("Vision enabled but GEMINI_API_KEY not configured — using mock mode");
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
     * Call Google Gemini 1.5 Flash Vision API for real fish image analysis.
     *
     * Gemini multimodal API format:
     * POST /v1beta/models/{model}:generateContent?key={API_KEY}
     * Body: { "contents": [{ "parts": [{"text": "..."}, {"inline_data": {...}}] }] }
     */
    private VisionAnalysisResponseDTO callGeminiVisionApi(VisionAnalysisRequestDTO request) {
        log.info("VISION_GEMINI_START: calling {} for image analysis", visionModel);

        // Analysis prompt — same quality guidance as before
        String analysisPrompt = """
                You are a marine biologist and fish quality expert. Analyze this fish image carefully.
                
                Provide your assessment in the following JSON format ONLY (no markdown, no extra text):
                {
                  "fishType": "the species name (e.g., Tuna, Salmon, Mackerel, Pomfret, Prawns, Sardine, Kingfish, Seer Fish, Lobster, Crab)",
                  "freshnessScore": <integer 0-100>,
                  "qualityGrade": "PREMIUM|GOOD|ACCEPTABLE|LOW",
                  "confidence": <decimal 0.0-1.0>,
                  "explanation": "brief 1-2 sentence explanation of visual indicators observed"
                }
                
                Freshness scoring guide:
                - 90-100 (PREMIUM): Bright clear eyes, vivid red gills, firm shiny skin
                - 70-89 (GOOD): Slightly cloudy eyes, pinkish-red gills, firm skin with good sheen
                - 50-69 (ACCEPTABLE): Cloudy eyes, brownish gills, slightly soft flesh
                - Below 50 (LOW): Sunken/opaque eyes, brown/grey gills, mushy flesh
                
                If the image does not contain fish, set fishType to "Unknown", freshnessScore to 0.
                """;

        // Strip data URI prefix if present (Gemini wants raw base64)
        String base64Data = request.getImageBase64();
        if (base64Data != null && base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }

        // Build Gemini request body
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", analysisPrompt),
                                Map.of("inline_data", Map.of(
                                        "mime_type", "image/jpeg",
                                        "data", base64Data
                                ))
                        ))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "maxOutputTokens", 300
                )
        );

        // Call Gemini API — auth is via query param (not Bearer token)
        String responseBody = geminiClient.post()
                .uri("/models/" + visionModel + ":generateContent?key=" + geminiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(30))
                .block();

        return parseGeminiResponse(responseBody);
    }

    /**
     * Parse Gemini API response JSON into VisionAnalysisResponseDTO.
     * Gemini response path: candidates[0].content.parts[0].text
     */
    private VisionAnalysisResponseDTO parseGeminiResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String content = root
                    .path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text").asText();

            // Clean markdown code fences if Gemini wraps the JSON
            content = content.trim();
            if (content.startsWith("```json")) content = content.substring(7);
            if (content.startsWith("```"))     content = content.substring(3);
            if (content.endsWith("```"))       content = content.substring(0, content.length() - 3);
            content = content.trim();

            JsonNode analysis = objectMapper.readTree(content);

            String fishType    = analysis.path("fishType").asText("Unknown");
            int freshnessScore = analysis.path("freshnessScore").asInt(70);
            String qualityGrade = analysis.path("qualityGrade").asText("GOOD");
            double confidence  = analysis.path("confidence").asDouble(0.7);
            String explanation = analysis.path("explanation").asText("Gemini vision analysis completed.");

            // Clamp values
            freshnessScore = Math.max(0, Math.min(100, freshnessScore));
            confidence     = Math.max(0.0, Math.min(1.0, confidence));

            log.info("VISION_GEMINI_PARSED: fishType={}, score={}, grade={}, confidence={}",
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
            log.error("Failed to parse Gemini vision response: {}", e.getMessage());
            throw new RuntimeException("Gemini Vision API response parsing failed", e);
        }
    }

    /**
     * Generate deterministic mock analysis based on fish type (used when API is not configured).
     */
    private VisionAnalysisResponseDTO generateMockedAnalysis(VisionAnalysisRequestDTO request) {
        String fishType = request.getFishType() != null
                ? request.getFishType().toLowerCase().trim()
                : "unknown";

        int baseScore = FISH_BASE_SCORES.getOrDefault(fishType, 75);
        int variance  = Math.abs(fishType.hashCode() % 10) - 5;
        int finalScore = Math.max(50, Math.min(100, baseScore + variance));

        if (request.hasImage()) {
            finalScore = Math.min(100, finalScore + 3);
        }

        String displayFishType = fishType.substring(0, 1).toUpperCase() + fishType.substring(1);
        return VisionAnalysisResponseDTO.createMocked(displayFishType, finalScore);
    }

    private boolean isApiConfigured() {
        return geminiApiKey != null && !geminiApiKey.isBlank();
    }

    public boolean isAvailable() {
        return true; // Always available — mock fallback
    }

    public Map<String, Object> getStatus() {
        return Map.of(
                "enabled",       visionEnabled,
                "apiConfigured", isApiConfigured(),
                "mode",          visionEnabled && isApiConfigured() ? "GEMINI_LIVE" : "MOCK",
                "provider",      "Google Gemini",
                "model",         visionModel,
                "available",     isAvailable(),
                "freeTier",      "1500 requests/day"
        );
    }
}

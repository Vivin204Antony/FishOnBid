package com.FishOnBid.FishOnBid_Backend.ai.vision;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;

/**
 * Vision Analysis Service for fish quality assessment.
 * 
 * Feature Flags:
 * - ai.vision.enabled=false (default): Uses deterministic mock logic
 * - ai.vision.enabled=true: Calls GPT-4V API (requires OPENAI_API_KEY)
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

    // Base freshness scores by fish type (deterministic mock)
    private static final Map<String, Integer> FISH_BASE_SCORES = Map.of(
            "tuna", 88,
            "salmon", 85,
            "mackerel", 82,
            "sardine", 78,
            "pomfret", 80,
            "kingfish", 86,
            "seer", 84,
            "prawns", 75,
            "lobster", 90,
            "crab", 77
    );

    /**
     * Analyze fish image for quality assessment.
     * 
     * @param request Analysis request with image data
     * @return Analysis response with freshness score and explanation
     */
    public VisionAnalysisResponseDTO analyze(VisionAnalysisRequestDTO request) {
        long startTime = System.currentTimeMillis();
        
        log.info("Vision analysis requested for fish type: {}, enabled: {}", 
                request.getFishType(), visionEnabled);

        VisionAnalysisResponseDTO response;

        if (visionEnabled && isApiConfigured()) {
            // TODO: Implement GPT-4V API call
            // response = callGpt4vApi(request);
            log.warn("GPT-4V integration not yet implemented, falling back to mock");
            response = generateMockedAnalysis(request);
        } else {
            response = generateMockedAnalysis(request);
        }

        long processingTime = System.currentTimeMillis() - startTime;
        response.setProcessingTimeMs(processingTime);

        log.info("Vision analysis complete: score={}, confidence={}, mocked={}, time={}ms",
                response.getFreshnessScore(), 
                response.getConfidence(),
                response.isMocked(),
                processingTime);

        return response;
    }

    /**
     * Generate deterministic mock analysis based on fish type.
     * Uses consistent scoring for reproducible testing.
     */
    private VisionAnalysisResponseDTO generateMockedAnalysis(VisionAnalysisRequestDTO request) {
        String fishType = request.getFishType() != null 
                ? request.getFishType().toLowerCase().trim() 
                : "unknown";

        // Get base score or use default
        int baseScore = FISH_BASE_SCORES.getOrDefault(fishType, 75);

        // Add small deterministic variance based on fish type hash
        int variance = Math.abs(fishType.hashCode() % 10) - 5;
        int finalScore = Math.max(50, Math.min(100, baseScore + variance));

        // If image is present, add small bonus
        if (request.hasImage()) {
            finalScore = Math.min(100, finalScore + 3);
        }

        return VisionAnalysisResponseDTO.createMocked(fishType, finalScore);
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
        // Always available in mock mode
        return true;
    }

    /**
     * Get service status for health checks
     */
    public Map<String, Object> getStatus() {
        return Map.of(
                "enabled", visionEnabled,
                "apiConfigured", isApiConfigured(),
                "mode", visionEnabled && isApiConfigured() ? "GPT-4V" : "MOCK",
                "available", isAvailable()
        );
    }

    // ============ GPT-4V INTEGRATION PLACEHOLDER ============
    
    /**
     * TODO: Implement GPT-4V Vision API call
     * 
     * Steps:
     * 1. Prepare multimodal request with image
     * 2. Call OpenAI API with vision model
     * 3. Parse response for freshness assessment
     * 4. Map to VisionAnalysisResponseDTO
     * 
     * Example prompt:
     * "Analyze this fish image for freshness. Rate from 0-100 based on:
     *  - Eye clarity and brightness
     *  - Gill color (red = fresh)
     *  - Skin texture and sheen
     *  - Overall appearance
     *  Respond with JSON: {freshnessScore, confidence, explanation}"
     */
    // private VisionAnalysisResponseDTO callGpt4vApi(VisionAnalysisRequestDTO request) {
    //     // Implementation when ready
    // }
}

package com.FishOnBid.FishOnBid_Backend.ai.vision;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Vision-based fish quality analysis.
 * Contains freshness score, confidence, detected fish type, and explanation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisionAnalysisResponseDTO {

    /**
     * Freshness score from 0-100.
     * 90-100: Premium fresh
     * 70-89: Good quality
     * 50-69: Acceptable
     * Below 50: Low quality
     */
    private int freshnessScore;

    /**
     * Model confidence in the analysis (0.0 - 1.0)
     */
    private double confidence;

    /**
     * Human-readable explanation of the analysis
     */
    private String explanation;

    /**
     * Quality classification based on score
     */
    private String qualityGrade;

    /**
     * AI-detected fish type from the image
     */
    private String detectedFishType;

    /**
     * Whether this analysis was from mock/stub (vs real AI)
     */
    private boolean isMocked;

    /**
     * Processing time in milliseconds
     */
    private long processingTimeMs;

    /**
     * Create a mocked response based on fish type
     */
    public static VisionAnalysisResponseDTO createMocked(String fishType, int score) {
        String grade = score >= 90 ? "PREMIUM" : score >= 70 ? "GOOD" : score >= 50 ? "ACCEPTABLE" : "LOW";

        return VisionAnalysisResponseDTO.builder()
                .freshnessScore(score)
                .confidence(0.85)
                .qualityGrade(grade)
                .detectedFishType(fishType)
                .explanation(String.format(
                    "Simulated analysis for %s. Freshness appears %s based on visual indicators. " +
                    "Enable ai.vision.enabled=true with OPENAI_API_KEY for real GPT-4o analysis.",
                    fishType, grade.toLowerCase()))
                .isMocked(true)
                .processingTimeMs(50)
                .build();
    }
}

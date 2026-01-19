package com.FishOnBid.FishOnBid_Backend.ai.dto;

/**
 * Result DTO for fish image vision analysis.
 * Placeholder for future GPT-4V integration.
 */
public record VisionResultDTO(
    int freshnessScore,      // 0-100 quality score
    String quality,          // Excellent / Good / Average / Poor
    String reason            // Visual analysis explanation
) {
    /**
     * Quality classification based on freshness score
     */
    public static String classifyQuality(int freshnessScore) {
        if (freshnessScore >= 85) return "Excellent";
        if (freshnessScore >= 70) return "Good";
        if (freshnessScore >= 50) return "Average";
        return "Poor";
    }

    /**
     * Factory method to create from freshness score with auto-classification
     */
    public static VisionResultDTO fromScore(int freshnessScore, String reason) {
        return new VisionResultDTO(
                freshnessScore,
                classifyQuality(freshnessScore),
                reason
        );
    }
}

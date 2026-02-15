package com.FishOnBid.FishOnBid_Backend.ai.dto;

import java.util.Map;

/**
 * Structured AI Explanation for farmer-facing transparency.
 * Breaks down HOW the AI arrived at its suggestion.
 */
public record AiExplanationDTO(
    String summary,
    int totalRecords,
    int govtRecords,
    int historicalRecords,
    double govtAvgPrice,
    double historicalAvgPrice,
    String dateRange,
    String confidenceLevel,
    String locationContext,
    String dataFreshness,
    Map<String, Double> sourceWeights
) {
    public static AiExplanationDTO fallback(String fishName) {
        return new AiExplanationDTO(
            "Limited data available for " + fishName + ". Using market baseline.",
            0, 0, 0, 0, 0,
            "N/A", "INSUFFICIENT", "Unknown",
            "N/A", Map.of()
        );
    }
}

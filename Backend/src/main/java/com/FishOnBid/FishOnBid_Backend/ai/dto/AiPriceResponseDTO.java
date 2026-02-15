package com.FishOnBid.FishOnBid_Backend.ai.dto;

/**
 * Response DTO for AI price suggestions.
 * Contains pricing recommendation with confidence range and structured explanation.
 */
public record AiPriceResponseDTO(
    double suggestedPrice,
    double minPrice,
    double maxPrice,
    double bidIncrement,
    String explanation,
    int dataPointsUsed,
    AiExplanationDTO breakdown
) {
    /**
     * Factory method with structured breakdown
     */
    public static AiPriceResponseDTO of(
            double suggestedPrice,
            double minPrice,
            double maxPrice,
            String explanation,
            int dataPointsUsed,
            AiExplanationDTO breakdown
    ) {
        double bidIncrement = Math.max(10, suggestedPrice * 0.02);
        return new AiPriceResponseDTO(
                suggestedPrice,
                minPrice,
                maxPrice,
                bidIncrement,
                explanation,
                dataPointsUsed,
                breakdown
        );
    }

    /**
     * Legacy factory method (backward compat)
     */
    public static AiPriceResponseDTO of(
            double suggestedPrice,
            double minPrice,
            double maxPrice,
            String explanation,
            int dataPointsUsed
    ) {
        return of(suggestedPrice, minPrice, maxPrice, explanation, dataPointsUsed, null);
    }
}

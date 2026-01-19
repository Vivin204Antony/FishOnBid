package com.FishOnBid.FishOnBid_Backend.ai.dto;

/**
 * Response DTO for AI price suggestions.
 * Contains pricing recommendation with confidence range and explanation.
 */
public record AiPriceResponseDTO(
    double suggestedPrice,
    double minPrice,
    double maxPrice,
    double bidIncrement,
    String explanation,
    int dataPointsUsed
) {
    /**
     * Factory method for creating response with default bid increment
     */
    public static AiPriceResponseDTO of(
            double suggestedPrice,
            double minPrice,
            double maxPrice,
            String explanation,
            int dataPointsUsed
    ) {
        // Default bid increment is 2% of suggested price, minimum 10
        double bidIncrement = Math.max(10, suggestedPrice * 0.02);
        return new AiPriceResponseDTO(
                suggestedPrice,
                minPrice,
                maxPrice,
                bidIncrement,
                explanation,
                dataPointsUsed
        );
    }
}

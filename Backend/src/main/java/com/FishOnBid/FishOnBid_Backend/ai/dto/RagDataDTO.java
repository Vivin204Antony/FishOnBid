package com.FishOnBid.FishOnBid_Backend.ai.dto;

/**
 * DTO for RAG (Retrieval-Augmented Generation) statistics.
 * Contains aggregated historical auction data.
 */
public record RagDataDTO(
    int auctionCount,
    double averagePrice,
    double minPrice,
    double maxPrice,
    double averageQuantityKg,
    String mostRecentLocation
) {
    /**
     * Check if sufficient data exists for reliable pricing
     */
    public boolean hasSufficientData() {
        return auctionCount >= 3;
    }

    /**
     * Get confidence level based on data points
     */
    public String getConfidenceLevel() {
        if (auctionCount >= 10) return "HIGH";
        if (auctionCount >= 5) return "MEDIUM";
        if (auctionCount >= 3) return "LOW";
        return "INSUFFICIENT";
    }

    /**
     * Empty result when no data found
     */
    public static RagDataDTO empty() {
        return new RagDataDTO(0, 0, 0, 0, 0, null);
    }
}

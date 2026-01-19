package com.FishOnBid.FishOnBid_Backend.ai.dto;

/**
 * Request DTO for AI-assisted price suggestions.
 * Contains fish details needed for RAG-based pricing.
 */
public record AiPriceRequestDTO(
    String fishName,
    double quantityKg,
    String location,
    Integer freshnessScore  // Optional: 0-100 quality indicator
) {
    /**
     * Constructor with default freshness score
     */
    public AiPriceRequestDTO(String fishName, double quantityKg, String location) {
        this(fishName, quantityKg, location, null);
    }
}

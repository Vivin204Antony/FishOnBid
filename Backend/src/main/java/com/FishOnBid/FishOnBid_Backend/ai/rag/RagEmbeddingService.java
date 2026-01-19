package com.FishOnBid.FishOnBid_Backend.ai.rag;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Embedding Service for RAG.
 * Converts auction data into normalized vector embeddings.
 * 
 * Current: Simple deterministic embeddings
 * Future: OpenAI/Cohere embeddings API
 */
@Service
@Slf4j
public class RagEmbeddingService {

    // Normalization constants
    private static final double MAX_PRICE = 5000.0;
    private static final double MAX_QUANTITY = 500.0;
    private static final long MAX_AGE_MS = 30L * 24 * 60 * 60 * 1000; // 30 days

    /**
     * Generate embedding vector for auction data.
     * 
     * @param fishName  Name of the fish
     * @param location  Harbor/market location
     * @param avgPrice  Average price
     * @param quantityKg Weight in kg
     * @param timestamp Unix timestamp
     * @return Normalized embedding vector
     */
    public double[] generateEmbedding(
            String fishName,
            String location,
            double avgPrice,
            double quantityKg,
            long timestamp
    ) {
        // Create 5-dimensional embedding
        double[] embedding = new double[5];

        // Dimension 0: Fish name hash (normalized 0-1)
        embedding[0] = normalizeHash(fishName != null ? fishName.toLowerCase() : "");

        // Dimension 1: Location hash (normalized 0-1)
        embedding[1] = normalizeHash(location != null ? location.toLowerCase() : "");

        // Dimension 2: Price (normalized 0-1)
        embedding[2] = Math.min(1.0, avgPrice / MAX_PRICE);

        // Dimension 3: Quantity (normalized 0-1)
        embedding[3] = Math.min(1.0, quantityKg / MAX_QUANTITY);

        // Dimension 4: Recency (1 = now, 0 = 30+ days old)
        long age = System.currentTimeMillis() - timestamp;
        embedding[4] = Math.max(0, 1.0 - (double) age / MAX_AGE_MS);

        // Normalize the vector
        return normalize(embedding);
    }

    /**
     * Generate query embedding (same logic, for consistency)
     */
    public double[] generateQueryEmbedding(String fishName, String location, double targetPrice) {
        return generateEmbedding(fishName, location, targetPrice, 50.0, System.currentTimeMillis());
    }

    /**
     * Normalize string to hash value between 0-1
     */
    private double normalizeHash(String str) {
        if (str == null || str.isEmpty()) return 0.5;
        int hash = Math.abs(str.hashCode());
        return (hash % 1000) / 1000.0;
    }

    /**
     * L2 normalize a vector
     */
    private double[] normalize(double[] vector) {
        double sum = 0;
        for (double v : vector) {
            sum += v * v;
        }
        double magnitude = Math.sqrt(sum);
        if (magnitude == 0) return vector;

        double[] normalized = new double[vector.length];
        for (int i = 0; i < vector.length; i++) {
            normalized[i] = vector[i] / magnitude;
        }
        return normalized;
    }
}

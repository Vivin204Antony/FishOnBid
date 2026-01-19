package com.FishOnBid.FishOnBid_Backend.ai.rag;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a document/entry in the RAG vector store.
 * Contains both the original data and its vector embedding.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagDocument {

    private String id;
    private String fishName;
    private String location;
    private double avgPrice;
    private double quantityKg;
    private long timestamp;
    
    /**
     * Vector embedding (normalized for cosine similarity)
     * Dimensions: [fishNameHash, locationHash, priceNorm, quantityNorm, timeNorm]
     */
    private double[] embedding;

    /**
     * Similarity score (set during query)
     */
    private double similarityScore;
}

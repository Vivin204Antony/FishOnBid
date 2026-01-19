package com.FishOnBid.FishOnBid_Backend.ai.rag;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * In-Memory Vector Store for RAG.
 * 
 * Feature Flags:
 * - rag.vector.store=IN_MEMORY (default)
 * - rag.vector.store=PINECONE (future)
 * 
 * Implements cosine similarity for semantic search.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RagVectorStore {

    private final RagEmbeddingService embeddingService;

    @Value("${rag.vector.store:IN_MEMORY}")
    private String storeType;

    // In-memory storage
    private final Map<String, RagDocument> documents = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        log.info("RAG Vector Store initialized: mode={}", storeType);
    }

    /**
     * Add a new document to the vector store
     */
    public void addDocument(RagDocument doc) {
        // Generate embedding if not present
        if (doc.getEmbedding() == null) {
            double[] embedding = embeddingService.generateEmbedding(
                    doc.getFishName(),
                    doc.getLocation(),
                    doc.getAvgPrice(),
                    doc.getQuantityKg(),
                    doc.getTimestamp()
            );
            doc.setEmbedding(embedding);
        }

        documents.put(doc.getId(), doc);
        log.debug("Added document to vector store: id={}, fishName={}", doc.getId(), doc.getFishName());
    }

    /**
     * Add multiple documents
     */
    public void addDocuments(List<RagDocument> docs) {
        docs.forEach(this::addDocument);
        log.info("Added {} documents to vector store", docs.size());
    }

    /**
     * Query for similar documents using cosine similarity
     * 
     * @param queryEmbedding Query vector
     * @param topK Number of results to return
     * @return List of similar documents with scores
     */
    public List<RagDocument> querySimilar(double[] queryEmbedding, int topK) {
        if (documents.isEmpty()) {
            log.warn("Vector store is empty, returning empty results");
            return Collections.emptyList();
        }

        return documents.values().stream()
                .map(doc -> {
                    double score = cosineSimilarity(queryEmbedding, doc.getEmbedding());
                    RagDocument copy = RagDocument.builder()
                            .id(doc.getId())
                            .fishName(doc.getFishName())
                            .location(doc.getLocation())
                            .avgPrice(doc.getAvgPrice())
                            .quantityKg(doc.getQuantityKg())
                            .timestamp(doc.getTimestamp())
                            .embedding(doc.getEmbedding())
                            .similarityScore(score)
                            .build();
                    return copy;
                })
                .sorted((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()))
                .limit(topK)
                .collect(Collectors.toList());
    }

    /**
     * Query by fish name and location
     */
    public List<RagDocument> queryByContext(String fishName, String location, double targetPrice, int topK) {
        double[] queryEmbedding = embeddingService.generateQueryEmbedding(fishName, location, targetPrice);
        
        log.info("RAG query: fishName={}, location={}, targetPrice={}", fishName, location, targetPrice);
        
        List<RagDocument> results = querySimilar(queryEmbedding, topK);
        
        log.info("RAG query returned {} results", results.size());
        return results;
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    private double cosineSimilarity(double[] a, double[] b) {
        if (a == null || b == null || a.length != b.length) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        double denominator = Math.sqrt(normA) * Math.sqrt(normB);
        if (denominator == 0) return 0.0;

        return dotProduct / denominator;
    }

    /**
     * Get store statistics
     */
    public Map<String, Object> getStats() {
        return Map.of(
                "storeType", storeType,
                "documentCount", documents.size(),
                "available", true
        );
    }

    /**
     * Clear all documents (for testing)
     */
    public void clear() {
        documents.clear();
        log.info("Vector store cleared");
    }

    /**
     * Get document count
     */
    public int size() {
        return documents.size();
    }
}

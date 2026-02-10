package com.FishOnBid.FishOnBid_Backend.ai.rag;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * RAG Query Service - Main interface for semantic auction search.
 * 
 * Responsibilities:
 * 1. Index completed auctions into vector store
 * 2. Execute semantic queries for price suggestions
 * 3. Maintain freshness of indexed data
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RagQueryService {

    private final RagVectorStore vectorStore;
    private final RagEmbeddingService embeddingService;
    private final AuctionRepository auctionRepository;

    @PostConstruct
    public void init() {
        log.info("RAG Query Service starting, indexing historical data...");
        indexCompletedAuctions();
    }

    /**
     * Index all completed auctions into the vector store
     */
    public void indexCompletedAuctions() {
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        
        List<Auction> completedAuctions = auctionRepository.findAll().stream()
                .filter(a -> !a.isActive())
                .filter(a -> a.getEndTime() != null && a.getEndTime().isAfter(thirtyDaysAgo))
                .collect(Collectors.toList());

        List<RagDocument> documents = completedAuctions.stream()
                .map(this::auctionToDocument)
                .collect(Collectors.toList());

        vectorStore.addDocuments(documents);
        log.info("Indexed {} completed auctions into vector store", documents.size());
    }

    /**
     * Convert Auction entity to RAG document
     */
    private RagDocument auctionToDocument(Auction auction) {
        return RagDocument.builder()
                .id(UUID.randomUUID().toString())
                .fishName(auction.getFishName())
                .location(auction.getLocation())
                .avgPrice(auction.getCurrentPrice())
                .quantityKg(auction.getQuantityKg() != null ? auction.getQuantityKg() : 0)
                .timestamp(auction.getEndTime() != null 
                        ? auction.getEndTime().toEpochMilli()
                        : System.currentTimeMillis())
                .build();
    }

    /**
     * Query for similar historical auctions
     * 
     * @param fishName Fish type to search for
     * @param location Market location (optional)
     * @param targetPrice Approximate price range
     * @param topK Number of results
     * @return List of similar historical auctions
     */
    public List<RagDocument> findSimilarAuctions(
            String fishName,
            String location,
            double targetPrice,
            int topK
    ) {
        log.info("Semantic search: fish={}, location={}, price={}", fishName, location, targetPrice);
        return vectorStore.queryByContext(fishName, location, targetPrice, topK);
    }

    /**
     * Get suggested price based on semantic similarity
     */
    public PriceSuggestion getSuggestedPrice(String fishName, String location) {
        List<RagDocument> similar = findSimilarAuctions(fishName, location, 0, 10);
        
        if (similar.isEmpty()) {
            log.warn("No similar auctions found for: {}", fishName);
            return new PriceSuggestion(0, 0, 0, "No historical data available");
        }

        // Calculate weighted average based on similarity
        double weightedSum = 0;
        double weightTotal = 0;
        double minPrice = Double.MAX_VALUE;
        double maxPrice = Double.MIN_VALUE;

        for (RagDocument doc : similar) {
            double weight = doc.getSimilarityScore();
            weightedSum += doc.getAvgPrice() * weight;
            weightTotal += weight;
            minPrice = Math.min(minPrice, doc.getAvgPrice());
            maxPrice = Math.max(maxPrice, doc.getAvgPrice());
        }

        double suggestedPrice = weightTotal > 0 ? weightedSum / weightTotal : 0;

        String explanation = String.format(
                "Based on %d similar auctions. Similarity-weighted average price. Range: ₹%.2f - ₹%.2f",
                similar.size(), minPrice, maxPrice
        );

        return new PriceSuggestion(suggestedPrice, minPrice, maxPrice, explanation);
    }

    /**
     * Scheduled task to refresh index every hour
     */
    @Scheduled(fixedRate = 3600000) // Every hour
    public void refreshIndex() {
        log.info("Refreshing RAG vector store index...");
        vectorStore.clear();
        indexCompletedAuctions();
    }

    /**
     * Get service status
     */
    public Map<String, Object> getStatus() {
        return Map.of(
                "vectorStoreStats", vectorStore.getStats(),
                "indexedDocuments", vectorStore.size(),
                "available", true
        );
    }

    /**
     * Simple price suggestion record
     */
    public record PriceSuggestion(
            double suggestedPrice,
            double minPrice,
            double maxPrice,
            String explanation
    ) {}
}

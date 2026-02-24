package com.FishOnBid.FishOnBid_Backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Data
public class Auction {

    public enum AuctionDataSource {
        USER_MANUAL,
        SYSTEM_GENERATED,
        GOVT_INSTITUTIONAL_API,
        SIMULATED_DEMO
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fishName;

    private double startPrice;
    private double currentPrice;

    private Instant startTime;
    private Instant endTime;

    private boolean active;

    // ===== NEW FIELDS FOR AI/RAG FUNCTIONALITY =====

    /**
     * Market/harbor location for location-based pricing
     */
    private String location;

    /**
     * Weight of catch in kilograms
     */
    private Double quantityKg;

    /**
     * AI-assigned freshness score (0-100)
     */
    private Integer freshnessScore;

    /**
     * Price suggested by AI (for audit purposes)
     */
    private Double aiSuggestedPrice;

    /**
     * Whether seller accepted AI suggestion
     */
    private Boolean aiSuggestionAccepted;

    /**
     * Fish image URL for Vision AI analysis
     */
    @Column(length = 2000)
    private String imageUrl;

    /**
     * Fish image as Base64 for display on auction cards (captured via camera)
     */
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String imageBase64;

    /**
     * Seller notes/description
     */
    @Column(length = 500)
    private String sellerNotes;

    @Column(length = 1000)
    private String aiExplanation;

    /**
     * Source of the auction record (for RAG weighting)
     */
    @Enumerated(EnumType.STRING)
    private AuctionDataSource dataSource = AuctionDataSource.USER_MANUAL;
}

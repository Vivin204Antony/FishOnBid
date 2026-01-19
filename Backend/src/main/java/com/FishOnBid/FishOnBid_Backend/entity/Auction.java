package com.FishOnBid.FishOnBid_Backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fishName;

    private double startPrice;
    private double currentPrice;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

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
    @Column(length = 1000)
    private String imageUrl;

    /**
     * Seller notes/description
     */
    @Column(length = 500)
    private String sellerNotes;

    /**
     * AI-generated quality explanation text
     */
    @Column(length = 1000)
    private String aiExplanation;
}

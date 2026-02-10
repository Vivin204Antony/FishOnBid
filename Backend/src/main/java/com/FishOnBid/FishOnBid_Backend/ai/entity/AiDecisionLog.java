package com.FishOnBid.FishOnBid_Backend.ai.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

/**
 * Entity for tracking AI decisions for audit and debugging.
 * Stores all AI pricing requests and responses.
 */
@Entity
@Table(name = "ai_decision_logs")
@Data
public class AiDecisionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String requestType; // PRICE_SUGGESTION, VISION_ANALYSIS

    @Column(columnDefinition = "TEXT")
    private String inputData; // JSON of request

    @Column(columnDefinition = "TEXT")
    private String outputData; // JSON of response

    private Integer dataPointsUsed; // Number of historical records used

    private Long processingTimeMs; // Performance metric

    @Column(nullable = false)
    private Instant timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }
}

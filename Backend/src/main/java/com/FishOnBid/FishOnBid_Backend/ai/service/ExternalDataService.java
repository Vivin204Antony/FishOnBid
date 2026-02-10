package com.FishOnBid.FishOnBid_Backend.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ExternalDataService - Bridge to external market data sources.
 * Connects to Government Fisheries APIs or real-time harbor feeds.
 */
@Service
@Slf4j
public class ExternalDataService {

    // Cache for external market indices (e.g., "Tuna" -> 550.0)
    private final Map<String, Double> externalMarketIndex = new ConcurrentHashMap<>();

    public ExternalDataService() {
        // Initialize with some "real-time" baseline for demo purposes
        externalMarketIndex.put("Tuna", 510.0);
        externalMarketIndex.put("Salmon", 690.0);
        externalMarketIndex.put("Pomfret", 610.0);
    }

    /**
     * Get the latest market price from external sources for a specific fish.
     */
    public Double getExternalMarketPrice(String fishName) {
        log.info("Fetching external market price for: {}", fishName);
        return externalMarketIndex.getOrDefault(fishName, null);
    }

    /**
     * Update external index (called by scheduled tasks or webhooks).
     */
    public void updateMarketIndex(String fishName, Double price) {
        log.info("Updating external market index for {}: {}", fishName, price);
        externalMarketIndex.put(fishName, price);
    }
}

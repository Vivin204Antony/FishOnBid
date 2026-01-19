package com.FishOnBid.FishOnBid_Backend.events;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * In-Memory Event Bus - Listens to all domain events.
 * 
 * Responsibilities:
 * 1. Log all events for debugging
 * 2. Maintain recent event history for monitoring
 * 3. Forward events to WebSocket handlers
 * 
 * This is the migration point for Kafka integration.
 */
@Component
@Slf4j
public class InMemoryEventBus {

    // Keep last 100 events for monitoring
    private final ConcurrentLinkedQueue<DomainEvent> recentEvents = new ConcurrentLinkedQueue<>();
    private static final int MAX_EVENTS = 100;

    @EventListener
    public void handleAuctionCreated(AuctionCreatedEvent event) {
        recordEvent(event);
        log.info("📢 {}", event);
        // TODO: Forward to WebSocket for dashboard updates
    }

    @EventListener
    public void handleBidPlaced(BidPlacedEvent event) {
        recordEvent(event);
        log.info("💰 {}", event);
        // TODO: Forward to WebSocket for real-time bid updates
    }

    @EventListener
    public void handleAuctionClosed(AuctionClosedEvent event) {
        recordEvent(event);
        log.info("🏁 {}", event);
        // TODO: Forward to WebSocket for auction closure notification
    }

    /**
     * Record event to history
     */
    private void recordEvent(DomainEvent event) {
        recentEvents.add(event);
        // Trim to max size
        while (recentEvents.size() > MAX_EVENTS) {
            recentEvents.poll();
        }
    }

    /**
     * Get recent events for monitoring
     */
    public List<DomainEvent> getRecentEvents() {
        return new ArrayList<>(recentEvents);
    }

    /**
     * Get recent events of a specific type
     */
    public List<DomainEvent> getRecentEvents(String eventType) {
        return recentEvents.stream()
                .filter(e -> e.getEventType().equals(eventType))
                .toList();
    }

    /**
     * Get event statistics
     */
    public EventStats getStats() {
        long auctionCreated = recentEvents.stream()
                .filter(e -> e instanceof AuctionCreatedEvent).count();
        long bidPlaced = recentEvents.stream()
                .filter(e -> e instanceof BidPlacedEvent).count();
        long auctionClosed = recentEvents.stream()
                .filter(e -> e instanceof AuctionClosedEvent).count();

        return new EventStats(recentEvents.size(), auctionCreated, bidPlaced, auctionClosed);
    }

    public record EventStats(
            long totalEvents,
            long auctionCreatedCount,
            long bidPlacedCount,
            long auctionClosedCount
    ) {}
}

package com.FishOnBid.FishOnBid_Backend.events;

import lombok.Getter;
import java.time.LocalDateTime;

/**
 * Base class for all domain events.
 * Provides common fields and timestamp.
 */
@Getter
public abstract class DomainEvent {
    
    private final String eventId;
    private final String eventType;
    private final LocalDateTime timestamp;

    protected DomainEvent(String eventType) {
        this.eventId = java.util.UUID.randomUUID().toString();
        this.eventType = eventType;
        this.timestamp = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return String.format("EVENT → %s → id=%s → time=%s", eventType, eventId, timestamp);
    }
}

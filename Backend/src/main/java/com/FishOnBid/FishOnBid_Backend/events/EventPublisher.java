package com.FishOnBid.FishOnBid_Backend.events;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * Event Publisher - Facade for publishing domain events.
 * 
 * Current: Uses Spring's ApplicationEventPublisher (in-memory)
 * Future: Can be switched to Kafka producer without changing callers
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class EventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;

    /**
     * Publish a domain event.
     * All event handlers subscribed to this event type will be notified.
     */
    public void publish(DomainEvent event) {
        log.info("{}", event);
        applicationEventPublisher.publishEvent(event);
    }

    /**
     * Publish auction created event
     */
    public void publishAuctionCreated(Long auctionId, String fishName, Double startPrice, 
                                       String location, String createdBy) {
        publish(new AuctionCreatedEvent(auctionId, fishName, startPrice, location, createdBy));
    }

    /**
     * Publish bid placed event
     */
    public void publishBidPlaced(Long auctionId, Long bidId, Double amount, Double previousPrice,
                                  String bidderEmail, String fishName) {
        publish(new BidPlacedEvent(auctionId, bidId, amount, previousPrice, bidderEmail, fishName));
    }

    /**
     * Publish auction closed event
     */
    public void publishAuctionClosed(Long auctionId, String fishName, Double finalPrice,
                                      String winnerEmail, int totalBids) {
        publish(new AuctionClosedEvent(auctionId, fishName, finalPrice, winnerEmail, totalBids));
    }
}

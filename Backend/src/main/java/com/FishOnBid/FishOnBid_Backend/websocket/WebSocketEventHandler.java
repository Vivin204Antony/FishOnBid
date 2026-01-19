package com.FishOnBid.FishOnBid_Backend.websocket;

import com.FishOnBid.FishOnBid_Backend.events.BidPlacedEvent;
import com.FishOnBid.FishOnBid_Backend.events.AuctionClosedEvent;
import com.FishOnBid.FishOnBid_Backend.events.AuctionCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * WebSocket Event Handler.
 * Listens to domain events and broadcasts to subscribed clients.
 * 
 * Topics:
 * - /topic/auction/{id}: Auction-specific updates (bids, close)
 * - /topic/bids: All bid activity (for dashboard)
 * - /topic/auctions: New auction notifications
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class WebSocketEventHandler {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Handle bid placed events - push to auction subscribers
     */
    @EventListener
    public void handleBidPlaced(BidPlacedEvent event) {
        String destination = "/topic/auction/" + event.getAuctionId();
        
        Map<String, Object> payload = Map.of(
                "type", "BID_PLACED",
                "auctionId", event.getAuctionId(),
                "currentPrice", event.getAmount(),
                "previousPrice", event.getPreviousPrice(),
                "bidder", maskEmail(event.getBidderEmail()),
                "timestamp", event.getTimestamp().toString(),
                "status", "ACTIVE"
        );

        messagingTemplate.convertAndSend(destination, payload);
        messagingTemplate.convertAndSend("/topic/bids", payload);
        
        log.info("WS PUSH → {} → BidPlaced → ₹{}", destination, event.getAmount());
    }

    /**
     * Handle auction closed events
     */
    @EventListener
    public void handleAuctionClosed(AuctionClosedEvent event) {
        String destination = "/topic/auction/" + event.getAuctionId();
        
        Map<String, Object> payload = Map.of(
                "type", "AUCTION_CLOSED",
                "auctionId", event.getAuctionId(),
                "finalPrice", event.getFinalPrice(),
                "winner", event.isHasWinner() ? maskEmail(event.getWinnerEmail()) : "None",
                "totalBids", event.getTotalBids(),
                "timestamp", event.getTimestamp().toString(),
                "status", "CLOSED"
        );

        messagingTemplate.convertAndSend(destination, payload);
        messagingTemplate.convertAndSend("/topic/auctions", payload);
        
        log.info("WS PUSH → {} → AuctionClosed → ₹{}", destination, event.getFinalPrice());
    }

    /**
     * Handle new auction created events
     */
    @EventListener
    public void handleAuctionCreated(AuctionCreatedEvent event) {
        Map<String, Object> payload = Map.of(
                "type", "AUCTION_CREATED",
                "auctionId", event.getAuctionId(),
                "fishName", event.getFishName(),
                "startPrice", event.getStartPrice(),
                "location", event.getLocation() != null ? event.getLocation() : "Unknown",
                "timestamp", event.getTimestamp().toString(),
                "status", "ACTIVE"
        );

        messagingTemplate.convertAndSend("/topic/auctions", payload);
        
        log.info("WS PUSH → /topic/auctions → AuctionCreated → {}", event.getFishName());
    }

    /**
     * Mask email for privacy
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "anonymous";
        }
        String[] parts = email.split("@");
        String name = parts[0];
        String masked = name.length() > 2 
                ? name.substring(0, 2) + "***" 
                : name + "***";
        return masked + "@" + parts[1];
    }
}

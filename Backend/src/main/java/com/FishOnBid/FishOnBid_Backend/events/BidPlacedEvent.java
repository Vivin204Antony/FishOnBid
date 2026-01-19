package com.FishOnBid.FishOnBid_Backend.events;

import lombok.Getter;

/**
 * Event published when a new bid is placed.
 * This is the most frequent event and drives real-time updates.
 */
@Getter
public class BidPlacedEvent extends DomainEvent {

    private final Long auctionId;
    private final Long bidId;
    private final Double amount;
    private final Double previousPrice;
    private final String bidderEmail;
    private final String fishName;

    public BidPlacedEvent(Long auctionId, Long bidId, Double amount, Double previousPrice, 
                          String bidderEmail, String fishName) {
        super("BidPlaced");
        this.auctionId = auctionId;
        this.bidId = bidId;
        this.amount = amount;
        this.previousPrice = previousPrice;
        this.bidderEmail = bidderEmail;
        this.fishName = fishName;
    }

    @Override
    public String toString() {
        return String.format("EVENT → BidPlaced → AuctionId=%d → Amount=₹%.2f → Bidder=%s",
                auctionId, amount, bidderEmail);
    }
}

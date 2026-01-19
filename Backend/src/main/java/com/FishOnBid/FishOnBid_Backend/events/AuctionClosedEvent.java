package com.FishOnBid.FishOnBid_Backend.events;

import lombok.Getter;

/**
 * Event published when an auction is closed.
 * Indicates end of bidding, may or may not have a winner.
 */
@Getter
public class AuctionClosedEvent extends DomainEvent {

    private final Long auctionId;
    private final String fishName;
    private final Double finalPrice;
    private final String winnerEmail;
    private final int totalBids;
    private final boolean hasWinner;

    public AuctionClosedEvent(Long auctionId, String fishName, Double finalPrice, 
                              String winnerEmail, int totalBids) {
        super("AuctionClosed");
        this.auctionId = auctionId;
        this.fishName = fishName;
        this.finalPrice = finalPrice;
        this.winnerEmail = winnerEmail;
        this.totalBids = totalBids;
        this.hasWinner = winnerEmail != null && !winnerEmail.isBlank();
    }

    @Override
    public String toString() {
        return String.format("EVENT → AuctionClosed → AuctionId=%d → FinalPrice=₹%.2f → Winner=%s",
                auctionId, finalPrice, hasWinner ? winnerEmail : "NONE");
    }
}

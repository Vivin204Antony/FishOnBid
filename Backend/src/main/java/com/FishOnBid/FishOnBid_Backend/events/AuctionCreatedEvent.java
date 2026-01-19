package com.FishOnBid.FishOnBid_Backend.events;

import lombok.Getter;

/**
 * Event published when a new auction is created.
 */
@Getter
public class AuctionCreatedEvent extends DomainEvent {

    private final Long auctionId;
    private final String fishName;
    private final Double startPrice;
    private final String location;
    private final String createdBy;

    public AuctionCreatedEvent(Long auctionId, String fishName, Double startPrice, String location, String createdBy) {
        super("AuctionCreated");
        this.auctionId = auctionId;
        this.fishName = fishName;
        this.startPrice = startPrice;
        this.location = location;
        this.createdBy = createdBy;
    }

    @Override
    public String toString() {
        return String.format("EVENT → AuctionCreated → AuctionId=%d → Fish=%s → Price=₹%.2f",
                auctionId, fishName, startPrice);
    }
}

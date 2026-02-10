package com.FishOnBid.FishOnBid_Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
public class AuctionResultDTO {

    private Long auctionId;
    private String fishName;
    private boolean active;

    private Double winningAmount;
    private String winnerEmail;

    private int totalBids;
    private Instant endTime;

    private List<BidSummaryDTO> bids;
}

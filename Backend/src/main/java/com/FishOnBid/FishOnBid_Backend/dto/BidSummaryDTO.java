package com.FishOnBid.FishOnBid_Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class BidSummaryDTO {
    private Double amount;
    private String bidderEmail;
    private Instant bidTime;
}

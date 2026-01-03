package com.FishOnBid.FishOnBid_Backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class BidSummaryDTO {
    private Double amount;
    private String bidderEmail;
    private LocalDateTime bidTime;
}

package com.FishOnBid.FishOnBid_Backend.dto;

import lombok.Data;

@Data
public class BidRequestDTO {
    private double amount;
    private String bidderEmail;
}

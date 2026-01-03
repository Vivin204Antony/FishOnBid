package com.FishOnBid.FishOnBid_Backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fishName;

    private double startPrice;
    private double currentPrice;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private boolean active;
}

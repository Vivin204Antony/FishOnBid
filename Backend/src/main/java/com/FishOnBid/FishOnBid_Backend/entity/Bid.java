package com.FishOnBid.FishOnBid_Backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Data
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double amount;
    private String bidderEmail;

    private Instant bidTime;

    @ManyToOne
    private Auction auction;
}

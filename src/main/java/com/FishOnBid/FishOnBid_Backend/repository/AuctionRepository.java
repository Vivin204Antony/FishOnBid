package com.FishOnBid.FishOnBid_Backend.repository;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuctionRepository extends JpaRepository<Auction, Long> {
}

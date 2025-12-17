package com.FishOnBid.FishOnBid_Backend.repository;

import com.FishOnBid.FishOnBid_Backend.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BidRepository extends JpaRepository<Bid, Long> {
}

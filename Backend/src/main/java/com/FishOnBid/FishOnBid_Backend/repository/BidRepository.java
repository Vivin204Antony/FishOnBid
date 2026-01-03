package com.FishOnBid.FishOnBid_Backend.repository;

import com.FishOnBid.FishOnBid_Backend.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<Bid, Long> {

    Optional<Bid> findTopByAuctionIdOrderByAmountDesc(Long auctionId);

    List<Bid> findByAuctionIdOrderByAmountDesc(Long auctionId);

}

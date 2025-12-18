package com.FishOnBid.FishOnBid_Backend.service;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.entity.Bid;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import com.FishOnBid.FishOnBid_Backend.repository.BidRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuctionService {

    private final AuctionRepository auctionRepo;
    private final BidRepository bidRepo;

    @Transactional
    public Bid placeBid(Long auctionId, double amount, String email) {

        Auction auction = auctionRepo.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new RuntimeException("Auction not found"));

        if (!auction.isActive()) {
            throw new RuntimeException("Auction is closed");
        }

        if (amount <= auction.getCurrentPrice()) {
            throw new RuntimeException("Bid must be higher than current price");
        }

        auction.setCurrentPrice(amount);

        Bid bid = new Bid();
        bid.setAmount(amount);
        bid.setBidderEmail(email);
        bid.setAuction(auction);
        bid.setBidTime(LocalDateTime.now());

        bidRepo.save(bid);
        auctionRepo.save(auction);

        return bid;
    }
}

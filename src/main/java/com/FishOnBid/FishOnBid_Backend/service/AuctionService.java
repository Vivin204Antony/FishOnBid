package com.FishOnBid.FishOnBid_Backend.service;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.entity.Bid;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import com.FishOnBid.FishOnBid_Backend.repository.BidRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuctionService {

    private final AuctionRepository auctionRepo;
    private final BidRepository bidRepo;

    public Auction createAuction(Auction auction) {
        auction.setCurrentPrice(auction.getStartPrice());
        auction.setStartTime(LocalDateTime.now());
        auction.setActive(true);
        return auctionRepo.save(auction);
    }

    public List<Auction> getAllAuctions() {
        return auctionRepo.findAll();
    }

    public Auction getAuctionById(Long id) {
        return auctionRepo.findById(id).orElseThrow();
    }

    public Bid placeBid(Long auctionId, double amount, String email) {
        Auction auction = auctionRepo.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Auction not found"));

        if (!auction.isActive()) {
            throw new RuntimeException("Auction closed");
        }

        if (amount <= auction.getCurrentPrice()) {
            throw new RuntimeException("Bid must be higher");
        }

        auction.setCurrentPrice(amount);
        auctionRepo.save(auction);

        Bid bid = new Bid();
        bid.setAmount(amount);
        bid.setBidderEmail(email);
        bid.setAuction(auction);
        bid.setBidTime(LocalDateTime.now());

        return bidRepo.save(bid);
    }
}

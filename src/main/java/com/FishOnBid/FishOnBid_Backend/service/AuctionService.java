package com.FishOnBid.FishOnBid_Backend.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.entity.Bid;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import com.FishOnBid.FishOnBid_Backend.repository.BidRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuctionService {

    private final AuctionRepository auctionRepo;
    private final BidRepository bidRepo;

    public Auction createAuction(Auction auction) {
        auction.setActive(true);
        return auctionRepo.save(auction);
    }

    @Transactional
    public Bid closeAuctionAndSelectWinner(Long auctionId) {

        Auction auction = auctionRepo.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Auction not found"));

        if (!auction.isActive()) {
            throw new RuntimeException("Auction already closed");
        }

        // Find highest bid
        Bid winningBid = bidRepo
                .findTopByAuctionIdOrderByAmountDesc(auctionId)
                .orElseThrow(() -> new RuntimeException("No bids placed"));

        // Close auction
        auction.setActive(false);
        auctionRepo.save(auction);

        return winningBid;
    }


    @Transactional
    public Bid placeBid(Long auctionId, double amount, String email) {

        Auction auction = auctionRepo.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new RuntimeException("Auction not found"));

        // ⛔ Auto-close check
        if (LocalDateTime.now().isAfter(auction.getEndTime())) {
            auction.setActive(false);
            auctionRepo.save(auction);
            throw new RuntimeException("Auction has ended");
        }

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

    public Map<String, Object> getAuctionSummary(Long auctionId) {

        Auction auction = auctionRepo.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Auction not found"));

        List<Bid> bids = bidRepo.findByAuctionIdOrderByAmountDesc(auctionId);

        Bid winningBid = bids.isEmpty() ? null : bids.get(0);

        Map<String, Object> summary = new HashMap<>();
        summary.put("auctionId", auction.getId());
        summary.put("FishName", auction.getFishName());
        summary.put("status", auction.isActive() ? "ACTIVE" : "CLOSED");
        summary.put("totalBids", bids.size());
        summary.put("currentPrice", auction.getCurrentPrice());
        summary.put("winningBid", winningBid);
        summary.put("bidHistory", bids);

        return summary;
    }

    public Auction getAuctionById(Long id) {
        return auctionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Auction not found"));
    }

    public Bid getWinningBid(Long auctionId) {
        return bidRepo.findTopByAuctionIdOrderByAmountDesc(auctionId)
                .orElseThrow(() -> new RuntimeException("No bids found"));
    }

    public List<Bid> getBidHistory(Long auctionId) {
        return bidRepo.findByAuctionIdOrderByAmountDesc(auctionId);
    }

}

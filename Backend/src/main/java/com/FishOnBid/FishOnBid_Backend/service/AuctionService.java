package com.FishOnBid.FishOnBid_Backend.service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.entity.Bid;
import com.FishOnBid.FishOnBid_Backend.events.EventPublisher;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import com.FishOnBid.FishOnBid_Backend.repository.BidRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionService {

    private final AuctionRepository auctionRepo;
    private final BidRepository bidRepo;
    private final EventPublisher eventPublisher;

    public Auction createAuction(Auction auction) {
        auction.setActive(true);
        Auction saved = auctionRepo.save(auction);
        
        // Publish event
        eventPublisher.publishAuctionCreated(
                saved.getId(),
                saved.getFishName(),
                saved.getStartPrice(),
                saved.getLocation(),
                "system" // TODO: Get from security context
        );
        
        log.info("Auction created: id={}, fish={}", saved.getId(), saved.getFishName());
        return saved;
    }

    @Transactional
    public Bid closeAuctionAndSelectWinner(Long auctionId) {
        Auction auction = auctionRepo.findById(auctionId)
                .orElseThrow(() -> new RuntimeException("Auction not found"));

        if (!auction.isActive()) {
            throw new RuntimeException("Auction already closed");
        }

        List<Bid> bids = bidRepo.findByAuctionIdOrderByAmountDesc(auctionId);
        Bid winningBid = bids.isEmpty() ? null : bids.get(0);

        // Close auction
        auction.setActive(false);
        auctionRepo.save(auction);

        // Publish event
        eventPublisher.publishAuctionClosed(
                auction.getId(),
                auction.getFishName(),
                auction.getCurrentPrice(),
                winningBid != null ? winningBid.getBidderEmail() : null,
                bids.size()
        );

        log.info("Auction closed: id={}, winner={}", auctionId, 
                winningBid != null ? winningBid.getBidderEmail() : "NONE");
        
        if (winningBid == null) {
            throw new RuntimeException("No bids placed");
        }
        return winningBid;
    }

    @Transactional
    public Bid placeBid(Long auctionId, double amount, String email) {
        Auction auction = auctionRepo.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new RuntimeException("Auction not found"));

        // Auto-close check
        if (Instant.now().isAfter(auction.getEndTime())) {
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

        double previousPrice = auction.getCurrentPrice();
        auction.setCurrentPrice(amount);

        Bid bid = new Bid();
        bid.setAmount(amount);
        bid.setBidderEmail(email);
        bid.setAuction(auction);
        bid.setBidTime(Instant.now()); 

        bidRepo.save(bid);
        auctionRepo.save(auction);

        // Publish event - THIS IS THE KEY FOR REAL-TIME UPDATES
        eventPublisher.publishBidPlaced(
                auctionId,
                bid.getId(),
                amount,
                previousPrice,
                email,
                auction.getFishName()
        );

        log.info("Bid placed: auctionId={}, amount={}, bidder={}", auctionId, amount, email);
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

    public List<Auction> getAllAuctions() {
        return auctionRepo.findAll();
    }

    public List<Auction> getActiveAuctions() {
        return auctionRepo.findByActiveTrue();
    }

    public void deleteAuction(Long id) {
        auctionRepo.deleteById(id);
    }
}

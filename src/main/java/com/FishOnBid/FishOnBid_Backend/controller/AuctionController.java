package com.FishOnBid.FishOnBid_Backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.entity.Bid;
import com.FishOnBid.FishOnBid_Backend.service.AuctionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auctions")
@RequiredArgsConstructor
@CrossOrigin
public class AuctionController {

    private final AuctionService auctionService;

    // 🔹 Create new auction
    @PostMapping
    public Auction createAuction(@RequestBody Auction auction) {
        return auctionService.createAuction(auction);
    }

    // 🔹 Place a bid on auction
    @PostMapping("/{id}/bid")
    public Bid placeBid(
            @PathVariable Long id,
            @RequestBody Map<String, Double> request,
            @RequestHeader("Authorization") String authHeader
    ) {
        String token = authHeader.substring(7);
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        double amount = request.get("amount");
        return auctionService.placeBid(id, amount, email);
    }

    // 🔹 Close auction & select winner
    @PostMapping("/{id}/close")
    public Bid closeAuction(@PathVariable Long id) {
        return auctionService.closeAuctionAndSelectWinner(id);
    }

    // 🔹 Get winner of auction
    @GetMapping("/{id}/winner")
    public Bid getWinner(@PathVariable Long id) {
        return auctionService.getWinningBid(id);
    }

    // 🔹 Get full bid history
    @GetMapping("/{id}/bids")
    public List<Bid> getBidHistory(@PathVariable Long id) {
        return auctionService.getBidHistory(id);
    }

    // 🔹 Get auction summary (auction + winner + bids)
    @GetMapping("/{id}/summary")
    public Auction getAuctionSummary(@PathVariable Long id) {
        return auctionService.getAuctionById(id);
    }
}

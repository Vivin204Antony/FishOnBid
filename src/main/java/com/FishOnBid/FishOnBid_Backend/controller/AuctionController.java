package com.FishOnBid.FishOnBid_Backend.controller;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.entity.Bid;
import com.FishOnBid.FishOnBid_Backend.service.AuctionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auctions")
@RequiredArgsConstructor
@CrossOrigin
public class AuctionController {

    private final AuctionService auctionService;

    @PostMapping
    public Auction createAuction(@RequestBody Auction auction) {
        return auctionService.createAuction(auction);
    }

    @GetMapping
    public List<Auction> getAllAuctions() {
        return auctionService.getAllAuctions();
    }

    @GetMapping("/{id}")
    public Auction getAuction(@PathVariable Long id) {
        return auctionService.getAuctionById(id);
    }

    @PostMapping("/{id}/bid")
    public Bid placeBid(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        double amount = Double.parseDouble(request.get("amount"));
        String email = request.get("email");
        return auctionService.placeBid(id, amount, email);
    }
}

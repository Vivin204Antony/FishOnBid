package com.FishOnBid.FishOnBid_Backend.controller;

import com.FishOnBid.FishOnBid_Backend.dto.BidRequestDTO;
import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.entity.Bid;
import com.FishOnBid.FishOnBid_Backend.service.AuctionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auctions")
@RequiredArgsConstructor
@CrossOrigin
public class AuctionController {

    private final AuctionService auctionService;

    @PostMapping("/{id}/bid")
    public Bid placeBid(
            @PathVariable Long id,
            @RequestBody BidRequestDTO request
    ) {
        return auctionService.placeBid(
                id,
                request.getAmount(),
                request.getBidderEmail()
        );
    }
}


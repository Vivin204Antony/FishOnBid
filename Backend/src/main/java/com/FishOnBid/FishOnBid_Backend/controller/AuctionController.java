package com.FishOnBid.FishOnBid_Backend.controller;

import java.util.List;
import java.util.Map;

import com.FishOnBid.FishOnBid_Backend.dto.AuctionMetadataDTO;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.entity.Bid;
import com.FishOnBid.FishOnBid_Backend.service.AuctionService;
import com.FishOnBid.FishOnBid_Backend.service.CloudinaryService;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/auctions")
@CrossOrigin
public class AuctionController {

    private final AuctionService auctionService;
    private final CloudinaryService cloudinaryService;

    public AuctionController(AuctionService auctionService, CloudinaryService cloudinaryService) {
        this.auctionService = auctionService;
        this.cloudinaryService = cloudinaryService;
    }

    // 🔹 Get all auctions
    @GetMapping
    public List<Auction> getAllAuctions() {
        return auctionService.getAllAuctions();
    }

    // 🔹 Get active auctions (ordered by newest first)
    @GetMapping("/active")
    public List<Auction> getActiveAuctions() {
        return auctionService.getActiveAuctions();
    }

    // 🔹 Get truly live auctions (active AND not expired, ordered by newest first)
    @GetMapping("/live")
    public List<Auction> getLiveAuctions() {
        return auctionService.getLiveAuctions();
    }

    // 🔹 Get closed auctions (inactive OR expired)
    @GetMapping("/closed")
    public List<Auction> getClosedAuctions() {
        return auctionService.getClosedAuctions();
    }

    // 🔹 Get closed auctions WITH at least one bid — for the Results page
    @GetMapping("/results")
    public List<Auction> getAuctionResults() {
        return auctionService.getClosedAuctionsWithBids();
    }

    // 🔹 Get auction by ID
    @GetMapping("/{id}")
    public Auction getAuctionById(@PathVariable Long id) {
        return auctionService.getAuctionById(id);
    }

    // 🔹 Create new auction
    @PostMapping
    public Auction createAuction(@RequestBody Auction auction) {
        // Capture the seller's email so admin panel can distinguish Auctioneers from Bidders
        String sellerEmail = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        auction.setSellerEmail(sellerEmail);
        return auctionService.createAuction(auction);
    }

    // 🔹 Place a bid on auction
    @PostMapping("/{id}/bid")
    public Bid placeBid(
            @PathVariable Long id,
            @RequestBody Map<String, Double> request
    ) {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        Double amount = request.get("amount");
        if (amount == null) {
            throw new RuntimeException("Bid amount is required");
        }
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
    public Map<String, Object> getAuctionSummary(@PathVariable Long id) {
        return auctionService.getAuctionSummary(id);
    }

    // 🔹 Get available fish types and locations (for dropdowns)
    @GetMapping("/metadata")
    public AuctionMetadataDTO getAuctionMetadata() {
        List<String> fishTypes = auctionService.getAvailableFishTypes();
        List<String> locations = auctionService.getAvailableLocations();
        return AuctionMetadataDTO.of(fishTypes, locations);
    }

    // 🔹 Delete a video from Cloudinary (used when seller removes video before submitting)
    @DeleteMapping("/video")
    public Map<String, Object> deleteVideo(@RequestBody Map<String, String> request) {
        String videoUrl = request.get("videoUrl");
        boolean deleted = cloudinaryService.deleteVideo(videoUrl);
        return Map.of("deleted", deleted);
    }
}

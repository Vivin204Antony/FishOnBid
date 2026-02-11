package com.FishOnBid.FishOnBid_Backend.controller;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * AdminController - Administrative endpoints for data management.
 * Primarily used for bulk importing historical data to train the AI.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final AuctionRepository auctionRepository;

    /**
     * Bulk import auctions from JSON list.
     * Useful for importing external datasets or migrations.
     */
    @PostMapping("/import/auctions")
    public ResponseEntity<Map<String, Object>> importAuctions(@RequestBody List<Map<String, Object>> data) {
        log.info("Received bulk import request for {} items", data.size());
        
        List<Auction> auctions = data.stream().map(item -> {
            Auction auction = new Auction();
            auction.setFishName((String) item.get("fishName"));
            auction.setLocation((String) item.get("location"));
            auction.setStartPrice(((Number) item.get("startPrice")).doubleValue());
            auction.setCurrentPrice(((Number) item.get("currentPrice")).doubleValue());
            auction.setQuantityKg(item.get("quantityKg") != null ? ((Number) item.get("quantityKg")).doubleValue() : null);
            auction.setFreshnessScore(item.get("freshnessScore") != null ? ((Number) item.get("freshnessScore")).intValue() : null);
            auction.setActive(false);
            
            // Handle dates or use current if missing
            String endTimeStr = (String) item.get("endTime");
            if (endTimeStr != null) {
                auction.setEndTime(Instant.parse(endTimeStr));
                auction.setStartTime(auction.getEndTime().minus(12, ChronoUnit.HOURS));
            } else {
                auction.setEndTime(Instant.now());
                auction.setStartTime(Instant.now().minus(12, ChronoUnit.HOURS));
            }
            
            auction.setDataSource(Auction.AuctionDataSource.SYSTEM_GENERATED);
            return auction;
        }).collect(Collectors.toList());

        List<Auction> saved = auctionRepository.saveAll(auctions);
        log.info("Successfully imported and saved {} auctions", saved.size());

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "count", saved.size(),
                "message", "Historical data imported successfully"
        ));
    }
}

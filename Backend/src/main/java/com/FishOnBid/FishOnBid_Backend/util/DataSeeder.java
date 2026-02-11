package com.FishOnBid.FishOnBid_Backend.util;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * DataSeeder - Automated historical data generator for FishOnBid.
 * Ensures the system always has 500+ data points for high-quality RAG evaluation.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final AuctionRepository auctionRepository;
    private final Random random = new Random();

    @Override
    public void run(String... args) {
        long count = auctionRepository.count();
        log.info("Current total auction count: {}", count);

        // We targeted 500 records before, let's now target 550 (500 historical + 50 live)
        if (count < 550) {
            log.info("Detected low data volume ({} records). Re-seeding diversified data...", count);
            seedDiversifiedData(500, 50); 
        } else {
            log.info("Sufficient data present ({} records). Skipping automated seeding.", count);
        }
    }

    private void seedDiversifiedData(int historicalCount, int liveCount) {
        String[] fishTypes = {"Tuna", "Salmon", "Mackerel", "Pomfret", "Prawns", "Kingfish", "Sardines", "Rohu", "Catla", "Hilsa", "Squid", "Crab", "Lobster"};
        String[] locations = {"Chennai Harbor", "Kochi Harbor", "Vizag Harbor", "Mumbai Harbor", "Goa Harbor", "Mangalore Harbor", "Tuticorin Harbor", "Kolkata Port"};
        
        List<Auction> bulkAuctions = new ArrayList<>();
        
        // 1. Generate Historical Data (Closed)
        log.info("Generating {} historical auctions...", historicalCount);
        for (int i = 0; i < historicalCount; i++) {
            bulkAuctions.add(generateRandomAuction(fishTypes, locations, false));
            if (bulkAuctions.size() >= 100) {
                auctionRepository.saveAll(bulkAuctions);
                bulkAuctions.clear();
            }
        }
        
        // 2. Generate Live Data (Active)
        log.info("Generating {} LIVE auctions for UI visibility...", liveCount);
        for (int i = 0; i < liveCount; i++) {
            bulkAuctions.add(generateRandomAuction(fishTypes, locations, true));
        }
        
        if (!bulkAuctions.isEmpty()) {
            auctionRepository.saveAll(bulkAuctions);
        }
        
        log.info("Successfully completed seeding. Total data points now available: {}", auctionRepository.count());
    }

    private Auction generateRandomAuction(String[] fishTypes, String[] locations, boolean isLive) {
        String fish = fishTypes[random.nextInt(fishTypes.length)];
        String location = locations[random.nextInt(locations.length)];
        
        double basePrice = getBasePriceForFish(fish);
        double startPrice = basePrice * (0.8 + random.nextDouble() * 0.4); // ±20% variation
        double finalPrice = isLive ? startPrice : startPrice * (1.1 + random.nextDouble() * 0.3);
        
        Auction auction = new Auction();
        auction.setFishName(fish);
        auction.setLocation(location);
        auction.setStartPrice(Math.round(startPrice * 100.0) / 100.0);
        auction.setCurrentPrice(Math.round(finalPrice * 100.0) / 100.0);
        auction.setQuantityKg(5.0 + random.nextDouble() * 495.0); 
        auction.setFreshnessScore(70 + random.nextInt(30));
        auction.setActive(isLive);
        
        if (isLive) {
            // Live: Starts now, ends in 1-48 hours
            auction.setStartTime(Instant.now());
            auction.setEndTime(Instant.now().plus(1 + random.nextInt(47), ChronoUnit.HOURS));
        } else {
            // Historical: Ended in the last 30 days
            Instant endTime = Instant.now().minus(random.nextInt(30), ChronoUnit.DAYS).minus(random.nextInt(24), ChronoUnit.HOURS);
            auction.setStartTime(endTime.minus(6 + random.nextInt(12), ChronoUnit.HOURS));
            auction.setEndTime(endTime);
        }
        
        auction.setDataSource(Auction.AuctionDataSource.SYSTEM_GENERATED);
        return auction;
    }

    private double getBasePriceForFish(String fish) {
        return switch (fish) {
            case "Tuna" -> 450.0;
            case "Salmon" -> 650.0;
            case "Mackerel" -> 190.0;
            case "Pomfret" -> 550.0;
            case "Prawns" -> 850.0;
            case "Kingfish" -> 420.0;
            case "Sardines" -> 130.0;
            case "Rohu" -> 210.0;
            case "Catla" -> 190.0;
            case "Hilsa" -> 1300.0;
            case "Squid" -> 350.0;
            case "Crab" -> 400.0;
            case "Lobster" -> 1500.0;
            default -> 500.0;
        };
    }
}

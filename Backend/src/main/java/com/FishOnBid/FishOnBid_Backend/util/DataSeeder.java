package com.FishOnBid.FishOnBid_Backend.util;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.entity.Bid;
import com.FishOnBid.FishOnBid_Backend.entity.User;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import com.FishOnBid.FishOnBid_Backend.repository.BidRepository;
import com.FishOnBid.FishOnBid_Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * DataSeeder - Automated historical data generator for FishOnBid.
 * Ensures the system always has 500+ data points for high-quality RAG evaluation.
 * Also seeds default user accounts if they don't exist.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    private static final String[] SYNTHETIC_BIDDERS = {
            "ravi.bidder@example.com", "priya.bidder@example.com", "kumar.bidder@example.com",
            "anita.bidder@example.com", "vijay.bidder@example.com", "meera.bidder@example.com",
            "raj.bidder@example.com", "lakshmi.bidder@example.com"
    };

    @Override
    public void run(String... args) {
        seedDefaultUsers();

        long count = auctionRepository.count();
        log.info("Current total auction count: {}", count);

        // We targeted 500 records before, let's now target 550 (500 historical + 50 live)
        if (count < 550) {
            log.info("Detected low data volume ({} records). Re-seeding diversified data...", count);
            seedDiversifiedData(500, 50);
        } else {
            log.info("Sufficient data present ({} records). Skipping automated seeding.", count);
        }

        backfillBidsForOrphanSystemAuctions();
    }

    /**
     * Idempotent backfill: any synthetic (sellerEmail IS NULL) closed auction with
     * zero bids gets 2–5 synthetic bids. Needed for DBs seeded before bid generation
     * existed. Real user auctions are excluded because they always have sellerEmail.
     */
    private void backfillBidsForOrphanSystemAuctions() {
        List<Auction> orphans = auctionRepository.findSyntheticClosedAuctionsWithoutBids(Instant.now());
        if (orphans.isEmpty()) {
            log.info("No synthetic closed auctions need bid backfill.");
            return;
        }
        log.info("Backfilling synthetic bids for {} closed auctions missing bid history...", orphans.size());
        List<Bid> bids = new ArrayList<>();
        for (Auction a : orphans) {
            bids.addAll(generateBidsForAuction(a));
            if (bids.size() >= 500) {
                bidRepository.saveAll(bids);
                bids.clear();
            }
        }
        if (!bids.isEmpty()) {
            bidRepository.saveAll(bids);
        }
        log.info("Bid backfill complete for {} auctions.", orphans.size());
    }

    private void seedDefaultUsers() {
        // Seed default admin account
        User existing = userRepository.findByEmail("lint@maze.com");
        if (existing == null) {
            User admin = new User();
            admin.setName("Lint");
            admin.setEmail("lint@maze.com");
            admin.setPassword(passwordEncoder.encode("12345"));
            admin.setRole("ADMIN");
            userRepository.save(admin);
            log.info("Seeded default admin: lint@maze.com");
        } else {
            // Ensure password is BCrypt-encoded and role is ADMIN
            existing.setPassword(passwordEncoder.encode("12345"));
            existing.setRole("ADMIN");
            userRepository.save(existing);
            log.info("Reset password and ensured ADMIN role for: lint@maze.com");
        }
    }

    private void seedDiversifiedData(int historicalCount, int liveCount) {
        String[] fishTypes = {"Tuna", "Salmon", "Mackerel", "Pomfret", "Prawns", "Kingfish", "Sardines", "Rohu", "Catla", "Hilsa", "Squid", "Crab", "Lobster"};
        String[] locations = {"Chennai Harbor", "Kochi Harbor", "Vizag Harbor", "Mumbai Harbor", "Goa Harbor", "Mangalore Harbor", "Tuticorin Harbor", "Kolkata Port"};

        // 1. Generate Historical Data (Closed) — save and attach synthetic bid history
        // so the Results page (which requires EXISTS bid) has data to render.
        log.info("Generating {} historical auctions with synthetic bid history...", historicalCount);
        List<Auction> auctionBatch = new ArrayList<>();
        int totalBids = 0;
        for (int i = 0; i < historicalCount; i++) {
            auctionBatch.add(generateRandomAuction(fishTypes, locations, false));
            if (auctionBatch.size() >= 100) {
                totalBids += persistAuctionsWithBids(auctionBatch);
                auctionBatch.clear();
            }
        }
        if (!auctionBatch.isEmpty()) {
            totalBids += persistAuctionsWithBids(auctionBatch);
            auctionBatch.clear();
        }
        log.info("Created {} synthetic bids across {} historical auctions.", totalBids, historicalCount);

        // 2. Generate Live Data (Active) — no bids; users will place real bids.
        log.info("Generating {} LIVE auctions for UI visibility...", liveCount);
        for (int i = 0; i < liveCount; i++) {
            auctionBatch.add(generateRandomAuction(fishTypes, locations, true));
        }
        if (!auctionBatch.isEmpty()) {
            auctionRepository.saveAll(auctionBatch);
        }

        log.info("Successfully completed seeding. Total data points now available: {}", auctionRepository.count());
    }

    private int persistAuctionsWithBids(List<Auction> auctions) {
        List<Auction> saved = auctionRepository.saveAll(auctions);
        List<Bid> bids = new ArrayList<>();
        for (Auction a : saved) {
            bids.addAll(generateBidsForAuction(a));
        }
        bidRepository.saveAll(bids);
        return bids.size();
    }

    private List<Bid> generateBidsForAuction(Auction auction) {
        int bidCount = 2 + random.nextInt(4); // 2–5 bids
        double startPrice = auction.getStartPrice();
        double finalPrice = auction.getCurrentPrice();
        Instant startTime = auction.getStartTime();
        Instant endTime = auction.getEndTime();
        long durationSec = Math.max(1, endTime.getEpochSecond() - startTime.getEpochSecond());

        List<Bid> bids = new ArrayList<>(bidCount);
        for (int i = 0; i < bidCount; i++) {
            double t = (i + 1.0) / bidCount;
            double amount = (i == bidCount - 1)
                    ? finalPrice
                    : Math.round((startPrice + (finalPrice - startPrice) * t) * 100.0) / 100.0;

            Bid bid = new Bid();
            bid.setAmount(amount);
            bid.setBidderEmail(SYNTHETIC_BIDDERS[random.nextInt(SYNTHETIC_BIDDERS.length)]);
            bid.setAuction(auction);
            bid.setBidTime(startTime.plusSeconds((long) (durationSec * t)));
            bids.add(bid);
        }
        return bids;
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

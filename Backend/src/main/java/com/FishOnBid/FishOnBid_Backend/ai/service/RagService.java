package com.FishOnBid.FishOnBid_Backend.ai.service;

import com.FishOnBid.FishOnBid_Backend.ai.dto.RagDataDTO;
import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * RAG (Retrieval-Augmented Generation) Service.
 * Retrieves and aggregates historical auction data for AI pricing.
 * Implements Dynamic Trust Formula: TrustScore = BaseWeight × RecencyDecay × DataVolumeFactor
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RagService {

    private final AuctionRepository auctionRepository;

    // Time-decay parameter (λ): higher = faster decay
    private static final double RECENCY_DECAY_LAMBDA = 0.05;
    // Minimum sample size for full confidence
    private static final double DATA_VOLUME_THRESHOLD = 50.0;

    /**
     * Fetch historical auction statistics with dynamic trust weighting.
     */
    public RagDataDTO fetchHistoricalData(String fishName, int daysBack) {
        log.info("RAG_FETCH_START: fishName={}, daysBack={}", fishName, daysBack);

        Instant fromDate = Instant.now().minus(daysBack, ChronoUnit.DAYS);
        List<Auction> auctions = auctionRepository.findRecentAuctions(fishName, fromDate);

        if (auctions.isEmpty()) {
            log.info("RAG_NO_DATA: No historical auctions found for {}", fishName);
            return RagDataDTO.empty();
        }

        return buildRagData(auctions, daysBack);
    }

    /**
     * Fetch historical data filtered by location.
     * If no government records found for specific fish type, queries generic "Fish" govt data as fallback.
     */
    public RagDataDTO fetchHistoricalDataByLocation(String fishName, String location, int daysBack) {
        log.info("RAG_FETCH_BY_LOCATION: fishName={}, location={}, daysBack={}",
                fishName, location, daysBack);

        Instant fromDate = Instant.now().minus(daysBack, ChronoUnit.DAYS);
        List<Auction> auctions = auctionRepository.findRecentAuctionsByLocation(
                fishName, location, fromDate);

        // Check if we have any government data for this specific fish type
        long govtCount = auctions.stream()
                .filter(a -> a.getDataSource() == Auction.AuctionDataSource.GOVT_INSTITUTIONAL_API)
                .count();

        // If no government data for specific fish at this location, try generic "Fish" at same location
        if (govtCount == 0 && !"Fish".equals(fishName)) {
            log.info("RAG_NO_GOVT_DATA_FOR_SPECIFIC_FISH: Querying generic Fish govt data at location='{}'", location);
            List<Auction> genericGovtData = auctionRepository.findGenericFishGovtData(location, fromDate);
            
            if (!genericGovtData.isEmpty()) {
                log.info("RAG_GENERIC_GOVT_DATA_FOUND: Found {} generic Fish govt records at location='{}'", 
                        genericGovtData.size(), location);
                auctions.addAll(genericGovtData);
            } else {
                // If no local govt data, use nationwide generic Fish data as baseline reference
                log.info("RAG_NO_LOCAL_GOVT_DATA: Querying nationwide generic Fish govt data as baseline");
                List<Auction> nationwideGovtData = auctionRepository.findRecentAuctions("Fish", fromDate);
                List<Auction> govtOnly = nationwideGovtData.stream()
                        .filter(a -> a.getDataSource() == Auction.AuctionDataSource.GOVT_INSTITUTIONAL_API)
                        .limit(20) // Limit to 20 records for performance
                        .toList();
                if (!govtOnly.isEmpty()) {
                    log.info("RAG_NATIONWIDE_GOVT_DATA_FOUND: Using {} nationwide Fish govt records as baseline", 
                            govtOnly.size());
                    auctions.addAll(govtOnly);
                }
            }
        }

        if (auctions.isEmpty()) {
            log.info("RAG_NO_LOCAL_DATA: No auctions found for fish='{}' at location='{}'. Falling back to global.", fishName, location);
            return fetchHistoricalData(fishName, daysBack);
        }

        log.info("RAG_LOCAL_DATA_FOUND: Found {} total auctions (including fallback) for fish='{}' at location='{}'", 
                auctions.size(), fishName, location);
        return buildRagData(auctions, daysBack);
    }

    /**
     * Core RAG aggregation with Dynamic Trust Formula.
     * TrustScore = BaseWeight × RecencyDecay × DataVolumeFactor
     */
    private RagDataDTO buildRagData(List<Auction> auctions, int daysBack) {
        double totalWeightedPrice = 0;
        double totalWeight = 0;

        // Source-level tracking
        int govtCount = 0;
        double govtTotal = 0;
        int histCount = 0;
        double histTotal = 0;

        Instant now = Instant.now();
        int totalRecords = auctions.size();
        double dataVolumeFactor = Math.min(1.0, totalRecords / DATA_VOLUME_THRESHOLD);

        for (Auction a : auctions) {
            // 1. Base Weight by source
            double baseWeight;
            boolean isGovt = (a.getDataSource() == Auction.AuctionDataSource.GOVT_INSTITUTIONAL_API);
            if (isGovt) {
                baseWeight = 1.5;
            } else if (a.getDataSource() == Auction.AuctionDataSource.SIMULATED_DEMO) {
                baseWeight = 0.5;
            } else {
                baseWeight = 1.0;
            }

            // 2. Recency Decay: e^(-λ × daysOld)
            double daysOld = a.getStartTime() != null
                    ? ChronoUnit.DAYS.between(a.getStartTime(), now)
                    : daysBack;
            double recencyDecay = Math.exp(-RECENCY_DECAY_LAMBDA * Math.max(0, daysOld));

            // 3. Dynamic Trust = Base × Recency × DataVolume
            double dynamicWeight = baseWeight * recencyDecay * dataVolumeFactor;

            totalWeightedPrice += a.getCurrentPrice() * dynamicWeight;
            totalWeight += dynamicWeight;

            // Track source breakdown
            if (isGovt) {
                govtCount++;
                govtTotal += a.getCurrentPrice();
            } else {
                histCount++;
                histTotal += a.getCurrentPrice();
            }
        }

        double avgPrice = totalWeight > 0 ? totalWeightedPrice / totalWeight : 0;

        double minPrice = auctions.stream()
                .mapToDouble(Auction::getCurrentPrice)
                .min().orElse(0);
        double maxPrice = auctions.stream()
                .mapToDouble(Auction::getCurrentPrice)
                .max().orElse(0);
        double avgQuantity = auctions.stream()
                .mapToDouble(a -> a.getQuantityKg() != null ? a.getQuantityKg() : 0)
                .average().orElse(0);

        String location = auctions.stream()
                .filter(a -> a.getLocation() != null)
                .findFirst()
                .map(Auction::getLocation)
                .orElse(null);

        // Build date range string
        LocalDate fromLocal = Instant.now().minus(daysBack, ChronoUnit.DAYS)
                .atZone(ZoneId.systemDefault()).toLocalDate();
        LocalDate toLocal = LocalDate.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d");
        String dateRange = fmt.format(fromLocal) + " – " + fmt.format(toLocal) + ", "
                + toLocal.getYear();

        double govtAvg = govtCount > 0 ? govtTotal / govtCount : 0;
        double histAvg = histCount > 0 ? histTotal / histCount : 0;

        RagDataDTO result = new RagDataDTO(
                totalRecords, avgPrice, minPrice, maxPrice, avgQuantity, location,
                govtCount, Math.round(govtAvg * 100.0) / 100.0,
                histCount, Math.round(histAvg * 100.0) / 100.0,
                dateRange
        );

        log.info("RAG_DATA_RETRIEVED: count={}, avgPrice={}, govtCount={}, histCount={}, confidence={}, dataVolumeFactor={}",
                result.auctionCount(), result.averagePrice(), govtCount, histCount,
                result.getConfidenceLevel(), String.format("%.2f", dataVolumeFactor));

        return result;
    }
}

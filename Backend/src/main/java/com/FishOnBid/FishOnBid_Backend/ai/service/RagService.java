package com.FishOnBid.FishOnBid_Backend.ai.service;

import com.FishOnBid.FishOnBid_Backend.ai.dto.RagDataDTO;
import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * RAG (Retrieval-Augmented Generation) Service.
 * Retrieves and aggregates historical auction data for AI pricing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RagService {

    private final AuctionRepository auctionRepository;

    /**
     * Fetch historical auction statistics for a specific fish type.
     * 
     * @param fishName The type of fish to search for
     * @param daysBack Number of days to look back
     * @return Aggregated statistics from historical auctions
     */
    public RagDataDTO fetchHistoricalData(String fishName, int daysBack) {
        log.info("RAG_FETCH_START: fishName={}, daysBack={}", fishName, daysBack);
        
        Instant fromDate = Instant.now().minus(daysBack, ChronoUnit.DAYS);
        List<Auction> auctions = auctionRepository.findRecentAuctions(fishName, fromDate);

        if (auctions.isEmpty()) {
            log.info("RAG_NO_DATA: No historical auctions found for {}", fishName);
            return RagDataDTO.empty();
        }

        double avgPrice = auctions.stream()
                .mapToDouble(Auction::getCurrentPrice)
                .average()
                .orElse(0);

        double minPrice = auctions.stream()
                .mapToDouble(Auction::getCurrentPrice)
                .min()
                .orElse(0);

        double maxPrice = auctions.stream()
                .mapToDouble(Auction::getCurrentPrice)
                .max()
                .orElse(0);

        double avgQuantity = auctions.stream()
                .mapToDouble(a -> a.getQuantityKg() != null ? a.getQuantityKg() : 0)
                .average()
                .orElse(0);

        String mostRecentLocation = auctions.stream()
                .filter(a -> a.getLocation() != null)
                .findFirst()
                .map(Auction::getLocation)
                .orElse(null);

        RagDataDTO result = new RagDataDTO(
                auctions.size(),
                avgPrice,
                minPrice,
                maxPrice,
                avgQuantity,
                mostRecentLocation
        );

        log.info("RAG_DATA_RETRIEVED: count={}, avgPrice={}, confidence={}",
                result.auctionCount(), result.averagePrice(), result.getConfidenceLevel());

        return result;
    }

    /**
     * Fetch historical data filtered by location for more accurate pricing.
     */
    public RagDataDTO fetchHistoricalDataByLocation(String fishName, String location, int daysBack) {
        log.info("RAG_FETCH_BY_LOCATION: fishName={}, location={}, daysBack={}", 
                fishName, location, daysBack);
        
        Instant fromDate = Instant.now().minus(daysBack, ChronoUnit.DAYS);
        List<Auction> auctions = auctionRepository.findRecentAuctionsByLocation(
                fishName, location, fromDate);

        if (auctions.isEmpty()) {
            log.info("RAG_NO_LOCAL_DATA: Falling back to global data for {}", fishName);
            return fetchHistoricalData(fishName, daysBack);
        }

        double avgPrice = auctions.stream()
                .mapToDouble(Auction::getCurrentPrice)
                .average()
                .orElse(0);

        double minPrice = auctions.stream()
                .mapToDouble(Auction::getCurrentPrice)
                .min()
                .orElse(0);

        double maxPrice = auctions.stream()
                .mapToDouble(Auction::getCurrentPrice)
                .max()
                .orElse(0);

        double avgQuantity = auctions.stream()
                .mapToDouble(a -> a.getQuantityKg() != null ? a.getQuantityKg() : 0)
                .average()
                .orElse(0);

        return new RagDataDTO(
                auctions.size(),
                avgPrice,
                minPrice,
                maxPrice,
                avgQuantity,
                location
        );
    }
}

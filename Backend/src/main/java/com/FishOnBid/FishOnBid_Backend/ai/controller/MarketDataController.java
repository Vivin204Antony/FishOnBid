package com.FishOnBid.FishOnBid_Backend.ai.controller;

import com.FishOnBid.FishOnBid_Backend.ai.service.ExternalFisheriesService;
import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Administrative controller for Managing Institutional Market Data (Strategy 4).
 */
@RestController
@RequestMapping("/api/admin/market")
@RequiredArgsConstructor
@Slf4j
public class MarketDataController {

    private final ExternalFisheriesService externalFisheriesService;
    private final AuctionRepository auctionRepository;

    /**
     * GET /api/admin/market/status
     * Returns sync health, freshness, circuit breaker state, and record counts.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getMarketStatus() {
        List<Auction> govtRecords = auctionRepository.findAll().stream()
                .filter(a -> a.getDataSource() == Auction.AuctionDataSource.GOVT_INSTITUTIONAL_API)
                .toList();

        long last24h = govtRecords.stream()
                .filter(a -> a.getEndTime() != null && a.getEndTime().isAfter(Instant.now().minus(24, ChronoUnit.HOURS)))
                .count();

        long last7d = govtRecords.stream()
                .filter(a -> a.getEndTime() != null && a.getEndTime().isAfter(Instant.now().minus(7, ChronoUnit.DAYS)))
                .count();

        Set<String> fishTypes = govtRecords.stream()
                .map(Auction::getFishName)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> locations = govtRecords.stream()
                .map(Auction::getLocation)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        DoubleSummaryStatistics priceStats = govtRecords.stream()
                .mapToDouble(Auction::getCurrentPrice)
                .filter(p -> p > 0)
                .summaryStatistics();

        Instant lastSync = externalFisheriesService.getLastSyncTimestamp();

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("totalRecords", govtRecords.size());
        status.put("recordsLast24h", last24h);
        status.put("recordsLast7d", last7d);
        status.put("uniqueFishTypes", fishTypes.size());
        status.put("uniqueLocations", locations.size());
        status.put("avgPrice", priceStats.getCount() > 0 ? Math.round(priceStats.getAverage() * 100.0) / 100.0 : 0);
        status.put("minPrice", priceStats.getCount() > 0 ? Math.round(priceStats.getMin() * 100.0) / 100.0 : 0);
        status.put("maxPrice", priceStats.getCount() > 0 ? Math.round(priceStats.getMax() * 100.0) / 100.0 : 0);
        status.put("dataFreshness", externalFisheriesService.getDataFreshness());
        status.put("lastSyncTimestamp", lastSync);
        status.put("fishTypes", fishTypes.stream().sorted().toList());
        status.put("locations", locations.stream().sorted().toList());

        log.info("Market status requested: {} govt records, {} fish types, {} locations",
                govtRecords.size(), fishTypes.size(), locations.size());
        return ResponseEntity.ok(status);
    }

    /**
     * GET /api/admin/market/records
     * Returns govt-sourced auction records grouped by fish type with price analytics.
     */
    @GetMapping("/records")
    public ResponseEntity<Map<String, Object>> getMarketRecords() {
        List<Auction> govtRecords = auctionRepository.findAll().stream()
                .filter(a -> a.getDataSource() == Auction.AuctionDataSource.GOVT_INSTITUTIONAL_API)
                .sorted(Comparator.comparing(Auction::getEndTime, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        // Group by fish type with stats
        Map<String, List<Auction>> byFish = govtRecords.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getFishName() != null ? a.getFishName() : "Unknown"));

        List<Map<String, Object>> fishGroups = byFish.entrySet().stream()
                .sorted(Map.Entry.<String, List<Auction>>comparingByValue(
                        Comparator.comparingInt(list -> -list.size())))
                .map(entry -> {
                    List<Auction> records = entry.getValue();
                    DoubleSummaryStatistics stats = records.stream()
                            .mapToDouble(Auction::getCurrentPrice)
                            .filter(p -> p > 0)
                            .summaryStatistics();

                    Set<String> locs = records.stream()
                            .map(Auction::getLocation)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet());

                    Map<String, Object> group = new LinkedHashMap<>();
                    group.put("fishName", entry.getKey());
                    group.put("recordCount", records.size());
                    group.put("avgPrice", Math.round(stats.getAverage() * 100.0) / 100.0);
                    group.put("minPrice", Math.round(stats.getMin() * 100.0) / 100.0);
                    group.put("maxPrice", Math.round(stats.getMax() * 100.0) / 100.0);
                    group.put("locations", locs.stream().sorted().toList());
                    return group;
                })
                .toList();

        // Group by location with stats
        Map<String, List<Auction>> byLocation = govtRecords.stream()
                .filter(a -> a.getLocation() != null)
                .collect(Collectors.groupingBy(Auction::getLocation));

        List<Map<String, Object>> locationGroups = byLocation.entrySet().stream()
                .sorted(Map.Entry.<String, List<Auction>>comparingByValue(
                        Comparator.comparingInt(list -> -list.size())))
                .map(entry -> {
                    List<Auction> records = entry.getValue();
                    DoubleSummaryStatistics stats = records.stream()
                            .mapToDouble(Auction::getCurrentPrice)
                            .filter(p -> p > 0)
                            .summaryStatistics();

                    Map<String, Object> group = new LinkedHashMap<>();
                    group.put("location", entry.getKey());
                    group.put("recordCount", records.size());
                    group.put("avgPrice", Math.round(stats.getAverage() * 100.0) / 100.0);
                    group.put("fishTypes", records.stream()
                            .map(Auction::getFishName)
                            .filter(Objects::nonNull)
                            .distinct()
                            .sorted()
                            .toList());
                    return group;
                })
                .toList();

        // Recent records (last 50)
        List<Map<String, Object>> recentRecords = govtRecords.stream()
                .limit(50)
                .map(a -> {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("id", a.getId());
                    r.put("fishName", a.getFishName());
                    r.put("location", a.getLocation());
                    r.put("price", a.getCurrentPrice());
                    r.put("quantityKg", a.getQuantityKg());
                    r.put("endTime", a.getEndTime());
                    return r;
                })
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRecords", govtRecords.size());
        result.put("byFishType", fishGroups);
        result.put("byLocation", locationGroups);
        result.put("recentRecords", recentRecords);

        log.info("Market records requested: {} total, {} fish groups, {} location groups",
                govtRecords.size(), fishGroups.size(), locationGroups.size());
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/admin/market/sync
     * Trigger immediate synchronization with the Institutional OGD API.
     * Uses .block() to convert reactive Mono to synchronous for servlet compatibility.
     */
    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> triggerManualSync() {
        log.info("REST_REQUEST: Manual Institutional Sync Triggered.");
        try {
            Map<String, Object> result = externalFisheriesService.manualSync().block();
            if (result != null && "success".equals(result.get("status"))) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.internalServerError().body(result);
            }
        } catch (Exception e) {
            log.error("Sync failed: {}", e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("status", "failed");
            errorResult.put("error", e.getMessage() != null ? e.getMessage() : "Sync timed out or failed");
            errorResult.put("timestamp", Instant.now());
            return ResponseEntity.internalServerError().body(errorResult);
        }
    }
}

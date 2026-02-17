package com.FishOnBid.FishOnBid_Backend.ai.service;

import com.FishOnBid.FishOnBid_Backend.ai.dto.GovtFishResponseDTO;
import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.reactor.circuitbreaker.operator.CircuitBreakerOperator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Strategy 4: Multi-Source Institutional Integration Service.
 * Fetches fish market data from 2 data.gov.in API sources:
 *   API 1 — Daily Mandi Price (real-time commodity prices)
 *   API 2 — AgMarkNet Variety-wise (77M+ historical records)
 *
 * Implements production-grade resilience:
 * - Exponential Backoff (2s → 4s → 8s, max 30s)
 * - Request Timeout (30s)
 * - Circuit Breaker (Resilience4j)
 * - Last Sync Timestamp & Staleness Detection
 * - Quintal → Kg Price Conversion
 */
@Service
@Slf4j
public class ExternalFisheriesService {

    private final AuctionRepository auctionRepository;
    private final WebClient webClient;
    private final CircuitBreaker circuitBreaker;

    // Staleness Tracking (Priority 3)
    private final AtomicReference<Instant> lastSuccessfulSync = new AtomicReference<>(null);
    private final AtomicReference<String> lastSyncStatus = new AtomicReference<>("NEVER_SYNCED");
    private static final long STALENESS_THRESHOLD_HOURS = 48;

    // API 1: Daily Mandi Price
    @Value("${external.fisheries-api.primary.url}")
    private String primaryApiUrl;

    @Value("${external.fisheries-api.primary.key}")
    private String primaryApiKey;

    // API 2: AgMarkNet Variety-wise
    @Value("${external.fisheries-api.secondary.url}")
    private String secondaryApiUrl;

    @Value("${external.fisheries-api.secondary.key}")
    private String secondaryApiKey;

    // Commodity filter (default: Fish)
    @Value("${external.fisheries-api.commodity-filter:Fish}")
    private String commodityFilter;

    // Price conversion: Govt data is per quintal (100kg), we need per-kg
    @Value("${external.fisheries-api.price-unit-divisor:100}")
    private double priceUnitDivisor;

    // States to fetch from API 2 (which requires mandatory State filter)
    private static final List<String> TARGET_STATES = List.of(
            "Tamil Nadu", "Kerala", "West Bengal", "Andhra Pradesh",
            "Tripura", "Odisha", "Maharashtra", "Karnataka", "Goa"
    );

    public ExternalFisheriesService(AuctionRepository auctionRepository, WebClient.Builder webClientBuilder) {
        this.auctionRepository = auctionRepository;
        this.webClient = webClientBuilder.build();

        // Configure Circuit Breaker (Priority 5)
        CircuitBreakerConfig cbConfig = CircuitBreakerConfig.custom()
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofMinutes(2))
                .slidingWindowSize(5)
                .minimumNumberOfCalls(3)
                .build();

        CircuitBreakerRegistry registry = CircuitBreakerRegistry.of(cbConfig);
        this.circuitBreaker = registry.circuitBreaker("govtFisheriesAPI");

        log.info("[Strategy 4] Circuit Breaker initialized. Dual-API mode: Primary (Mandi) + Secondary (AgMarkNet)");
    }

    /**
     * Scheduled Market Sync (Daily at 2 AM).
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void scheduledSync() {
        log.info("[Strategy 4] Initiating scheduled daily sync at 2 AM...");
        performSync().subscribe();
    }

    /**
     * Manual Trigger for Strategy 4 Validation.
     */
    public Mono<Map<String, Object>> manualSync() {
        log.info("[Strategy 4] Manual trigger received. Initiating immediate market sync...");
        return performSync();
    }

    /**
     * Get data freshness status for AI explanations (Priority 3).
     */
    public String getDataFreshness() {
        Instant lastSync = lastSuccessfulSync.get();
        if (lastSync == null) {
            return "⚠️ No sync performed yet";
        }
        long hoursAgo = ChronoUnit.HOURS.between(lastSync, Instant.now());
        if (hoursAgo < 1) return "✅ Fresh (synced < 1 hour ago)";
        if (hoursAgo < 24) return "✅ Fresh (synced " + hoursAgo + "h ago)";
        if (hoursAgo < STALENESS_THRESHOLD_HOURS) return "🟡 " + hoursAgo + "h old";
        return "⚠️ Stale (last synced " + (hoursAgo / 24) + " days ago)";
    }

    /**
     * Get last sync timestamp.
     */
    public Instant getLastSyncTimestamp() {
        return lastSuccessfulSync.get();
    }

    /**
     * Perform dual-API sync: fetches from both API 1 and API 2.
     */
    private Mono<Map<String, Object>> performSync() {
        long startTime = System.currentTimeMillis();
        log.info("[Strategy 4] Dual-API sync initiated. Circuit: {}",
                circuitBreaker.getState());

        // API 1: Daily Mandi Price (simple, no state filter needed)
        Mono<Integer> api1 = fetchFromPrimaryApi();

        // API 2: AgMarkNet (requires state filter — fetch from multiple states)
        Mono<Integer> api2 = fetchFromSecondaryApi();

        return Mono.zip(api1, api2)
                .map(tuple -> {
                    int totalRecords = tuple.getT1() + tuple.getT2();
                    long duration = System.currentTimeMillis() - startTime;

                    // Track successful sync
                    lastSuccessfulSync.set(Instant.now());
                    lastSyncStatus.set("SUCCESS");

                    log.info("[Strategy 4] ✅ Dual-API sync complete. API1: {} + API2: {} = {} records in {}ms. Circuit: {}",
                            tuple.getT1(), tuple.getT2(), totalRecords, duration, circuitBreaker.getState());

                    Map<String, Object> result = new HashMap<>();
                    result.put("status", "success");
                    result.put("recordsImported", totalRecords);
                    result.put("api1Records", tuple.getT1());
                    result.put("api2Records", tuple.getT2());
                    result.put("durationMs", duration);
                    result.put("timestamp", Instant.now());
                    result.put("circuitState", circuitBreaker.getState().toString());
                    result.put("dataFreshness", getDataFreshness());
                    return result;
                })
                .onErrorResume(e -> {
                    lastSyncStatus.set("FAILED");
                    log.error("[Strategy 4] ❌ Dual-API sync failed. Circuit: {}. Error: {}",
                            circuitBreaker.getState(), e.getMessage());

                    Map<String, Object> errorResult = new HashMap<>();
                    errorResult.put("status", "failed");
                    errorResult.put("error", e.getMessage() != null ? e.getMessage() : "Unknown Connection Error");
                    errorResult.put("timestamp", Instant.now());
                    errorResult.put("circuitState", circuitBreaker.getState().toString());
                    errorResult.put("dataFreshness", getDataFreshness());
                    return Mono.just(errorResult);
                });
    }

    /**
     * API 1: Daily Mandi Price — simple endpoint, filter by commodity=Fish.
     */
    private Mono<Integer> fetchFromPrimaryApi() {
        log.info("[API-1] Fetching from Daily Mandi Price. Filter: commodity={}", commodityFilter);

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(extractPath(primaryApiUrl))
                        .scheme("https")
                        .host("api.data.gov.in")
                        .queryParam("api-key", primaryApiKey)
                        .queryParam("format", "json")
                        .queryParam("limit", "100")
                        .queryParam("filters[commodity]", commodityFilter)
                        .build())
                .retrieve()
                .bodyToMono(GovtFishResponseDTO.class)
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                        .maxBackoff(Duration.ofSeconds(30))
                        .doBeforeRetry(signal ->
                                log.warn("[API-1] Retry #{}: {}",
                                        signal.totalRetries() + 1, signal.failure().getMessage())))
                .timeout(Duration.ofSeconds(30))
                .transformDeferred(CircuitBreakerOperator.of(circuitBreaker))
                .map(response -> processAndSave(response, "API-1", false))
                .onErrorResume(e -> {
                    log.warn("[API-1] Failed: {}. Continuing with API-2.", e.getMessage());
                    return Mono.just(0);
                });
    }

    /**
     * API 2: AgMarkNet Variety-wise — requires mandatory State filter.
     * Fetches from multiple coastal states in parallel.
     */
    private Mono<Integer> fetchFromSecondaryApi() {
        log.info("[API-2] Fetching from AgMarkNet across {} states. Filter: commodity={}",
                TARGET_STATES.size(), commodityFilter);

        List<Mono<Integer>> stateFetches = TARGET_STATES.stream()
                .map(state -> fetchFromSecondaryForState(state))
                .toList();

        return Mono.zip(stateFetches, results -> {
            int total = 0;
            for (Object r : results) {
                total += (Integer) r;
            }
            return total;
        });
    }

    private Mono<Integer> fetchFromSecondaryForState(String state) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path(extractPath(secondaryApiUrl))
                        .scheme("https")
                        .host("api.data.gov.in")
                        .queryParam("api-key", secondaryApiKey)
                        .queryParam("format", "json")
                        .queryParam("limit", "50")
                        .queryParam("filters[State]", state)
                        .queryParam("filters[Commodity]", commodityFilter)
                        .build())
                .retrieve()
                .bodyToMono(GovtFishResponseDTO.class)
                .retryWhen(Retry.backoff(2, Duration.ofSeconds(1))
                        .maxBackoff(Duration.ofSeconds(10)))
                .timeout(Duration.ofSeconds(20))
                .transformDeferred(CircuitBreakerOperator.of(circuitBreaker))
                .map(response -> processAndSave(response, "API-2/" + state, true))
                .onErrorResume(e -> {
                    log.warn("[API-2/{}] Failed: {}", state, e.getMessage());
                    return Mono.just(0);
                });
    }

    /**
     * Extracts path from full URL (e.g. "/resource/9ef84268-..." from "https://api.data.gov.in/resource/9ef84268-...")
     */
    private String extractPath(String fullUrl) {
        try {
            java.net.URI uri = java.net.URI.create(fullUrl);
            return uri.getPath();
        } catch (Exception e) {
            // Fallback: assume it's already a path
            return fullUrl;
        }
    }

    private int processAndSave(GovtFishResponseDTO response, String source, boolean isPascalCase) {
        if (response == null || response.getRecords() == null) {
            log.warn("[Strategy 4/{}] API returned empty or null records.", source);
            return 0;
        }

        log.info("[Strategy 4/{}] Fetched {} records.", source, response.getRecords().size());
        AtomicInteger savedCount = new AtomicInteger(0);
        AtomicInteger skippedCount = new AtomicInteger(0);

        response.getRecords().forEach(record -> {
            try {
                Auction auction = mapToAuction(record, isPascalCase);
                if (auction != null) {
                    auctionRepository.save(auction);
                    savedCount.incrementAndGet();
                }  else {
                    skippedCount.incrementAndGet();
                }
            } catch (Exception e) {
                log.error("[Strategy 4/{}] Failed to normalize record: {}. Error: {}",
                        source, record, e.getMessage());
                skippedCount.incrementAndGet();
            }
        });

        if (skippedCount.get() > 0) {
            log.warn("[Strategy 4/{}] {} records saved, {} skipped.",
                    source, savedCount.get(), skippedCount.get());
        }

        return savedCount.get();
    }

    /**
     * Maps a government API record into an Auction entity.
     * Handles both API 1 (lowercase keys) and API 2 (PascalCase keys).
     * Converts prices from per-quintal to per-kg.
     */
    private Auction mapToAuction(Map<String, Object> record, boolean isPascalCase) {
        // Fish/commodity name
        String rawFish = isPascalCase
                ? getField(record, "Commodity", "Variety")
                : getField(record, "commodity", "species", "variety");
        if (rawFish == null) return null;

        // Location (market name)
        String rawLocation = isPascalCase
                ? getField(record, "Market", "District")
                : getField(record, "market", "district");
        if (rawLocation == null || rawLocation.equalsIgnoreCase("Unknown")) return null;

        // Price (modal_price preferred, then max, then min)
        String priceKey1 = isPascalCase ? "Modal_Price" : "modal_price";
        String priceKey2 = isPascalCase ? "Max_Price" : "max_price";
        String priceKey3 = isPascalCase ? "Min_Price" : "min_price";

        Object priceObj = record.getOrDefault(priceKey1,
                record.getOrDefault(priceKey2,
                        record.getOrDefault(priceKey3, "0")));

        double pricePerQuintal = Double.parseDouble(priceObj.toString());
        if (pricePerQuintal <= 0) return null;

        // Convert from per-quintal (100kg) to per-kg
        double pricePerKg = pricePerQuintal / priceUnitDivisor;

        Auction auction = new Auction();
        auction.setFishName(normalizeFishName(rawFish));
        auction.setLocation(normalizeLocation(rawLocation));
        auction.setStartPrice(pricePerKg);
        auction.setCurrentPrice(pricePerKg);
        auction.setStartTime(Instant.now().minus(12, ChronoUnit.HOURS));
        auction.setEndTime(Instant.now());
        auction.setActive(false);
        auction.setDataSource(Auction.AuctionDataSource.GOVT_INSTITUTIONAL_API);

        // Quantity
        Object qtyObj = record.getOrDefault(
                isPascalCase ? "Quantity" : "quantity", null);
        auction.setQuantityKg(qtyObj != null ? Double.parseDouble(qtyObj.toString()) : 100.0);

        return auction;
    }

    private String getField(Map<String, Object> record, String... keys) {
        for (String key : keys) {
            Object val = record.get(key);
            if (val != null && !val.toString().isBlank()) {
                return val.toString();
            }
        }
        return null;
    }

    private String normalizeFishName(String raw) {
        String lower = raw.toLowerCase().trim();
        if (lower.contains("tuna")) return "Tuna";
        if (lower.contains("salmon")) return "Salmon";
        if (lower.contains("pomfret")) return "Pomfret";
        if (lower.contains("hilsa")) return "Hilsa";
        if (lower.contains("prawn") || lower.contains("shrimp")) return "Prawns";
        if (lower.contains("sardine")) return "Sardine";
        if (lower.contains("mackerel")) return "Mackerel";
        if (lower.contains("catla")) return "Catla";
        if (lower.contains("rohu")) return "Rohu";
        if (lower.contains("crab")) return "Crab";
        if (lower.contains("lobster")) return "Lobster";
        if (lower.contains("squid")) return "Squid";
        // "Fish" commodity from Mandi data → generic fish
        if (lower.equals("fish")) return "Fish";
        return raw.trim();
    }

    private String normalizeLocation(String raw) {
        String lower = raw.toLowerCase().trim();
        if (lower.contains("madras") || lower.contains("chennai")) return "Chennai Harbor";
        if (lower.contains("cochin") || lower.contains("kochi")) return "Kochi Harbor";
        if (lower.contains("vizag") || lower.contains("visakhapatnam")) return "Vizag Harbor";
        if (lower.contains("mumbai") || lower.contains("bombay")) return "Mumbai Harbor";
        if (lower.contains("kolkata") || lower.contains("calcutta")) return "Kolkata Harbor";
        if (lower.contains("goa") || lower.contains("panaji")) return "Goa Harbor";
        if (lower.contains("mangalore") || lower.contains("mangaluru")) return "Mangalore Harbor";
        if (lower.contains("tuticorin") || lower.contains("thoothukudi")) return "Tuticorin Harbor";
        if (lower.contains("paradip") || lower.contains("paradeep")) return "Paradip Harbor";
        // For APMC markets, keep as-is but add " Market" suffix
        if (lower.contains("apmc")) return raw.trim();
        // Default: append Harbor
        return raw.trim() + " Harbor";
    }
}

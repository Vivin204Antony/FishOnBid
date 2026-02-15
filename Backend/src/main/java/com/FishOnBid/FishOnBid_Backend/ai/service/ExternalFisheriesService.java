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
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Strategy 4: Real-Time Institutional Integration Service.
 * Implements ETL with production-grade resilience:
 * - Exponential Backoff (2s → 4s → 8s, max 30s)
 * - Request Timeout (30s)
 * - Circuit Breaker (Resilience4j)
 * - Last Sync Timestamp & Staleness Detection
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

    @Value("${external.fisheries-api.url}")
    private String apiUrl;

    @Value("${external.fisheries-api.key}")
    private String apiKey;

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

        log.info("[Strategy 4] Circuit Breaker initialized: govtFisheriesAPI");
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

    private Mono<Map<String, Object>> performSync() {
        long startTime = System.currentTimeMillis();
        log.info("[Strategy 4] Connection to data.gov.in initiated... Circuit: {}",
                circuitBreaker.getState());

        return webClient.get()
            .uri(uriBuilder -> uriBuilder
                .path(apiUrl)
                .queryParam("api-key", apiKey)
                .queryParam("format", "json")
                .build())
            .retrieve()
            .bodyToMono(GovtFishResponseDTO.class)
            // Priority 2: Exponential Backoff (2s → 4s → 8s, max 30s)
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                    .maxBackoff(Duration.ofSeconds(30))
                    .doBeforeRetry(signal ->
                        log.warn("[Strategy 4] Retry #{} after error: {}",
                                signal.totalRetries() + 1, signal.failure().getMessage())))
            // Priority 2: Request Timeout (30s)
            .timeout(Duration.ofSeconds(30))
            // Priority 5: Circuit Breaker
            .transformDeferred(CircuitBreakerOperator.of(circuitBreaker))
            .flatMap(response -> {
                int count = processAndSave(response);
                long duration = System.currentTimeMillis() - startTime;

                // Priority 3: Track successful sync
                lastSuccessfulSync.set(Instant.now());
                lastSyncStatus.set("SUCCESS");

                log.info("[Strategy 4] ✅ Sync complete. {} records in {}ms. Circuit: {}",
                        count, duration, circuitBreaker.getState());

                Map<String, Object> result = new java.util.HashMap<>();
                result.put("status", "success");
                result.put("recordsImported", count);
                result.put("durationMs", duration);
                result.put("timestamp", Instant.now());
                result.put("circuitState", circuitBreaker.getState().toString());
                result.put("dataFreshness", getDataFreshness());
                return Mono.just(result);
            })
            .onErrorResume(e -> {
                lastSyncStatus.set("FAILED");
                log.error("[Strategy 4] ❌ Sync Failed. Circuit: {}. Error: {}",
                        circuitBreaker.getState(), e.getMessage());

                Map<String, Object> errorResult = new java.util.HashMap<>();
                errorResult.put("status", "failed");
                errorResult.put("error", e.getMessage() != null ? e.getMessage() : "Unknown Connection Error");
                errorResult.put("timestamp", Instant.now());
                errorResult.put("circuitState", circuitBreaker.getState().toString());
                errorResult.put("dataFreshness", getDataFreshness());
                return Mono.just(errorResult);
            });
    }

    private int processAndSave(GovtFishResponseDTO response) {
        if (response == null || response.getRecords() == null) {
            log.warn("[Strategy 4] Institutional API returned empty or null records.");
            return 0;
        }

        log.info("[Strategy 4] Fetched {} records from OGD Platform.", response.getRecords().size());
        AtomicInteger savedCount = new AtomicInteger(0);
        AtomicInteger skippedCount = new AtomicInteger(0);

        response.getRecords().forEach(record -> {
            try {
                Auction auction = mapToAuction(record);
                if (auction != null) {
                    auctionRepository.save(auction);
                    savedCount.incrementAndGet();
                } else {
                    skippedCount.incrementAndGet();
                }
            } catch (Exception e) {
                log.error("[Strategy 4] Failed to normalize record: {}. Error: {}", record, e.getMessage());
                skippedCount.incrementAndGet();
            }
        });

        if (skippedCount.get() > 0) {
            log.warn("[Strategy 4] Data Mapping Alert: {} records skipped.", skippedCount.get());
        }

        return savedCount.get();
    }

    private Auction mapToAuction(Map<String, Object> record) {
        String rawFish = (String) record.getOrDefault("species", record.get("commodity"));
        if (rawFish == null) return null;

        String rawLocation = (String) record.getOrDefault("market", "Unknown");
        if (rawLocation.equalsIgnoreCase("Unknown")) {
            return null;
        }

        Auction auction = new Auction();
        auction.setFishName(normalizeFishName(rawFish));
        auction.setLocation(normalizeLocation(rawLocation));

        Object priceObj = record.getOrDefault("modal_price", record.getOrDefault("price", "500"));
        double price = Double.parseDouble(priceObj.toString());

        auction.setStartPrice(price);
        auction.setCurrentPrice(price);
        auction.setStartTime(Instant.now().minus(12, ChronoUnit.HOURS));
        auction.setEndTime(Instant.now());
        auction.setActive(false);
        auction.setDataSource(Auction.AuctionDataSource.GOVT_INSTITUTIONAL_API);
        auction.setQuantityKg(record.containsKey("quantity") ? Double.parseDouble(record.get("quantity").toString()) : 100.0);

        return auction;
    }

    private String normalizeFishName(String raw) {
        String lower = raw.toLowerCase();
        if (lower.contains("tuna")) return "Tuna";
        if (lower.contains("salmon")) return "Salmon";
        if (lower.contains("pomfret")) return "Pomfret";
        if (lower.contains("hilsa")) return "Hilsa";
        if (lower.contains("prawn")) return "Prawns";
        return raw;
    }

    private String normalizeLocation(String raw) {
        String lower = raw.toLowerCase();
        if (lower.contains("madras") || lower.contains("chennai")) return "Chennai Harbor";
        if (lower.contains("cochin") || lower.contains("kochi")) return "Kochi Harbor";
        if (lower.contains("vizag") || lower.contains("visakhapatnam")) return "Vizag Harbor";
        if (lower.contains("mumbai") || lower.contains("bombay")) return "Mumbai Harbor";
        return raw + " Harbor";
    }
}

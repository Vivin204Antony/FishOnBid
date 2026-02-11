package com.FishOnBid.FishOnBid_Backend.ai.service;

import com.FishOnBid.FishOnBid_Backend.ai.dto.GovtFishResponseDTO;
import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
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

/**
 * Strategy 4: Real-Time Institutional Integration Service.
 * Implements ETL (Fetch-Transform-Load) for Government Fisheries APIs.
 */
@Service
@Slf4j
public class ExternalFisheriesService {

    private final AuctionRepository auctionRepository;
    private final WebClient webClient;

    @Value("${external.fisheries-api.url}")
    private String apiUrl;

    @Value("${external.fisheries-api.key}")
    private String apiKey;

    public ExternalFisheriesService(AuctionRepository auctionRepository, WebClient.Builder webClientBuilder) {
        this.auctionRepository = auctionRepository;
        this.webClient = webClientBuilder.build();
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

    private Mono<Map<String, Object>> performSync() {
        long startTime = System.currentTimeMillis();
        log.info("[Strategy 4] Connection to data.gov.in initiated...");

        return webClient.get()
            .uri(uriBuilder -> uriBuilder
                .path(apiUrl)
                .queryParam("api-key", apiKey)
                .queryParam("format", "json")
                .build())
            .retrieve()
            .bodyToMono(GovtFishResponseDTO.class)
            .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(10)))
            .flatMap(response -> {
                int count = processAndSave(response);
                long duration = System.currentTimeMillis() - startTime;
                log.info("[Strategy 4] Sync complete. {} records added/updated in {}ms.", count, duration);
                
                Map<String, Object> result = new java.util.HashMap<>();
                result.put("status", "success");
                result.put("recordsImported", count);
                result.put("durationMs", duration);
                result.put("timestamp", Instant.now());
                return Mono.just(result);
            })
            .onErrorResume(e -> {
                log.error("[Strategy 4] Sync Failed: {}", e.getMessage());
                Map<String, Object> errorResult = new java.util.HashMap<>();
                errorResult.put("status", "failed");
                errorResult.put("error", e.getMessage() != null ? e.getMessage() : "Unknown Connection Error");
                errorResult.put("timestamp", Instant.now());
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
            log.warn("[Strategy 4] Data Mapping Alert: {} records skipped due to unmapped parameters.", skippedCount.get());
        }

        return savedCount.get();
    }

    private Auction mapToAuction(Map<String, Object> record) {
        // ETL Logic: Normalization
        String rawFish = (String) record.getOrDefault("species", record.get("commodity"));
        if (rawFish == null) return null;

        String rawLocation = (String) record.getOrDefault("market", "Unknown");
        if (rawLocation.equalsIgnoreCase("Unknown")) {
            log.warn("[Strategy 4] Unmapped location found: \"{}\". Record skipped.", rawLocation);
            return null;
        }

        Auction auction = new Auction();
        auction.setFishName(normalizeFishName(rawFish));
        auction.setLocation(normalizeLocation(rawLocation));

        // Price mapping (supports different Govt API JSON structures)
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

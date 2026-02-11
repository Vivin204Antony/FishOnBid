package com.FishOnBid.FishOnBid_Backend.ai.controller;

import com.FishOnBid.FishOnBid_Backend.ai.service.ExternalFisheriesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Administrative controller for Managing Institutional Market Data (Strategy 4).
 */
@RestController
@RequestMapping("/api/admin/market")
@RequiredArgsConstructor
@Slf4j
public class MarketDataController {

    private final ExternalFisheriesService externalFisheriesService;

    /**
     * Trigger immediate synchronization with the Institutional OGD API.
     * Used for manual validation (Strategy 4 Ignition).
     */
    @PostMapping("/sync")
    public Mono<ResponseEntity<Map<String, Object>>> triggerManualSync() {
        log.info("REST_REQUEST: Manual Institutional Sync Triggered.");
        return externalFisheriesService.manualSync()
                .map(result -> {
                    if ("success".equals(result.get("status"))) {
                        return ResponseEntity.ok(result);
                    } else {
                        return ResponseEntity.internalServerError().body(result);
                    }
                });
    }
}

package com.FishOnBid.FishOnBid_Backend.config;

import com.FishOnBid.FishOnBid_Backend.ai.rag.RagVectorStore;
import com.FishOnBid.FishOnBid_Backend.ai.vision.VisionAnalysisService;
import com.FishOnBid.FishOnBid_Backend.events.InMemoryEventBus;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Application Configuration for Phase 3 features.
 * Includes custom health indicators and scheduling.
 */
@Configuration
@EnableScheduling
@RequiredArgsConstructor
public class AppConfig {

    private final VisionAnalysisService visionService;
    private final RagVectorStore ragVectorStore;
    private final InMemoryEventBus eventBus;

    /**
     * Custom health indicator for AI services
     */
    @Bean
    public HealthIndicator aiHealthIndicator() {
        return () -> {
            var visionStatus = visionService.getStatus();
            var ragStatus = ragVectorStore.getStats();
            var eventStats = eventBus.getStats();

            return Health.up()
                    .withDetail("vision", visionStatus)
                    .withDetail("rag", ragStatus)
                    .withDetail("events", eventStats)
                    .build();
        };
    }
}

package com.FishOnBid.FishOnBid_Backend.ai.service;

import com.FishOnBid.FishOnBid_Backend.ai.dto.AiPriceRequestDTO;
import com.FishOnBid.FishOnBid_Backend.ai.dto.AiPriceResponseDTO;
import com.FishOnBid.FishOnBid_Backend.ai.dto.VisionResultDTO;
import com.FishOnBid.FishOnBid_Backend.ai.entity.AiDecisionLog;
import com.FishOnBid.FishOnBid_Backend.ai.repository.AiDecisionLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * AI Orchestrator Service - Central coordinator for all AI operations.
 * Combines Vision + RAG + Pricing into a unified workflow.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiOrchestratorService {

    private final AiPricingService pricingService;
    private final VisionService visionService;
    private final AiDecisionLogRepository logRepository;
    private final ObjectMapper objectMapper;

    /**
     * Generate complete AI suggestion with optional vision analysis.
     * This is the main entry point for complex AI workflows.
     */
    public AiPriceResponseDTO generateCompleteSuggestion(
            AiPriceRequestDTO request,
            String[] imageBase64
    ) {
        log.info("AI_ORCHESTRATOR_START: fishName={}, hasImages={}",
                request.fishName(), imageBase64 != null && imageBase64.length > 0);

        long startTime = System.currentTimeMillis();
        Integer freshnessScore = request.freshnessScore();

        // Step 1: Vision Analysis (if images provided)
        if (imageBase64 != null && imageBase64.length > 0 && freshnessScore == null) {
            VisionResultDTO visionResult = visionService.analyzeMultipleImages(
                    imageBase64,
                    request.fishName()
            );
            freshnessScore = visionResult.freshnessScore();
            log.info("AI_VISION_RESULT: freshnessScore={}, quality={}",
                    visionResult.freshnessScore(), visionResult.quality());
        }

        // Step 2: Create enhanced request with vision data
        AiPriceRequestDTO enhancedRequest = new AiPriceRequestDTO(
                request.fishName(),
                request.quantityKg(),
                request.location(),
                freshnessScore
        );

        // Step 3: Generate price suggestion
        AiPriceResponseDTO response = pricingService.generatePriceSuggestion(enhancedRequest);

        // Step 4: Log the decision for audit
        long processingTime = System.currentTimeMillis() - startTime;
        logDecision(enhancedRequest, response, processingTime);

        log.info("AI_ORCHESTRATOR_COMPLETE: suggestedPrice={}, processingMs={}",
                response.suggestedPrice(), processingTime);

        return response;
    }

    /**
     * Simple price suggestion without images.
     */
    public AiPriceResponseDTO generatePriceSuggestion(AiPriceRequestDTO request) {
        return generateCompleteSuggestion(request, null);
    }

    /**
     * Log AI decision for audit trail and debugging.
     */
    private void logDecision(
            AiPriceRequestDTO request,
            AiPriceResponseDTO response,
            long processingTimeMs
    ) {
        try {
            AiDecisionLog logEntry = new AiDecisionLog();
            logEntry.setRequestType("PRICE_SUGGESTION");
            logEntry.setInputData(objectMapper.writeValueAsString(request));
            logEntry.setOutputData(objectMapper.writeValueAsString(response));
            logEntry.setDataPointsUsed(response.dataPointsUsed());
            logEntry.setProcessingTimeMs(processingTimeMs);

            logRepository.save(logEntry);
            log.debug("AI decision logged with ID: {}", logEntry.getId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize AI decision for logging", e);
        } catch (Exception e) {
            log.error("Failed to save AI decision log", e);
        }
    }

    /**
     * Get AI service health status.
     */
    public boolean isHealthy() {
        return visionService.isAvailable();
    }
}

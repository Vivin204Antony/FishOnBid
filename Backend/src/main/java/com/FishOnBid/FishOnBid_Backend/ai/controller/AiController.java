package com.FishOnBid.FishOnBid_Backend.ai.controller;

import com.FishOnBid.FishOnBid_Backend.ai.dto.AiPriceRequestDTO;
import com.FishOnBid.FishOnBid_Backend.ai.dto.AiPriceResponseDTO;
import com.FishOnBid.FishOnBid_Backend.ai.service.AiOrchestratorService;
import com.FishOnBid.FishOnBid_Backend.ai.service.AiPricingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for AI-powered auction pricing.
 * Provides endpoints for price suggestions using RAG.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class AiController {

    private final AiPricingService pricingService;
    private final AiOrchestratorService orchestratorService;

    /**
     * Get AI-assisted price suggestion for an auction.
     * Uses RAG (Retrieval-Augmented Generation) with historical auction data.
     * 
     * POST /api/ai/price-suggestion
     * 
     * Request Body:
     * {
     *   "fishName": "Tuna",
     *   "quantityKg": 50.0,
     *   "location": "Chennai Harbor",
     *   "freshnessScore": 85  // optional
     * }
     */
    @PostMapping("/price-suggestion")
    public ResponseEntity<AiPriceResponseDTO> suggestPrice(
            @RequestBody AiPriceRequestDTO request
    ) {
        log.info("Price suggestion requested for: {}", request.fishName());
        
        AiPriceResponseDTO response = pricingService.generatePriceSuggestion(request);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get AI price suggestion with optional image analysis.
     * Combines Vision + RAG for comprehensive pricing.
     * 
     * POST /api/ai/price-suggestion/complete
     */
    @PostMapping("/price-suggestion/complete")
    public ResponseEntity<AiPriceResponseDTO> suggestPriceComplete(
            @RequestBody Map<String, Object> requestBody
    ) {
        String fishName = (String) requestBody.get("fishName");
        Double quantityKg = requestBody.get("quantityKg") != null 
                ? ((Number) requestBody.get("quantityKg")).doubleValue() 
                : 0.0;
        String location = (String) requestBody.get("location");
        Integer freshnessScore = requestBody.get("freshnessScore") != null 
                ? ((Number) requestBody.get("freshnessScore")).intValue() 
                : null;
        
        @SuppressWarnings("unchecked")
        String[] images = requestBody.get("images") != null 
                ? ((java.util.List<String>) requestBody.get("images")).toArray(new String[0])
                : null;

        AiPriceRequestDTO request = new AiPriceRequestDTO(
                fishName, quantityKg, location, freshnessScore);

        log.info("Complete price suggestion requested for: {} with {} images",
                fishName, images != null ? images.length : 0);

        AiPriceResponseDTO response = orchestratorService.generateCompleteSuggestion(
                request, images);

        return ResponseEntity.ok(response);
    }

    /**
     * Health check endpoint for AI services.
     * 
     * GET /api/ai/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        boolean isHealthy = orchestratorService.isHealthy();
        
        return ResponseEntity.ok(Map.of(
                "status", isHealthy ? "UP" : "DOWN",
                "service", "AI Pricing Service",
                "ragEnabled", true,
                "visionEnabled", true,
                "genAiEnabled", false  // Will be true in Phase 3
        ));
    }
}

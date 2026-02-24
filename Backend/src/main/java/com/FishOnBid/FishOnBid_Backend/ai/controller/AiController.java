package com.FishOnBid.FishOnBid_Backend.ai.controller;

import com.FishOnBid.FishOnBid_Backend.ai.dto.AiPriceRequestDTO;
import com.FishOnBid.FishOnBid_Backend.ai.dto.AiPriceResponseDTO;
import com.FishOnBid.FishOnBid_Backend.ai.service.AiOrchestratorService;
import com.FishOnBid.FishOnBid_Backend.ai.service.AiPricingService;
import com.FishOnBid.FishOnBid_Backend.ai.vision.VisionAnalysisRequestDTO;
import com.FishOnBid.FishOnBid_Backend.ai.vision.VisionAnalysisResponseDTO;
import com.FishOnBid.FishOnBid_Backend.ai.vision.VisionAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for AI-powered auction pricing and vision analysis.
 * Provides endpoints for price suggestions using RAG and fish image analysis.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class AiController {

    private final AiPricingService pricingService;
    private final AiOrchestratorService orchestratorService;
    private final VisionAnalysisService visionAnalysisService;

    /**
     * Get AI-assisted price suggestion for an auction.
     * Uses RAG (Retrieval-Augmented Generation) with historical auction data.
     * 
     * POST /api/ai/price-suggestion
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
     * Analyze a fish image using AI Vision (GPT-4o).
     * Returns detected fish type, freshness score, quality grade, and explanation.
     * 
     * POST /api/ai/vision/analyze
     * 
     * Request Body:
     * {
     *   "imageBase64": "base64EncodedImageData",
     *   "fishType": "optional hint for context"
     * }
     */
    @PostMapping("/vision/analyze")
    public ResponseEntity<VisionAnalysisResponseDTO> analyzeImage(
            @RequestBody VisionAnalysisRequestDTO request
    ) {
        log.info("Vision analysis requested: hasImage={}, fishType={}",
                request.hasImage(), request.getFishType());

        VisionAnalysisResponseDTO result = visionAnalysisService.analyze(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Get vision service status.
     * 
     * GET /api/ai/vision/status
     */
    @GetMapping("/vision/status")
    public ResponseEntity<Map<String, Object>> visionStatus() {
        return ResponseEntity.ok(visionAnalysisService.getStatus());
    }

    /**
     * Health check endpoint for AI services.
     * 
     * GET /api/ai/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        boolean isHealthy = orchestratorService.isHealthy();
        Map<String, Object> visionStatus = visionAnalysisService.getStatus();
        
        return ResponseEntity.ok(Map.of(
                "status", isHealthy ? "UP" : "DOWN",
                "service", "AI Pricing + Vision Service",
                "ragEnabled", true,
                "visionEnabled", visionStatus.get("enabled"),
                "visionMode", visionStatus.get("mode"),
                "genAiEnabled", false
        ));
    }
}

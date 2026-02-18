package com.FishOnBid.FishOnBid_Backend.ai.service;

import com.FishOnBid.FishOnBid_Backend.ai.dto.AiExplanationDTO;
import com.FishOnBid.FishOnBid_Backend.ai.dto.AiPriceRequestDTO;
import com.FishOnBid.FishOnBid_Backend.ai.dto.AiPriceResponseDTO;
import com.FishOnBid.FishOnBid_Backend.ai.dto.RagDataDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * AI Pricing Service implementing RAG-based price suggestions.
 * Uses historical auction data to generate intelligent price recommendations
 * with structured, farmer-facing AI explanations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiPricingService {

    private final RagService ragService;
    private final ExternalDataService externalDataService;
    private final ExternalFisheriesService externalFisheriesService;

    // Configuration constants
    private static final double DEFAULT_BASE_PRICE = 500.0;
    private static final double CONFIDENCE_RANGE_PERCENT = 0.10;
    private static final int DEFAULT_LOOKBACK_DAYS = 90; // Increased from 7 to 90 days for historical data
    private static final double EXTERNAL_DATA_WEIGHT = 0.30;

    /**
     * Generate AI-assisted price suggestion using RAG and External Insights.
     */
    public AiPriceResponseDTO generatePriceSuggestion(AiPriceRequestDTO request) {
        log.info("AI_REQUEST_START: fishName={}, quantity={}, location={}",
                request.fishName(), request.quantityKg(), request.location());

        long startTime = System.currentTimeMillis();

        // Step 1: Retrieve historical data (RAG with Dynamic Trust)
        RagDataDTO ragData;
        if (request.location() != null && !request.location().isBlank()) {
            ragData = ragService.fetchHistoricalDataByLocation(
                    request.fishName(),
                    request.location(),
                    DEFAULT_LOOKBACK_DAYS
            );
        } else {
            ragData = ragService.fetchHistoricalData(
                    request.fishName(),
                    DEFAULT_LOOKBACK_DAYS
            );
        }

        // Step 2: Fetch external market pulse
        Double externalPrice = externalDataService.getExternalMarketPrice(request.fishName());

        // Step 3: Calculate price based on RAG + External data
        AiPriceResponseDTO response;

        if (!ragData.hasSufficientData() && externalPrice == null) {
            response = generateFallbackPrice(request, ragData);
        } else {
            response = generateHybridPrice(request, ragData, externalPrice);
        }

        long processingTime = System.currentTimeMillis() - startTime;
        log.info("AI_PRICE_OUTPUT: suggestedPrice={}, confidence={}, processingMs={}",
                response.suggestedPrice(), ragData.getConfidenceLevel(), processingTime);

        return response;
    }

    /**
     * Generate hybrid price with structured explanation breakdown.
     */
    private AiPriceResponseDTO generateHybridPrice(
            AiPriceRequestDTO request,
            RagDataDTO ragData,
            Double externalPrice
    ) {
        double internalBasePrice = ragData.hasSufficientData() ? ragData.averagePrice() : DEFAULT_BASE_PRICE;
        double finalBasePrice;

        if (externalPrice != null && ragData.hasSufficientData()) {
            finalBasePrice = (internalBasePrice * (1.0 - EXTERNAL_DATA_WEIGHT)) + (externalPrice * EXTERNAL_DATA_WEIGHT);
        } else if (externalPrice != null) {
            finalBasePrice = externalPrice;
        } else {
            finalBasePrice = internalBasePrice;
        }

        // Apply freshness score adjustment
        if (request.freshnessScore() != null) {
            double freshnessMultiplier = calculateFreshnessMultiplier(request.freshnessScore());
            finalBasePrice *= freshnessMultiplier;
        }

        // Apply quantity adjustment
        if (request.quantityKg() > 0 && ragData.averageQuantityKg() > 0) {
            double quantityRatio = request.quantityKg() / ragData.averageQuantityKg();
            if (quantityRatio > 1.5) {
                finalBasePrice *= 0.95;
            }
        }

        double suggestedPrice = Math.round(finalBasePrice * 100.0) / 100.0;
        double minPrice = Math.round(finalBasePrice * (1 - CONFIDENCE_RANGE_PERCENT) * 100.0) / 100.0;
        double maxPrice = Math.round(finalBasePrice * (1 + CONFIDENCE_RANGE_PERCENT) * 100.0) / 100.0;

        // Build structured explanation
        String dataFreshness = externalFisheriesService.getDataFreshness();

        Map<String, Double> sourceWeights = new LinkedHashMap<>();
        sourceWeights.put("Govt OGD (1.5x Trust)", 1.5);
        sourceWeights.put("Platform History (1.0x)", 1.0);
        sourceWeights.put("Demo Data (0.5x)", 0.5);

        String locationCtx = ragData.mostRecentLocation() != null
                ? ragData.mostRecentLocation()
                : (request.location() != null ? request.location() : "All Harbors");

        AiExplanationDTO breakdown = new AiExplanationDTO(
                String.format("₹%.0f based on %d verified records", suggestedPrice, ragData.auctionCount()),
                ragData.auctionCount(),
                ragData.govtRecordCount(),
                ragData.historicalRecordCount(),
                ragData.govtAveragePrice(),
                ragData.historicalAveragePrice(),
                ragData.dateRange(),
                ragData.getConfidenceLevel(),
                locationCtx,
                dataFreshness,
                sourceWeights
        );

        String explanation = String.format(
                "Based on %d records (%d Govt, %d Historical). " +
                "Dynamic Trust Weighted (Time-Decay + Source Authority). " +
                "Govt Avg: ₹%.0f | Historical Avg: ₹%.0f. " +
                "Confidence: %s. Data: %s.",
                ragData.auctionCount(), ragData.govtRecordCount(), ragData.historicalRecordCount(),
                ragData.govtAveragePrice(), ragData.historicalAveragePrice(),
                ragData.getConfidenceLevel(), dataFreshness
        );

        return AiPriceResponseDTO.of(suggestedPrice, minPrice, maxPrice, explanation,
                ragData.auctionCount(), breakdown);
    }

    /**
     * Generate fallback price when insufficient historical data.
     */
    private AiPriceResponseDTO generateFallbackPrice(
            AiPriceRequestDTO request,
            RagDataDTO ragData
    ) {
        double basePrice = DEFAULT_BASE_PRICE;

        if (request.freshnessScore() != null) {
            double freshnessMultiplier = calculateFreshnessMultiplier(request.freshnessScore());
            basePrice *= freshnessMultiplier;
        }

        double suggestedPrice = Math.round(basePrice * 100.0) / 100.0;
        double minPrice = Math.round(basePrice * (1 - CONFIDENCE_RANGE_PERCENT) * 100.0) / 100.0;
        double maxPrice = Math.round(basePrice * (1 + CONFIDENCE_RANGE_PERCENT) * 100.0) / 100.0;

        String explanation = String.format(
                "Limited historical data available (%d auctions). " +
                "Using market baseline estimate for %s. " +
                "Consider adjusting based on local market conditions.",
                ragData.auctionCount(), request.fishName()
        );

        AiExplanationDTO breakdown = new AiExplanationDTO(
                String.format("₹%.0f (Market Baseline Estimate)", suggestedPrice),
                ragData.auctionCount(),
                ragData.govtRecordCount(),
                ragData.historicalRecordCount(),
                ragData.govtAveragePrice(),
                ragData.historicalAveragePrice(),
                ragData.dateRange(),
                ragData.getConfidenceLevel(),
                request.location() != null ? request.location() : "Unknown",
                externalFisheriesService.getDataFreshness(),
                new LinkedHashMap<>()
        );

        return AiPriceResponseDTO.of(suggestedPrice, minPrice, maxPrice, explanation,
                ragData.auctionCount(), breakdown);
    }

    /**
     * Calculate price multiplier based on freshness score.
     */
    private double calculateFreshnessMultiplier(int freshnessScore) {
        return 0.8 + (freshnessScore / 100.0) * 0.4;
    }
}

package com.FishOnBid.FishOnBid_Backend.ai.service;

import com.FishOnBid.FishOnBid_Backend.ai.dto.AiPriceRequestDTO;
import com.FishOnBid.FishOnBid_Backend.ai.dto.AiPriceResponseDTO;
import com.FishOnBid.FishOnBid_Backend.ai.dto.RagDataDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * AI Pricing Service implementing RAG-based price suggestions.
 * Uses historical auction data to generate intelligent price recommendations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiPricingService {

    private final RagService ragService;
    private final ExternalDataService externalDataService;

    // Configuration constants
    private static final double DEFAULT_BASE_PRICE = 500.0;
    private static final double CONFIDENCE_RANGE_PERCENT = 0.10; // 10%
    private static final int DEFAULT_LOOKBACK_DAYS = 7;
    private static final double EXTERNAL_DATA_WEIGHT = 0.30; // 30% influence from Gov/External APIs

    /**
     * Generate AI-assisted price suggestion using RAG and External Insights.
     * 
     * @param request Price request with fish details
     * @return Price recommendation with confidence range
     */
    public AiPriceResponseDTO generatePriceSuggestion(AiPriceRequestDTO request) {
        log.info("AI_REQUEST_START: fishName={}, quantity={}, location={}",
                request.fishName(), request.quantityKg(), request.location());

        long startTime = System.currentTimeMillis();

        // Step 1: Retrieve historical data (RAG)
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
            // Fallback to default pricing
            response = generateFallbackPrice(request, ragData);
        } else {
            // Generate RAG-based price (with external influence)
            response = generateHybridPrice(request, ragData, externalPrice);
        }

        long processingTime = System.currentTimeMillis() - startTime;
        log.info("AI_PRICE_OUTPUT: suggestedPrice={}, confidence={}, processingMs={}",
                response.suggestedPrice(), ragData.getConfidenceLevel(), processingTime);

        return response;
    }

    /**
     * Generate hybrid price based on historical data (RAG) and external market pulse.
     */
    private AiPriceResponseDTO generateHybridPrice(
            AiPriceRequestDTO request,
            RagDataDTO ragData,
            Double externalPrice
    ) {
        double internalBasePrice = ragData.hasSufficientData() ? ragData.averagePrice() : DEFAULT_BASE_PRICE;
        double finalBasePrice;

        if (externalPrice != null && ragData.hasSufficientData()) {
            // Weighted average between internal and external
            finalBasePrice = (internalBasePrice * (1.0 - EXTERNAL_DATA_WEIGHT)) + (externalPrice * EXTERNAL_DATA_WEIGHT);
        } else if (externalPrice != null) {
            finalBasePrice = externalPrice;
        } else {
            finalBasePrice = internalBasePrice;
        }

        // Apply freshness score adjustment if provided
        if (request.freshnessScore() != null) {
            double freshnessMultiplier = calculateFreshnessMultiplier(request.freshnessScore());
            finalBasePrice *= freshnessMultiplier;
        }

        // Apply quantity adjustment (larger quantities may have different pricing)
        if (request.quantityKg() > 0 && ragData.averageQuantityKg() > 0) {
            double quantityRatio = request.quantityKg() / ragData.averageQuantityKg();
            // Slight discount for larger quantities
            if (quantityRatio > 1.5) {
                finalBasePrice *= 0.95;
            }
        }

        double minPrice = finalBasePrice * (1 - CONFIDENCE_RANGE_PERCENT);
        double maxPrice = finalBasePrice * (1 + CONFIDENCE_RANGE_PERCENT);

        StringBuilder explanation = new StringBuilder();
        if (ragData.hasSufficientData()) {
            explanation.append(String.format("Derived from %d past auctions (Avg: ₹%.2f). ", 
                    ragData.auctionCount(), internalBasePrice));
        }
        if (externalPrice != null) {
            explanation.append(String.format("Integrated external market pulse (₹%.2f). ", externalPrice));
        }
        explanation.append(String.format("Confidence: %s.", ragData.getConfidenceLevel()));

        return AiPriceResponseDTO.of(
                Math.round(finalBasePrice * 100.0) / 100.0,
                Math.round(minPrice * 100.0) / 100.0,
                Math.round(maxPrice * 100.0) / 100.0,
                explanation.toString(),
                ragData.auctionCount()
        );
    }

    /**
     * Generate fallback price when insufficient historical data.
     */
    private AiPriceResponseDTO generateFallbackPrice(
            AiPriceRequestDTO request,
            RagDataDTO ragData
    ) {
        double basePrice = DEFAULT_BASE_PRICE;

        // Apply freshness adjustment if available
        if (request.freshnessScore() != null) {
            double freshnessMultiplier = calculateFreshnessMultiplier(request.freshnessScore());
            basePrice *= freshnessMultiplier;
        }

        double minPrice = basePrice * (1 - CONFIDENCE_RANGE_PERCENT);
        double maxPrice = basePrice * (1 + CONFIDENCE_RANGE_PERCENT);

        String explanation = String.format(
                "Limited historical data available (%d auctions). " +
                "Using market baseline estimate for %s. " +
                "Consider adjusting based on local market conditions.",
                ragData.auctionCount(),
                request.fishName()
        );

        return AiPriceResponseDTO.of(
                Math.round(basePrice * 100.0) / 100.0,
                Math.round(minPrice * 100.0) / 100.0,
                Math.round(maxPrice * 100.0) / 100.0,
                explanation,
                ragData.auctionCount()
        );
    }

    /**
     * Calculate price multiplier based on freshness score.
     * Higher freshness = higher price.
     */
    private double calculateFreshnessMultiplier(int freshnessScore) {
        // Scale: 0-100 score maps to 0.8-1.2 multiplier
        // 50 = neutral (1.0), 100 = premium (1.2), 0 = discount (0.8)
        return 0.8 + (freshnessScore / 100.0) * 0.4;
    }
}

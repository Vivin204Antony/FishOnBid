package com.FishOnBid.FishOnBid_Backend.ai.vision;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for Vision-based fish analysis.
 * Supports both URL and Base64 image input.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisionAnalysisRequestDTO {

    /**
     * Type of fish being analyzed (used for mock logic)
     */
    private String fishType;

    /**
     * URL to the fish image (for external/cloud images)
     */
    private String imageUrl;

    /**
     * Base64-encoded image data (for direct uploads)
     */
    private String imageBase64;

    /**
     * Optional: Auction ID for context
     */
    private Long auctionId;

    /**
     * Check if image data is available
     */
    public boolean hasImage() {
        return (imageUrl != null && !imageUrl.isBlank()) 
            || (imageBase64 != null && !imageBase64.isBlank());
    }
}

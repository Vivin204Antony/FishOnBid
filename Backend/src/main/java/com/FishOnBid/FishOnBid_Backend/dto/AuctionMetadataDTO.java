package com.FishOnBid.FishOnBid_Backend.dto;

import java.util.List;

/**
 * DTO for auction metadata - available fish types and locations
 * Based on actual data in the system
 */
public record AuctionMetadataDTO(
    List<String> fishTypes,
    List<String> locations,
    String message
) {
    public static AuctionMetadataDTO of(List<String> fishTypes, List<String> locations) {
        return new AuctionMetadataDTO(
            fishTypes,
            locations,
            "Available options based on government market data"
        );
    }
}

package com.FishOnBid.FishOnBid_Backend.ai.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class GovtFishResponseDTO {
    private String status;
    private String message;
    private List<Map<String, Object>> records;
}

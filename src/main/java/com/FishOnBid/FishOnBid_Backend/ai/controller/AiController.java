package com.FishOnBid.FishOnBid_Backend.ai.controller;

import com.FishOnBid.FishOnBid_Backend.ai.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/query")
    public String queryAi(@RequestParam String q) {
        return aiService.processQuery(q);
    }
}

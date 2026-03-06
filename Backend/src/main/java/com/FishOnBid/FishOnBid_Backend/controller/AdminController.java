package com.FishOnBid.FishOnBid_Backend.controller;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;
import com.FishOnBid.FishOnBid_Backend.entity.User;
import com.FishOnBid.FishOnBid_Backend.repository.AuctionRepository;
import com.FishOnBid.FishOnBid_Backend.repository.BidRepository;
import com.FishOnBid.FishOnBid_Backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * AdminController — endpoints that require ROLE_ADMIN.
 *
 * Security note: all /api/admin/** requests are locked to ROLE_ADMIN
 * inside SecurityConfig, so NO inline @PreAuthorize is needed here.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final AuctionRepository auctionRepository;
    private final UserRepository    userRepository;
    private final BidRepository     bidRepository;

    // ─────────────────────────────────────────────────────────────────
    // OVERVIEW / STATS
    // ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/stats
     * Returns platform-level summary for the admin dashboard card.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalUsers    = userRepository.count();
        long totalAuctions = auctionRepository.count();
        long liveAuctions  = auctionRepository.findAll().stream()
                .filter(a -> Boolean.TRUE.equals(a.isActive())
                             && a.getEndTime() != null
                             && a.getEndTime().isAfter(Instant.now()))
                .count();
        long closedAuctions = totalAuctions - liveAuctions;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers",      totalUsers);
        stats.put("totalAuctions",   totalAuctions);
        stats.put("liveAuctions",    liveAuctions);
        stats.put("closedAuctions",  closedAuctions);

        log.info("Admin stats requested: users={}, auctions={}, live={}", totalUsers, totalAuctions, liveAuctions);
        return ResponseEntity.ok(stats);
    }

    // ─────────────────────────────────────────────────────────────────
    // USER MANAGEMENT
    // ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/users
     * Returns all registered users enriched with computed activity type:
     *   - Auctioneer : created ≥1 auction
     *   - Bidder     : placed ≥1 bid (no auctions)
     *   - Both       : has auctions AND bids
     *   - Admin      : role = ADMIN
     */
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> listAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> enriched = users.stream().map(u -> {
            long auctionCnt = auctionRepository.countBySellerEmail(u.getEmail());
            long bidCnt     = bidRepository.countByBidderEmail(u.getEmail());

            String userType;
            if ("ADMIN".equals(u.getRole())) {
                userType = "Admin";
            } else if (auctionCnt > 0 && bidCnt > 0) {
                userType = "Both";
            } else if (auctionCnt > 0) {
                userType = "Auctioneer";
            } else if (bidCnt > 0) {
                userType = "Bidder";
            } else {
                userType = "New User";
            }

            Map<String, Object> m = new HashMap<>();
            m.put("id",           u.getId());
            m.put("name",         u.getName());
            m.put("email",        u.getEmail());
            m.put("role",         u.getRole());
            m.put("userType",     userType);
            m.put("auctionCount", auctionCnt);
            m.put("bidCount",     bidCnt);
            return m;
        }).collect(Collectors.toList());

        log.info("Admin: listing {} users with activity types", enriched.size());
        return ResponseEntity.ok(enriched);
    }

    /**
     * PUT /api/admin/users/{id}/role
     * Body: { "role": "ADMIN" | "USER" }
     * Promotes or demotes a user's role.
     */
    @PutMapping("/users/{id}/role")
    public ResponseEntity<Map<String, Object>> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String newRole = body.get("role");
        if (newRole == null || (!newRole.equals("ADMIN") && !newRole.equals("USER"))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Role must be ADMIN or USER"));
        }

        return userRepository.findById(id).map(user -> {
            user.setRole(newRole);
            userRepository.save(user);
            log.info("Admin: updated user {} role to {}", id, newRole);
            return ResponseEntity.ok(Map.<String, Object>of(
                    "status", "success",
                    "userId", id,
                    "newRole", newRole
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/admin/users/{id}
     * Permanently removes a user account.
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        log.info("Admin: deleted user {}", id);
        return ResponseEntity.ok(Map.of("status", "deleted", "userId", id));
    }

    // ─────────────────────────────────────────────────────────────────
    // AUCTION MANAGEMENT
    // ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/auctions
     * Returns ALL auctions (active + closed + system-generated).
     */
    @GetMapping("/auctions")
    public ResponseEntity<List<Auction>> listAllAuctions() {
        List<Auction> all = auctionRepository.findAll();
        log.info("Admin: listing {} auctions", all.size());
        return ResponseEntity.ok(all);
    }

    /**
     * POST /api/admin/auctions/{id}/close
     * Force-closes an auction (sets active=false, endTime=now).
     */
    @PostMapping("/auctions/{id}/close")
    public ResponseEntity<Map<String, Object>> forceCloseAuction(@PathVariable Long id) {
        return auctionRepository.findById(id).map(auction -> {
            auction.setActive(false);
            auction.setEndTime(Instant.now());
            auctionRepository.save(auction);
            log.info("Admin: force-closed auction {}", id);
            return ResponseEntity.ok(Map.<String, Object>of(
                    "status", "closed",
                    "auctionId", id
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/admin/auctions/{id}
     * Permanently deletes an auction record.
     */
    @DeleteMapping("/auctions/{id}")
    public ResponseEntity<Map<String, Object>> deleteAuction(@PathVariable Long id) {
        if (!auctionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        auctionRepository.deleteById(id);
        log.info("Admin: deleted auction {}", id);
        return ResponseEntity.ok(Map.of("status", "deleted", "auctionId", id));
    }

    // ─────────────────────────────────────────────────────────────────
    // BULK IMPORT (retained from original implementation)
    // ─────────────────────────────────────────────────────────────────

    /**
     * POST /api/admin/import/auctions
     * Bulk imports historical auction data for AI training.
     */
    @PostMapping("/import/auctions")
    public ResponseEntity<Map<String, Object>> importAuctions(@RequestBody List<Map<String, Object>> data) {
        log.info("Admin: received bulk import request for {} items", data.size());

        List<Auction> auctions = data.stream().map(item -> {
            Auction auction = new Auction();
            auction.setFishName((String) item.get("fishName"));
            auction.setLocation((String) item.get("location"));
            auction.setStartPrice(((Number) item.get("startPrice")).doubleValue());
            auction.setCurrentPrice(((Number) item.get("currentPrice")).doubleValue());
            auction.setQuantityKg(item.get("quantityKg") != null ? ((Number) item.get("quantityKg")).doubleValue() : null);
            auction.setFreshnessScore(item.get("freshnessScore") != null ? ((Number) item.get("freshnessScore")).intValue() : null);
            auction.setActive(false);

            String endTimeStr = (String) item.get("endTime");
            if (endTimeStr != null) {
                auction.setEndTime(Instant.parse(endTimeStr));
                auction.setStartTime(auction.getEndTime().minus(12, ChronoUnit.HOURS));
            } else {
                auction.setEndTime(Instant.now());
                auction.setStartTime(Instant.now().minus(12, ChronoUnit.HOURS));
            }

            auction.setDataSource(Auction.AuctionDataSource.SYSTEM_GENERATED);
            return auction;
        }).collect(Collectors.toList());

        List<Auction> saved = auctionRepository.saveAll(auctions);
        log.info("Admin: successfully imported {} auctions", saved.size());

        return ResponseEntity.ok(Map.of(
                "status",  "success",
                "count",   saved.size(),
                "message", "Historical data imported successfully"
        ));
    }
}

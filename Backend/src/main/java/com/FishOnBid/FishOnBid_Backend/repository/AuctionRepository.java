package com.FishOnBid.FishOnBid_Backend.repository;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


public interface AuctionRepository extends JpaRepository<Auction, Long> {

    /**
     * Pessimistic lock for bid operations
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Auction a WHERE a.id = :id")
    Optional<Auction> findByIdForUpdate(@Param("id") Long id);

    // ===== RAG QUERIES FOR AI PRICING =====

    /**
     * Find completed auctions for a specific fish type within date range.
     * Used by RAG service for price suggestions.
     */
    @Query("""
        SELECT a FROM Auction a
        WHERE a.fishName = :fishName
        AND a.endTime >= :fromDate
        AND a.active = false
        ORDER BY a.endTime DESC
    """)
    List<Auction> findRecentAuctions(
            @Param("fishName") String fishName,
            @Param("fromDate") Instant fromDate
    );

    /**
     * Find completed auctions filtered by location for more accurate local pricing.
     */
    @Query("""
        SELECT a FROM Auction a
        WHERE a.fishName = :fishName
        AND a.location = :location
        AND a.endTime >= :fromDate
        AND a.active = false
        ORDER BY a.endTime DESC
    """)
    List<Auction> findRecentAuctionsByLocation(
            @Param("fishName") String fishName,
            @Param("location") String location,
            @Param("fromDate") Instant fromDate
    );

    /**
     * Find all active auctions
     */
    List<Auction> findByActiveTrue();

    /**
     * Find auctions by fish name (case-insensitive)
     */
    @Query("""
        SELECT a FROM Auction a
        WHERE LOWER(a.fishName) LIKE LOWER(CONCAT('%', :fishName, '%'))
        AND a.active = true
    """)
    List<Auction> findActiveByFishNameContaining(@Param("fishName") String fishName);

    /**
     * Find auctions by location
     */
    List<Auction> findByLocationAndActiveTrue(String location);

    /**
     * Get average closing price for a fish type (for analytics)
     */
    @Query("""
        SELECT AVG(a.currentPrice)
        FROM Auction a
        WHERE a.fishName = :fishName
        AND a.active = false
        AND a.endTime >= :fromDate
    """)
    Double getAverageClosingPrice(
            @Param("fishName") String fishName,
            @Param("fromDate") Instant fromDate
    );
}

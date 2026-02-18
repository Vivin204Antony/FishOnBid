package com.FishOnBid.FishOnBid_Backend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.FishOnBid.FishOnBid_Backend.entity.Auction;

import jakarta.persistence.LockModeType;


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
     * Find all active auctions ordered by creation time (newest first)
     */
    @Query("""
        SELECT a FROM Auction a
        WHERE a.active = true
        ORDER BY a.startTime DESC
    """)
    List<Auction> findByActiveTrue();

    /**
     * Find truly live auctions (active AND not expired) ordered by newest first
     */
    @Query("""
        SELECT a FROM Auction a
        WHERE a.active = true
        AND a.endTime > :currentTime
        ORDER BY a.startTime DESC
    """)
    List<Auction> findLiveAuctions(@Param("currentTime") Instant currentTime);

    /**
     * Find closed auctions (inactive OR expired) ordered by end time descending
     */
    @Query("""
        SELECT a FROM Auction a
        WHERE a.active = false
        OR a.endTime <= :currentTime
        ORDER BY a.endTime DESC
    """)
    List<Auction> findClosedAuctions(@Param("currentTime") Instant currentTime);

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

    /**
     * Get distinct fish types that have data (for dropdown population)
     */
    @Query("SELECT DISTINCT a.fishName FROM Auction a WHERE a.fishName IS NOT NULL ORDER BY a.fishName")
    List<String> findDistinctFishTypes();

    /**
     * Get distinct locations that have data (for dropdown population)
     */
    @Query("SELECT DISTINCT a.location FROM Auction a WHERE a.location IS NOT NULL ORDER BY a.location")
    List<String> findDistinctLocations();

    /**
     * Find generic Fish government data as fallback when specific fish type has no govt records
     */
    @Query("""
        SELECT a FROM Auction a
        WHERE a.fishName = 'Fish'
        AND a.location = :location
        AND a.endTime >= :fromDate
        AND a.active = false
        AND a.dataSource = 'GOVT_INSTITUTIONAL_API'
        ORDER BY a.endTime DESC
    """)
    List<Auction> findGenericFishGovtData(
            @Param("location") String location,
            @Param("fromDate") Instant fromDate
    );
}

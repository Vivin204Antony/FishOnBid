package com.FishOnBid.FishOnBid_Backend.ai.repository;

import com.FishOnBid.FishOnBid_Backend.ai.entity.AiDecisionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for AI decision audit logs.
 */
public interface AiDecisionLogRepository extends JpaRepository<AiDecisionLog, Long> {

    /**
     * Find logs by request type
     */
    List<AiDecisionLog> findByRequestType(String requestType);

    /**
     * Find logs within a date range
     */
    @Query("""
        SELECT l FROM AiDecisionLog l
        WHERE l.timestamp >= :fromDate
        ORDER BY l.timestamp DESC
    """)
    List<AiDecisionLog> findRecentLogs(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Count requests by type for analytics
     */
    @Query("""
        SELECT l.requestType, COUNT(l)
        FROM AiDecisionLog l
        WHERE l.timestamp >= :fromDate
        GROUP BY l.requestType
    """)
    List<Object[]> countByRequestType(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Get average processing time for performance monitoring
     */
    @Query("""
        SELECT AVG(l.processingTimeMs)
        FROM AiDecisionLog l
        WHERE l.timestamp >= :fromDate
    """)
    Double getAverageProcessingTime(@Param("fromDate") LocalDateTime fromDate);
}

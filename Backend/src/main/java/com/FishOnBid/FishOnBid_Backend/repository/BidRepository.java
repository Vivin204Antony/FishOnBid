package com.FishOnBid.FishOnBid_Backend.repository;

import com.FishOnBid.FishOnBid_Backend.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<Bid, Long> {

    Optional<Bid> findTopByAuctionIdOrderByAmountDesc(Long auctionId);

    List<Bid> findByAuctionIdOrderByAmountDesc(Long auctionId);

    List<Bid> findByBidderEmail(String bidderEmail);

    long countByBidderEmail(String bidderEmail);

    /**
     * Find the most recent bid by a specific bidder on a specific auction (for cooldown check)
     */
    Optional<Bid> findTopByBidderEmailAndAuctionIdOrderByBidTimeDesc(String bidderEmail, Long auctionId);

    /**
     * Count distinct auctions won by a bidder within a time window (for max-wins fairness).
     * A "win" = the highest bid on a closed auction.
     * Uses auction.currentPrice match since it equals the winning bid amount.
     */
    @Query("""
        SELECT COUNT(DISTINCT b.auction.id) FROM Bid b
        WHERE b.bidderEmail = :email
        AND b.auction.active = false
        AND b.auction.endTime >= :since
        AND b.amount = b.auction.currentPrice
    """)
    long countRecentWinsByBidder(@Param("email") String email, @Param("since") Instant since);

}

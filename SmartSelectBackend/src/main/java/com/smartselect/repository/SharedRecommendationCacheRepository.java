package com.smartselect.repository;

import com.smartselect.entity.SharedRecommendationCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SharedRecommendationCacheRepository
        extends JpaRepository<SharedRecommendationCache, Long> {

    /**
     * Find a fresh (less than 24h old) cache entry for a given key.
     * Returns empty if not found OR if the entry has expired.
     */
    @Query("""
            SELECT c FROM SharedRecommendationCache c
            WHERE c.cacheKey = :cacheKey
              AND c.createdAt > :expiryThreshold
            """)
    Optional<SharedRecommendationCache> findFreshByCacheKey(
            @Param("cacheKey") String cacheKey,
            @Param("expiryThreshold") LocalDateTime expiryThreshold
    );

    /**
     * Find by cache key regardless of age (used for update/delete).
     */
    Optional<SharedRecommendationCache> findByCacheKey(String cacheKey);

    /**
     * Scheduled cleanup: delete all entries older than 24 hours.
     * Called by @Scheduled in RecommendationService.
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM SharedRecommendationCache c WHERE c.createdAt < :threshold")
    int deleteExpiredEntries(@Param("threshold") LocalDateTime threshold);
}
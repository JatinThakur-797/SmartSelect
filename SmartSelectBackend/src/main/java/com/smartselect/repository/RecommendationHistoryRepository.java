package com.smartselect.repository;

import com.smartselect.entity.RecommendationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface RecommendationHistoryRepository extends JpaRepository<RecommendationHistory, Long> {

    /** Fetch last 3 recommendations for the dashboard, newest first. */
    List<RecommendationHistory> findTop3ByUserIdOrderByCreatedAtDesc(Long userId);

    /** Count total recommendations by user (for analytics). */
    long countByUserId(Long userId);

    /**
     * Keep only the 3 most recent entries for a user.
     * Deletes older records automatically after every new recommendation.
     */
    @Modifying
    @Transactional
    @Query(value = """
            DELETE FROM recommendation_history
            WHERE user_id = :userId
              AND id NOT IN (
                  SELECT t.id FROM (
                      SELECT id FROM recommendation_history
                      WHERE user_id = :userId
                      ORDER BY created_at DESC
                      LIMIT 3
                  ) t
              )
            """, nativeQuery = true)
    void deleteOldHistoryKeepLatest3(@Param("userId") Long userId);
}
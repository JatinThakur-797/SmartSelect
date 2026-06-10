package com.smartselect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ════════════════════════════════════════════════════════════════════════════
 * SHARED RECOMMENDATION CACHE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * When any user submits a recommendation request, we compute a deterministic
 * cache key from:
 *    (category) + (budget bucket) + (profession) + (MD5 of normalized usage)
 *
 * If another user makes the same effective request within 24 hours, we return
 * this cached result instantly — no Gemini call, no RapidAPI call needed.
 *
 * After 24 hours the row is deleted (by scheduled cleanup or on next hit)
 * and fresh data is generated. This ensures product prices / availability
 * are never stale.
 */
@Entity
@Table(
        name = "shared_recommendation_cache",
        indexes = {
                @Index(name = "idx_cache_key", columnList = "cache_key", unique = true),
                @Index(name = "idx_cache_created_at", columnList = "created_at")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedRecommendationCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Deterministic key: e.g. "laptop_25k-40k_student_a3f8bc12"
     * Unique — only one live entry per logical query bucket.
     */
    @Column(name = "cache_key", nullable = false, unique = true, length = 128)
    private String cacheKey;

    /** The category that produced this cache entry (for debugging). */
    @Column(nullable = false)
    private String category;

    /** Budget bucket label (e.g. "25k-40k"). */
    @Column(name = "budget_bucket", length = 20)
    private String budgetBucket;

    /** Profession label stored for reference. */
    private String profession;

    /** Number of times this cached result has been served. */
    @Column(name = "hit_count")
    @Builder.Default
    private Integer hitCount = 0;

    /**
     * JSON array of ProductDto objects — the actual recommendation payload.
     * Stored as TEXT (no extra extension needed).
     */
    @Column(name = "products_json", columnDefinition = "TEXT", nullable = false)
    private String productsJson;

    /** When this cache entry was created / last refreshed. */
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.hitCount == null) this.hitCount = 0;
    }
}

package com.smartselect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "recommendation_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String category;   // "laptop" or "smartphone"

    private Integer budget;

    private String profession;

    @Column(name = "usage_details", columnDefinition = "TEXT")
   private String usage;

    /**
     * JSON array of ProductDto objects serialized as text.
     * Stored as TEXT so no extra JSON column type needed.
     */
    @Column(name = "products_json", columnDefinition = "TEXT")
    private String productsJson;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}

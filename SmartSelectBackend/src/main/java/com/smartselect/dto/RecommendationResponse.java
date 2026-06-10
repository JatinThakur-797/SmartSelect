package com.smartselect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {

    private List<ProductDto> products;
    private String category;
    private Integer budget;
    private String profession;

    /** True if results were served from the shared 24-hour cache. */
    private boolean servedFromCache;

    /** When this cache entry was originally generated (null if fresh). */
    private LocalDateTime cachedAt;

    /** Human-readable cache age example "3 hours ago" */
    private String cacheAgeLabel;

    private LocalDateTime generatedAt;
}
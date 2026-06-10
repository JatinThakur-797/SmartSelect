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
public class HistoryItemDto {
    private Long id;
    private String category;
    private Integer budget;
    private String profession;
    private String usage;
    private List<ProductDto> products;
    private LocalDateTime createdAt;
}
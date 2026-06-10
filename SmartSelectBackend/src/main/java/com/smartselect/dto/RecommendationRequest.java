package com.smartselect.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RecommendationRequest {

    @NotBlank(message = "Category is required")
    @Pattern(regexp = "laptop|smartphone", message = "Category must be 'laptop' or 'smartphone'")
    private String category;

    @NotNull(message = "Budget is required")
    @Min(value = 5000,    message = "Budget must be at least ₹5,000")
    @Max(value = 300000,  message = "Budget must be at most ₹3,00,000")
    private Integer budget;

    @NotBlank(message = "Profession is required")
    private String profession;

    @NotBlank(message = "Usage description is required")
    @Size(min = 10, max = 1000, message = "Usage must be 10–1000 characters")
    private String usage;

    // ── Optional specs (both categories) ─────────────────────────────────────
    private String brandPreference;   // e.g. "Samsung", "Any"

    // ── Laptop-specific optional specs ────────────────────────────────────────
    private String ram;               // "8GB", "16GB", etc.
    private String storage;           // "256GB SSD", "512GB SSD"
    private String processor;         // "Intel Core i5", "AMD Ryzen 5"
    private String graphicsCard;      // "Integrated", "Dedicated (NVIDIA)"
    private String displaySize;       // "14 inch", "15.6 inch"

    // ── Smartphone-specific optional specs ────────────────────────────────────
    private String smartphoneRam;     // "6GB", "8GB"
    private String smartphoneStorage; // "128GB", "256GB"
    private String cameraPriority;    // "High", "Medium", "Basic"
    private String battery;           // "5000mAh+", "4000mAh+"
    private String fiveGPreference;   // "Yes", "No", "Doesn't matter"
}

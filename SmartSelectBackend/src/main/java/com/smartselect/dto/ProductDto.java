package com.smartselect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {

    private String name;           // Product name from Gemini
    private String imageUrl;       // Product image from Amazon
    private String amazonUrl;      // Direct Amazon product link
    private String price;          // Current price string e.g. "₹45,999"
    private String rating;         // e.g. "4.3"
    private Integer reviewCount;   // e.g. 2840
    private List<String> specs;    // Key specs bullet points
    private String aiReason;       // "Why this fits you" from Gemini
    private String brand;          // Extracted brand
    private String asin;           // Amazon ASIN
    private boolean fromCache;     // Whether this came from shared cache
}
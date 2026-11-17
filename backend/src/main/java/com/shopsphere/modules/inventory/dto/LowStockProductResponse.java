package com.shopsphere.modules.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockProductResponse {
    private Long id;
    private String name;
    private String sku;
    private String categoryName;
    private BigDecimal price;
    private Integer currentStock;
    private String imageUrl;
}

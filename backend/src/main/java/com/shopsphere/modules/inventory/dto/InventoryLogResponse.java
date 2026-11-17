package com.shopsphere.modules.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryLogResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private String changeType;
    private Integer quantityChange;
    private Integer resultingQuantity;
    private String referenceId;
    private Instant createdAt;
}

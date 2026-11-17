package com.shopsphere.modules.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAdjustmentRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "New target quantity is required")
    @Min(value = 0, message = "Target quantity cannot be negative")
    private Integer newQuantity;

    @NotBlank(message = "Adjustment reason is required (e.g. CYCLE_COUNT, DAMAGED_GOODS)")
    private String reason;
}

package com.shopsphere.modules.inventory.entity;

import com.shopsphere.modules.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "inventory_logs")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "change_type", length = 50, nullable = false)
    private String changeType; // e.g., ORDER_DEDUCTION, CANCELLATION_RESTORE, RESTOCK, MANUAL_ADJUSTMENT

    @Column(name = "quantity_change", nullable = false)
    private Integer quantityChange;

    @Column(name = "resulting_quantity", nullable = false)
    private Integer resultingQuantity;

    @Column(name = "reference_id", length = 100)
    private String referenceId; // e.g. orderNumber

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}

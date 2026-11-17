package com.shopsphere.modules.inventory.repository;

import com.shopsphere.modules.inventory.entity.InventoryLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {
    List<InventoryLog> findByProductIdOrderByCreatedAtDesc(Long productId);
    Page<InventoryLog> findByProductId(Long productId, Pageable pageable);
}

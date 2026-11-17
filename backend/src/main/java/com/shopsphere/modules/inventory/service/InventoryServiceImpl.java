package com.shopsphere.modules.inventory.service;

import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.common.response.PagedResponse;
import com.shopsphere.modules.inventory.dto.InventoryAdjustmentRequest;
import com.shopsphere.modules.inventory.dto.InventoryLogResponse;
import com.shopsphere.modules.inventory.dto.LowStockProductResponse;
import com.shopsphere.modules.inventory.dto.RestockRequest;
import com.shopsphere.modules.inventory.entity.InventoryLog;
import com.shopsphere.modules.inventory.repository.InventoryLogRepository;
import com.shopsphere.modules.product.entity.Product;
import com.shopsphere.modules.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryServiceImpl.class);

    private final ProductRepository productRepository;
    private final InventoryLogRepository inventoryLogRepository;

    @Override
    @Transactional
    public InventoryLogResponse restockProduct(RestockRequest request) {
        Product product = productRepository.findByIdWithPessimisticLock(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        int oldStock = product.getStockQuantity();
        int newStock = oldStock + request.getQuantity();
        product.setStockQuantity(newStock);
        productRepository.save(product);

        InventoryLog inventoryLog = InventoryLog.builder()
                .product(product)
                .changeType("RESTOCK")
                .quantityChange(request.getQuantity())
                .resultingQuantity(newStock)
                .referenceId(request.getReferenceReason())
                .build();

        InventoryLog savedLog = inventoryLogRepository.save(inventoryLog);
        log.info("Product {} (SKU: {}) restocked: +{} units. New stock: {}",
                product.getName(), product.getSku(), request.getQuantity(), newStock);

        return mapToLogResponse(savedLog);
    }

    @Override
    @Transactional
    public InventoryLogResponse adjustStock(InventoryAdjustmentRequest request) {
        Product product = productRepository.findByIdWithPessimisticLock(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        int oldStock = product.getStockQuantity();
        int delta = request.getNewQuantity() - oldStock;
        product.setStockQuantity(request.getNewQuantity());
        productRepository.save(product);

        InventoryLog inventoryLog = InventoryLog.builder()
                .product(product)
                .changeType("MANUAL_ADJUSTMENT")
                .quantityChange(delta)
                .resultingQuantity(request.getNewQuantity())
                .referenceId(request.getReason())
                .build();

        InventoryLog savedLog = inventoryLogRepository.save(inventoryLog);
        log.info("Product {} (SKU: {}) manual stock adjustment: {} -> {}. Reason: {}",
                product.getName(), product.getSku(), oldStock, request.getNewQuantity(), request.getReason());

        return mapToLogResponse(savedLog);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<InventoryLogResponse> getProductInventoryLogs(Long productId, int page, int size) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product", "id", productId);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<InventoryLog> logPage = inventoryLogRepository.findByProductId(productId, pageable);

        return PagedResponse.of(logPage.map(this::mapToLogResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LowStockProductResponse> getLowStockProducts(int threshold) {
        return productRepository.findAll().stream()
                .filter(p -> p.isActive() && p.getStockQuantity() <= threshold)
                .map(p -> LowStockProductResponse.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .sku(p.getSku())
                        .categoryName(p.getCategory().getName())
                        .price(p.getPrice())
                        .currentStock(p.getStockQuantity())
                        .imageUrl(p.getImageUrl())
                        .build())
                .collect(Collectors.toList());
    }

    private InventoryLogResponse mapToLogResponse(InventoryLog log) {
        return InventoryLogResponse.builder()
                .id(log.getId())
                .productId(log.getProduct().getId())
                .productName(log.getProduct().getName())
                .productSku(log.getProduct().getSku())
                .changeType(log.getChangeType())
                .quantityChange(log.getQuantityChange())
                .resultingQuantity(log.getResultingQuantity())
                .referenceId(log.getReferenceId())
                .createdAt(log.getCreatedAt())
                .build();
    }
}

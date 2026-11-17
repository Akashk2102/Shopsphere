package com.shopsphere.modules.product.service;

import com.shopsphere.common.response.PagedResponse;
import com.shopsphere.modules.product.dto.ProductRequest;
import com.shopsphere.modules.product.dto.ProductResponse;

import java.math.BigDecimal;

public interface ProductService {
    PagedResponse<ProductResponse> getProducts(
            String keyword,
            Long categoryId,
            String categorySlug,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean inStockOnly,
            int page,
            int size,
            String sortBy,
            String sortDir
    );

    ProductResponse getProductById(Long id);
    ProductResponse getProductBySlug(String slug);
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
}

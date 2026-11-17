package com.shopsphere.modules.product.service;

import com.shopsphere.modules.product.dto.CategoryRequest;
import com.shopsphere.modules.product.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllActiveCategories();
    CategoryResponse getCategoryBySlug(String slug);
    CategoryResponse getCategoryById(Long id);
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    void deleteCategory(Long id);
}

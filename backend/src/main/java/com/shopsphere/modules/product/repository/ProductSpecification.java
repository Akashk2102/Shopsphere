package com.shopsphere.modules.product.repository;

import com.shopsphere.modules.product.entity.Category;
import com.shopsphere.modules.product.entity.Product;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification for dynamic, multi-facet filtering on the Product catalog.
 * Dynamically builds SQL WHERE clauses based on provided query parameters.
 */
public class ProductSpecification {

    public static Specification<Product> filter(
            String keyword,
            Long categoryId,
            String categorySlug,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean inStockOnly,
            Boolean activeOnly
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Keyword search across name and description
            if (StringUtils.hasText(keyword)) {
                String searchPattern = "%" + keyword.toLowerCase().trim() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), searchPattern);
                predicates.add(cb.or(nameLike, descLike));
            }

            // 2. Category filtering (by ID or Slug)
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            } else if (StringUtils.hasText(categorySlug)) {
                Join<Product, Category> categoryJoin = root.join("category");
                predicates.add(cb.equal(categoryJoin.get("slug"), categorySlug));
            }

            // 3. Price range filtering
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            // 4. In-stock only filter
            if (Boolean.TRUE.equals(inStockOnly)) {
                predicates.add(cb.greaterThan(root.get("stockQuantity"), 0));
            }

            // 5. Active only filter (default for customer browsing)
            if (Boolean.TRUE.equals(activeOnly)) {
                predicates.add(cb.isTrue(root.get("active")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

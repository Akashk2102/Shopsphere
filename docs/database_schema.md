# ShopSphere — Database Schema & Data Modeling

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned_to
    USERS ||--o{ ADDRESSES : owns
    USERS ||--o| CARTS : owns
    USERS ||--o{ ORDERS : places

    CATEGORIES ||--o{ CATEGORIES : parent_category
    CATEGORIES ||--o{ PRODUCTS : categorizes

    CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : included_in

    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : ordered_as
    ORDERS ||--o{ PAYMENTS : generates

    PRODUCTS ||--o{ INVENTORY_LOGS : tracks_audit

    USERS {
        bigint id PK
        varchar email UK
        varchar password_hash
        varchar first_name
        varchar last_name
        varchar phone_number
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    ROLES {
        int id PK
        varchar name UK
        varchar description
    }

    ADDRESSES {
        bigint id PK
        bigint user_id FK
        varchar address_line1
        varchar city
        varchar state
        varchar postal_code
        varchar country
        boolean is_default
    }

    CATEGORIES {
        bigint id PK
        varchar name UK
        varchar slug UK
        text description
        bigint parent_id FK
        boolean is_active
    }

    PRODUCTS {
        bigint id PK
        bigint category_id FK
        varchar name
        varchar slug UK
        varchar sku UK
        text description
        numeric price
        int stock_quantity
        varchar image_url
        boolean is_active
        bigint version
    }

    CARTS {
        bigint id PK
        bigint user_id FK
        timestamp created_at
        timestamp updated_at
    }

    CART_ITEMS {
        bigint id PK
        bigint cart_id FK
        bigint product_id FK
        int quantity
    }

    ORDERS {
        bigint id PK
        varchar order_number UK
        bigint user_id FK
        varchar status
        numeric total_amount
        jsonb shipping_address_snapshot
        varchar idempotency_key UK
        timestamp created_at
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        varchar product_name
        varchar product_sku
        numeric unit_price
        int quantity
        numeric subtotal
    }

    PAYMENTS {
        bigint id PK
        bigint order_id FK
        varchar payment_reference UK
        varchar payment_method
        varchar payment_status
        numeric amount
        jsonb gateway_response
        timestamp created_at
    }

    INVENTORY_LOGS {
        bigint id PK
        bigint product_id FK
        varchar change_type
        int quantity_change
        int resulting_quantity
        varchar reference_id
        timestamp created_at
    }
```

## 2. Key Relational Decisions & Patterns

### 2.1 The Historical Price Snapshot Pattern
- **Problem:** If a product was bought at \$100, and next week the store increases the price to \$150, the past order record must still show \$100!
- **Solution:** `order_items` stores copies of `unit_price`, `product_name`, and `product_sku` at the exact millisecond of checkout. It does **not** rely on querying `products.price` for past orders.

### 2.2 Frozen Address Snapshot (`JSONB`)
- If the customer changes their default shipping address next month, past delivered packages must preserve the exact physical address where the package was originally shipped. We capture `shipping_address_snapshot` as immutable JSONB on the `orders` table.

### 2.3 Cascades and Delete Safety
- `products.category_id`: `ON DELETE RESTRICT`. You cannot accidentally delete an active category if products are mapped to it.
- `order_items.product_id`: `ON DELETE RESTRICT`. Deleting a product from the catalog must never corrupt or delete past customer receipts.

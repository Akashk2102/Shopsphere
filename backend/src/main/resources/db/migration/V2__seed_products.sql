-- Seed Categories
INSERT INTO categories (id, name, slug, description) VALUES
(1, 'Electronics', 'electronics', 'Smartphones, laptops, accessories and smart devices'),
(2, 'Audio & Sound', 'audio-sound', 'Headphones, earbuds, and premium wireless soundbars'),
(3, 'Wearables', 'wearables', 'Smartwatches, fitness bands, and wearable tech'),
(4, 'Accessories', 'accessories', 'Chargers, cases, cables, and travel accessories')
ON CONFLICT (id) DO NOTHING;

-- Seed Products
INSERT INTO products (id, category_id, name, slug, sku, description, price, stock_quantity, image_url, is_active, version) VALUES
(1, 1, 'ProBook Ultra 15 Laptop', 'probook-ultra-15', 'SKU-LAP-001', '15.6-inch OLED 120Hz display, Intel Core Ultra 7, 32GB LPDDR5X RAM, 1TB NVMe SSD with all-day battery life.', 1299.99, 25, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', TRUE, 0),
(2, 2, 'AcousticPro Noise Cancelling Headphones', 'acousticpro-nc-headphones', 'SKU-AUD-002', 'Premium active noise cancellation, 40-hour battery life, high-res audio drivers, and ultra-plush memory foam.', 249.50, 50, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', TRUE, 0),
(3, 3, 'PulseWatch Active Smartwatch', 'pulsewatch-active', 'SKU-WEAR-003', 'Continuous heart-rate & SpO2 monitoring, built-in GPS, 5ATM water resistance, and 7-day battery life.', 179.99, 40, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', TRUE, 0),
(4, 1, 'SpherePhone 15 Pro Smartphone', 'spherephone-15-pro', 'SKU-PHN-004', '6.7-inch Super Retina display, titanium chassis, triple 48MP camera system, and 5G connectivity.', 999.00, 15, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800', TRUE, 0),
(5, 4, 'MagFast 65W GaN Fast Charger', 'magfast-65w-gan-charger', 'SKU-ACC-005', 'Compact GaN fast charging brick with dual USB-C and USB-A ports, compatible with laptops and phones.', 39.99, 100, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800', TRUE, 0),
(6, 2, 'BassWave True Wireless Earbuds', 'basswave-tws-earbuds', 'SKU-AUD-006', 'IPX5 water-resistant wireless earbuds with deep dynamic bass, touch controls, and 30-hour charging case.', 79.99, 60, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800', TRUE, 0)
ON CONFLICT (id) DO NOTHING;

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

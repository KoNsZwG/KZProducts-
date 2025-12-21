-- Clean up existing data to avoid duplicates (optional, use with caution)
-- truncate table public.order_items cascade;
-- truncate table public.orders cascade;
-- truncate table public.cart_items cascade;
-- truncate table public.products cascade;
-- truncate table public.categories cascade;

-- Insert Categories
INSERT INTO public.categories (name, slug, description, image_url, sort_order)
VALUES 
('Processors', 'cpu', 'High-performance CPUs from Intel and AMD', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80', 1),
('Graphics Cards', 'gpu', 'Next-gen GPUs for gaming and creative work', 'https://images.unsplash.com/photo-1591489378430-ef2f3c529595?auto=format&fit=crop&w=800&q=80', 2),
('Memory', 'ram', 'High-speed DDR4 and DDR5 RAM modules', 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80', 3),
('Storage', 'ssd', 'Blazing fast NVMe M.2 and SATA SSDs', 'https://images.unsplash.com/photo-1628557044797-f21a172965e5?auto=format&fit=crop&w=800&q=80', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert Products
-- We use a CTE to look up category IDs dynamically so this script is portable
WITH cats AS (
  SELECT id, slug FROM public.categories
)
INSERT INTO public.products (category_id, name, slug, description, price, compare_at_price, stock_quantity, images, is_active, metadata)
VALUES
-- CPUs
((SELECT id FROM cats WHERE slug = 'cpu'), 'Intel Core i9-14900K', 'intel-core-i9-14900k', 'The world''s fastest desktop processor. 24 cores (8P+16E), up to 6.0 GHz.', 689.00, 749.00, 50, ARRAY['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80'], true, '{"socket": "LGA1700", "cores": 24, "tdp": "125W"}'),
((SELECT id FROM cats WHERE slug = 'cpu'), 'AMD Ryzen 9 7950X3D', 'amd-ryzen-9-7950x3d', 'The ultimate gaming processor with 3D V-Cache technology.', 649.00, 699.00, 45, ARRAY['https://images.unsplash.com/photo-1555616635-6409600377c8?auto=format&fit=crop&w=800&q=80'], true, '{"socket": "AM5", "cores": 16, "tdp": "120W"}'),

-- GPUs
((SELECT id FROM cats WHERE slug = 'gpu'), 'NVIDIA GeForce RTX 4090', 'nvidia-rtx-4090', 'The ultimate GeForce GPU. A huge leap in performance, efficiency, and AI-powered graphics.', 1899.00, 1999.00, 10, ARRAY['https://images.unsplash.com/photo-1591489378430-ef2f3c529595?auto=format&fit=crop&w=800&q=80'], true, '{"vram": "24GB GDDR6X", "interface": "PCIe 4.0"}'),
((SELECT id FROM cats WHERE slug = 'gpu'), 'AMD Radeon RX 7900 XTX', 'amd-radeon-rx-7900-xtx', 'Experience the world''s most advanced graphics for gamers and creators.', 1099.00, 1149.00, 25, ARRAY['https://images.unsplash.com/photo-1626218174358-77b7f9a460b8?auto=format&fit=crop&w=800&q=80'], true, '{"vram": "24GB GDDR6", "interface": "PCIe 4.0"}'),

-- RAM
((SELECT id FROM cats WHERE slug = 'ram'), 'Corsair Vengeance 32GB (2x16GB) DDR5', 'corsair-vengeance-32gb-ddr5', 'Push the limits of your system with DDR5 memory that unlocks even faster frequencies.', 129.99, 149.99, 100, ARRAY['https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80'], true, '{"speed": "6000MHz", "latency": "CL30"}'),

-- SSD
((SELECT id FROM cats WHERE slug = 'ssd'), 'Samsung 990 PRO 2TB', 'samsung-990-pro-2tb', 'Reach max performance of PCIe 4.0. Experience longer-lasting, opponent-blasting speed.', 179.99, 219.99, 80, ARRAY['https://images.unsplash.com/photo-1628557044797-f21a172965e5?auto=format&fit=crop&w=800&q=80'], true, '{"type": "M.2 NVMe", "read_speed": "7450 MB/s"}')
ON CONFLICT (slug) DO UPDATE 
SET 
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity,
  description = EXCLUDED.description;

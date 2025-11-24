ALTER TABLE `product` ADD `stock` int DEFAULT 0 NOT NULL;
ALTER TABLE `product` ADD CONSTRAINT `product_name_unique` UNIQUE(`name`);
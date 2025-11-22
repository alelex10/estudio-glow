ALTER TABLE `product` ADD `stock` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `product` ADD CONSTRAINT `product_name_unique` UNIQUE(`name`);
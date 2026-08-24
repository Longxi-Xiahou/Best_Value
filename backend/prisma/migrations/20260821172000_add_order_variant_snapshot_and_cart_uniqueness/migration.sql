-- Add the immutable variant label captured at order time.
ALTER TABLE `OrderItem` ADD COLUMN `variantName` VARCHAR(500) NULL;

-- Prevent duplicate product/variant lines within one user's cart.
CREATE UNIQUE INDEX `CartItem_cartId_productId_variantId_key` ON `CartItem`(`cartId`, `productId`, `variantId`);

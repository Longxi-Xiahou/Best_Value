-- CreateIndex
CREATE INDEX `Product_status_basePrice_idx` ON `Product`(`status`, `basePrice`);

-- CreateIndex
CREATE INDEX `Product_status_createdAt_idx` ON `Product`(`status`, `createdAt`);

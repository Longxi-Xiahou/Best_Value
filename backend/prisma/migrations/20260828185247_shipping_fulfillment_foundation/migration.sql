-- AlterTable
ALTER TABLE `Order` ADD COLUMN `shippingMethodId` VARCHAR(50) NULL,
    ADD COLUMN `shippingMethodName` VARCHAR(100) NULL;

-- CreateTable
CREATE TABLE `Fulfillment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `sellerId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `shippingMethodId` VARCHAR(50) NOT NULL,
    `shippingMethodName` VARCHAR(100) NOT NULL,
    `shippingCost` DECIMAL(12, 2) NOT NULL,
    `trackingNumber` VARCHAR(191) NULL,
    `carrier` VARCHAR(100) NULL,
    `shippedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Fulfillment_orderId_status_idx`(`orderId`, `status`),
    INDEX `Fulfillment_sellerId_status_idx`(`sellerId`, `status`),
    UNIQUE INDEX `Fulfillment_orderId_sellerId_key`(`orderId`, `sellerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FulfillmentItem` (
    `id` VARCHAR(191) NOT NULL,
    `fulfillmentId` VARCHAR(191) NOT NULL,
    `orderItemId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FulfillmentItem_fulfillmentId_idx`(`fulfillmentId`),
    INDEX `FulfillmentItem_orderItemId_idx`(`orderItemId`),
    UNIQUE INDEX `FulfillmentItem_fulfillmentId_orderItemId_key`(`fulfillmentId`, `orderItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Fulfillment` ADD CONSTRAINT `Fulfillment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fulfillment` ADD CONSTRAINT `Fulfillment_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `Seller`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FulfillmentItem` ADD CONSTRAINT `FulfillmentItem_fulfillmentId_fkey` FOREIGN KEY (`fulfillmentId`) REFERENCES `Fulfillment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FulfillmentItem` ADD CONSTRAINT `FulfillmentItem_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

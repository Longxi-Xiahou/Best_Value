-- CreateTable
CREATE TABLE `SearchEvent` (
    `id` VARCHAR(191) NOT NULL,
    `query` VARCHAR(100) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SearchEvent_query_createdAt_idx`(`query`, `createdAt`),
    INDEX `SearchEvent_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SearchEvent` ADD CONSTRAINT `SearchEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `AdminAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `adminUserId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `targetType` VARCHAR(80) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `AdminAuditLog_adminUserId_createdAt_idx`(`adminUserId`, `createdAt`),
    INDEX `AdminAuditLog_targetType_targetId_createdAt_idx`(`targetType`, `targetId`, `createdAt`),
    INDEX `AdminAuditLog_action_createdAt_idx`(`action`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AdminAuditLog`
    ADD CONSTRAINT `AdminAuditLog_adminUserId_fkey`
    FOREIGN KEY (`adminUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

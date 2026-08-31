-- Idempotent because MySQL may commit DDL before a later statement fails.
SET @stmt = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Review' AND column_name = 'status') = 0, 'ALTER TABLE `Review` ADD COLUMN `status` ENUM(\'PUBLISHED\', \'HIDDEN\', \'REMOVED\') NOT NULL DEFAULT \'PUBLISHED\'', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;
SET @stmt = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Review' AND column_name = 'verifiedPurchase') = 0, 'ALTER TABLE `Review` ADD COLUMN `verifiedPurchase` BOOLEAN NOT NULL DEFAULT false', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;

SET @stmt = IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = DATABASE() AND table_name = 'Review' AND constraint_name = 'Review_productId_fkey') > 0, 'ALTER TABLE `Review` DROP FOREIGN KEY `Review_productId_fkey`', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;

SET @stmt = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'Review' AND index_name = 'Review_productId_createdAt_idx') > 0, 'DROP INDEX `Review_productId_createdAt_idx` ON `Review`', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;

CREATE TABLE IF NOT EXISTS `ReviewReport` (
  `id` VARCHAR(191) NOT NULL, `reviewId` VARCHAR(191) NOT NULL, `reporterUserId` VARCHAR(191) NOT NULL,
  `reason` ENUM('SPAM','HARASSMENT','OFF_TOPIC','FAKE_REVIEW','INAPPROPRIATE','OTHER') NOT NULL,
  `details` VARCHAR(1000) NULL, `status` ENUM('OPEN','REVIEWED','DISMISSED','ACTIONED') NOT NULL DEFAULT 'OPEN',
  `resolvedAt` DATETIME(3) NULL, `resolvedByUserId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `ReviewReport_reviewId_reporterUserId_key`(`reviewId`,`reporterUserId`),
  INDEX `ReviewReport_reviewId_createdAt_idx`(`reviewId`,`createdAt`), INDEX `ReviewReport_status_createdAt_idx`(`status`,`createdAt`),
  INDEX `ReviewReport_reporterUserId_createdAt_idx`(`reporterUserId`,`createdAt`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ReviewModerationAction` (
  `id` VARCHAR(191) NOT NULL, `reviewId` VARCHAR(191) NOT NULL, `adminUserId` VARCHAR(191) NOT NULL,
  `action` ENUM('HIDE','RESTORE','REMOVE') NOT NULL, `reason` VARCHAR(1000) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ReviewModerationAction_reviewId_createdAt_idx`(`reviewId`,`createdAt`), INDEX `ReviewModerationAction_adminUserId_createdAt_idx`(`adminUserId`,`createdAt`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @stmt = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'Review' AND index_name = 'Review_productId_status_createdAt_idx') = 0, 'CREATE INDEX `Review_productId_status_createdAt_idx` ON `Review`(`productId`,`status`,`createdAt`)', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;
SET @stmt = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'Review' AND index_name = 'Review_productId_status_rating_idx') = 0, 'CREATE INDEX `Review_productId_status_rating_idx` ON `Review`(`productId`,`status`,`rating`)', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;
SET @stmt = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'Review' AND index_name = 'Review_userId_createdAt_idx') = 0, 'CREATE INDEX `Review_userId_createdAt_idx` ON `Review`(`userId`,`createdAt`)', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;

SET @stmt = IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = DATABASE() AND table_name = 'Review' AND constraint_name = 'Review_productId_fkey') = 0, 'ALTER TABLE `Review` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;
SET @stmt = IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = DATABASE() AND table_name = 'ReviewReport' AND constraint_name = 'ReviewReport_reviewId_fkey') = 0, 'ALTER TABLE `ReviewReport` ADD CONSTRAINT `ReviewReport_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `Review`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;
SET @stmt = IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = DATABASE() AND table_name = 'ReviewReport' AND constraint_name = 'ReviewReport_reporterUserId_fkey') = 0, 'ALTER TABLE `ReviewReport` ADD CONSTRAINT `ReviewReport_reporterUserId_fkey` FOREIGN KEY (`reporterUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;
SET @stmt = IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = DATABASE() AND table_name = 'ReviewReport' AND constraint_name = 'ReviewReport_resolvedByUserId_fkey') = 0, 'ALTER TABLE `ReviewReport` ADD CONSTRAINT `ReviewReport_resolvedByUserId_fkey` FOREIGN KEY (`resolvedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;
SET @stmt = IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = DATABASE() AND table_name = 'ReviewModerationAction' AND constraint_name = 'ReviewModerationAction_reviewId_fkey') = 0, 'ALTER TABLE `ReviewModerationAction` ADD CONSTRAINT `ReviewModerationAction_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `Review`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;
SET @stmt = IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = DATABASE() AND table_name = 'ReviewModerationAction' AND constraint_name = 'ReviewModerationAction_adminUserId_fkey') = 0, 'ALTER TABLE `ReviewModerationAction` ADD CONSTRAINT `ReviewModerationAction_adminUserId_fkey` FOREIGN KEY (`adminUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE', 'SELECT 1');
PREPARE phase10_stmt FROM @stmt; EXECUTE phase10_stmt; DEALLOCATE PREPARE phase10_stmt;

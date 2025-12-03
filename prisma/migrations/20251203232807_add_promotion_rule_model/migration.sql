/*
  Warnings:

  - You are about to drop the column `ruleType` on the `promotion` table. All the data in the column will be lost.
  - Added the required column `ruleId` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `promotion` DROP COLUMN `ruleType`,
    ADD COLUMN `ruleId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `PromotionRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `conditionLabel` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PromotionRule_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Promotion` ADD CONSTRAINT `Promotion_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `PromotionRule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

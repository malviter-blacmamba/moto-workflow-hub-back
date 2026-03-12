-- AlterTable
ALTER TABLE `workorder` ADD COLUMN `assignedToId` INTEGER NULL,
    ADD COLUMN `createdById` INTEGER NULL,
    ADD COLUMN `deliveredAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `WorkOrder_createdById_fkey` ON `workorder`(`createdById`);

-- CreateIndex
CREATE INDEX `WorkOrder_assignedToId_fkey` ON `workorder`(`assignedToId`);

-- CreateIndex
CREATE INDEX `idx_workorder_status_deliveredAt` ON `workorder`(`status`, `deliveredAt`);

-- AddForeignKey
ALTER TABLE `workorder` ADD CONSTRAINT `WorkOrder_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workorder` ADD CONSTRAINT `WorkOrder_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `client` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `motorcycle` ADD COLUMN `hoursUsed` INTEGER NULL,
    ADD COLUMN `type` ENUM('MOTO', 'ATV') NOT NULL DEFAULT 'MOTO',
    MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `promotion` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `promotionrule` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `reminder` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `service` ADD COLUMN `vehicleType` ENUM('MOTO', 'ATV') NOT NULL DEFAULT 'MOTO',
    MODIFY `maintenanceRule` ENUM('NONE', 'BY_MONTHS', 'BY_KM', 'BY_DAYS', 'BY_HOURS') NOT NULL DEFAULT 'NONE',
    MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `user` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `workorder` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `idx_motorcycle_client_type` ON `motorcycle`(`clientId`, `type`);

-- CreateIndex
CREATE INDEX `idx_service_vehicleType` ON `service`(`vehicleType`);

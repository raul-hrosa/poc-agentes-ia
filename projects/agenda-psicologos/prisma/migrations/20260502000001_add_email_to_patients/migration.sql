-- AlterTable
ALTER TABLE `patients` ADD COLUMN `email` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `appointment_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `appointment_id` VARCHAR(36) NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `action` VARCHAR(20) NULL,

    UNIQUE INDEX `appointment_tokens_token_key`(`token`),
    INDEX `appointment_tokens_appointment_id_idx`(`appointment_id`),
    INDEX `appointment_tokens_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `appointment_tokens` ADD CONSTRAINT `appointment_tokens_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

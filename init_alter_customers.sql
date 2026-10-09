USE `rajalaptop`;

ALTER TABLE `customers`
  ADD COLUMN `password_hash` VARCHAR(255) NOT NULL AFTER `phone`,
  ADD COLUMN `tier` VARCHAR(50) NOT NULL DEFAULT 'Member' AFTER `password_hash`,
  ADD COLUMN `points` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `tier`,
  ADD UNIQUE INDEX `uk_customers_email` (`email`);

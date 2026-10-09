-- ==============================
-- RBAC tables needed by the app
-- ==============================

-- 1️⃣ roles (master table)
CREATE TABLE IF NOT EXISTS `roles` (
  `id`            VARCHAR(64)  NOT NULL PRIMARY KEY,
  `slug`          VARCHAR(64) NOT NULL UNIQUE,
  `name`          VARCHAR(120) NOT NULL,
  `description`   TEXT,
  `default_scope` ENUM('ALL','AREA','STORE','OWN') NOT NULL DEFAULT 'STORE',
  `is_system`     TINYINT(1)   NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2️⃣ role_permissions (pivot table)
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id`       VARCHAR(64)  NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  `scope`         ENUM('ALL','AREA','STORE','OWN') NOT NULL DEFAULT 'STORE',
  PRIMARY KEY (`role_id`,`permission_id`),
  FOREIGN KEY (`role_id`)       REFERENCES `roles`(`id`)       ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3️⃣ Insert a default system role (Super Admin) – has access to everything
INSERT IGNORE INTO `roles` (
    `id`, `slug`, `name`, `default_scope`, `is_system`
) VALUES (
    'role-super-admin', 'super_admin', 'Super Admin', 'ALL', 1
);

-- =============================================================
-- FORMA Platform — Database Schema
-- MySQL 8.0+  |  UTF8MB4  |  Full Unicode
-- =============================================================
CREATE DATABASE IF NOT EXISTS forma_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE forma_db;

-- -----------------------------------------------------------
-- 1. types — типы ресурсов (шрифты, иконки, иллюстрации, шаблоны)
-- -----------------------------------------------------------
CREATE TABLE types (
    id   BIGINT       NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_types_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 2. licenses — типы лицензий
-- -----------------------------------------------------------
CREATE TABLE licenses (
    id    BIGINT       NOT NULL AUTO_INCREMENT,
    name  VARCHAR(100) NOT NULL,
    type  VARCHAR(50)  NOT NULL COMMENT 'PERSONAL | COMMERCIAL',
    terms TEXT         NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 3. users — пользователи платформы
-- -----------------------------------------------------------
CREATE TABLE users (
    id                     BIGINT       NOT NULL AUTO_INCREMENT,
    first_name             VARCHAR(100) NOT NULL,
    last_name              VARCHAR(100) NOT NULL,
    email                  VARCHAR(255) NOT NULL,
    password_hash          VARCHAR(255) NOT NULL,
    phone                  VARCHAR(20),
    role                   VARCHAR(50)  NOT NULL DEFAULT 'BUYER'
                               COMMENT 'BUYER | AUTHOR | ADMIN',
    status                 VARCHAR(50)  NOT NULL DEFAULT 'PENDING_EMAIL'
                               COMMENT 'PENDING_EMAIL | ACTIVE | BLOCKED',
    email_confirmed        TINYINT(1)   NOT NULL DEFAULT 0,
    email_confirm_token    VARCHAR(255),
    password_reset_token   VARCHAR(255),
    password_reset_expires DATETIME,
    two_factor_secret      VARCHAR(255),
    two_factor_enabled     TINYINT(1)   NOT NULL DEFAULT 0,
    last_login_at          DATETIME,
    login_attempts         INT          NOT NULL DEFAULT 0,
    locked_until           DATETIME,
    registered_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    INDEX idx_users_status (status),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 4. profiles — расширенный профиль пользователя
-- -----------------------------------------------------------
CREATE TABLE profiles (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    display_name  VARCHAR(150),
    bio           TEXT,
    avatar_url    VARCHAR(500),
    country       VARCHAR(100),
    portfolio_url VARCHAR(500),
    updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_profiles_user (user_id),
    CONSTRAINT fk_profiles_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 5. authors — профиль автора (1:1 с users)
-- -----------------------------------------------------------
CREATE TABLE authors (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    username            VARCHAR(100)  NOT NULL,
    portfolio           VARCHAR(500),
    verification_status VARCHAR(50)   NOT NULL DEFAULT 'PENDING'
                            COMMENT 'PENDING | VERIFIED | REJECTED',
    biography           TEXT,
    balance             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_earnings      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rating              DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
    sales_count         INT           NOT NULL DEFAULT 0,
    created_at          DATETIME               DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_authors_user (user_id),
    UNIQUE KEY uq_authors_username (username),
    INDEX idx_authors_verification (verification_status),
    CONSTRAINT fk_authors_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 6. categories — категории ресурсов
-- -----------------------------------------------------------
CREATE TABLE categories (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    slug       VARCHAR(100) NOT NULL,
    type_id    BIGINT,
    parent_id  BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_slug (slug),
    CONSTRAINT fk_categories_type   FOREIGN KEY (type_id)
        REFERENCES types (id) ON DELETE SET NULL,
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id)
        REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 7. tags — теги для классификации
-- -----------------------------------------------------------
CREATE TABLE tags (
    id       BIGINT       NOT NULL AUTO_INCREMENT,
    name     VARCHAR(100) NOT NULL,
    slug     VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    PRIMARY KEY (id),
    UNIQUE KEY uq_tags_name (name),
    UNIQUE KEY uq_tags_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 8. resources — цифровые ресурсы
-- -----------------------------------------------------------
CREATE TABLE resources (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    author_id      BIGINT        NOT NULL,
    type_id        BIGINT        NOT NULL,
    license_id     BIGINT        NOT NULL,
    category_id    BIGINT,
    name           VARCHAR(255)  NOT NULL,
    slug           VARCHAR(255)  NOT NULL,
    description    TEXT,
    price          DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    discount       DECIMAL(5,2)            DEFAULT 0.00
                       CHECK (discount >= 0 AND discount <= 100),
    file_hash      VARCHAR(64)             COMMENT 'SHA-256 хеш файла',
    file_path      VARCHAR(500),
    status         VARCHAR(50)   NOT NULL DEFAULT 'DRAFT'
                       COMMENT 'DRAFT | PENDING | PUBLISHED | HIDDEN | DELETED',
    avg_rating     DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
    download_count INT           NOT NULL DEFAULT 0,
    view_count     INT           NOT NULL DEFAULT 0,
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME               DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_resources_slug (slug),
    INDEX idx_resources_author  (author_id),
    INDEX idx_resources_type    (type_id),
    INDEX idx_resources_status  (status),
    INDEX idx_resources_price   (price),
    INDEX idx_resources_created (created_at),
    FULLTEXT INDEX ft_resources_search (name, description),
    CONSTRAINT fk_resources_author   FOREIGN KEY (author_id)
        REFERENCES authors (id) ON DELETE RESTRICT,
    CONSTRAINT fk_resources_type     FOREIGN KEY (type_id)
        REFERENCES types (id) ON DELETE RESTRICT,
    CONSTRAINT fk_resources_license  FOREIGN KEY (license_id)
        REFERENCES licenses (id) ON DELETE RESTRICT,
    CONSTRAINT fk_resources_category FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 9. fonts — дополнительные атрибуты шрифта (1:1 с resources)
-- -----------------------------------------------------------
CREATE TABLE fonts (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    resource_id       BIGINT       NOT NULL,
    style             VARCHAR(100) COMMENT 'regular, bold, italic, light',
    family            VARCHAR(100),
    format            VARCHAR(50)  COMMENT 'OTF | TTF | WOFF | WOFF2',
    supports_cyrillic TINYINT(1)   DEFAULT 0,
    supports_latin    TINYINT(1)   DEFAULT 1,
    weight_range      VARCHAR(50)  COMMENT '100-900',
    PRIMARY KEY (id),
    UNIQUE KEY uq_fonts_resource (resource_id),
    CONSTRAINT fk_fonts_resource FOREIGN KEY (resource_id)
        REFERENCES resources (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 10. resource_files — файлы ресурса (может быть несколько форматов)
-- -----------------------------------------------------------
CREATE TABLE resource_files (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    resource_id BIGINT       NOT NULL,
    format      VARCHAR(50)  NOT NULL,
    file_url    VARCHAR(500) NOT NULL,
    file_size   BIGINT       COMMENT 'размер в байтах',
    sha256_hash VARCHAR(64)  NOT NULL,
    is_primary  TINYINT(1)   DEFAULT 0,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_resource_files_resource (resource_id),
    CONSTRAINT fk_resource_files_resource FOREIGN KEY (resource_id)
        REFERENCES resources (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 11. previews — изображения/видео предпросмотра
-- -----------------------------------------------------------
CREATE TABLE previews (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    resource_id  BIGINT       NOT NULL,
    url          VARCHAR(500) NOT NULL,
    width        INT,
    height       INT,
    preview_type VARCHAR(50)  DEFAULT 'IMAGE'
                     COMMENT 'IMAGE | VIDEO | FONT_SPECIMEN',
    sort_order   INT          DEFAULT 0,
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_previews_resource (resource_id),
    CONSTRAINT fk_previews_resource FOREIGN KEY (resource_id)
        REFERENCES resources (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 12. resource_tags — связь ресурсов и тегов (M:N)
-- -----------------------------------------------------------
CREATE TABLE resource_tags (
    resource_id BIGINT NOT NULL,
    tag_id      BIGINT NOT NULL,
    PRIMARY KEY (resource_id, tag_id),
    CONSTRAINT fk_rt_resource FOREIGN KEY (resource_id)
        REFERENCES resources (id) ON DELETE CASCADE,
    CONSTRAINT fk_rt_tag FOREIGN KEY (tag_id)
        REFERENCES tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 13. cart — корзина покупателя
-- -----------------------------------------------------------
CREATE TABLE cart (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    user_id     BIGINT   NOT NULL,
    resource_id BIGINT   NOT NULL,
    added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cart_user_resource (user_id, resource_id),
    INDEX idx_cart_user (user_id),
    CONSTRAINT fk_cart_user     FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_resource FOREIGN KEY (resource_id)
        REFERENCES resources (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 14. favorites — избранное
-- -----------------------------------------------------------
CREATE TABLE favorites (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    user_id     BIGINT   NOT NULL,
    resource_id BIGINT   NOT NULL,
    added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_favorites_user_resource (user_id, resource_id),
    INDEX idx_favorites_user (user_id),
    CONSTRAINT fk_favorites_user     FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_resource FOREIGN KEY (resource_id)
        REFERENCES resources (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 15. orders — заказы
-- -----------------------------------------------------------
CREATE TABLE orders (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    user_id      BIGINT        NOT NULL,
    order_date   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status       VARCHAR(50)   NOT NULL DEFAULT 'PENDING'
                     COMMENT 'PENDING | PAID | CANCELLED | REFUNDED',
    paid_at      DATETIME,
    PRIMARY KEY (id),
    INDEX idx_orders_user   (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_date   (order_date),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 16. order_items — позиции заказа
-- -----------------------------------------------------------
CREATE TABLE order_items (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    order_id     BIGINT        NOT NULL,
    resource_id  BIGINT        NOT NULL,
    price        DECIMAL(10,2) NOT NULL COMMENT 'цена на момент покупки',
    license_type VARCHAR(50)   NOT NULL DEFAULT 'PERSONAL'
                     COMMENT 'PERSONAL | COMMERCIAL',
    PRIMARY KEY (id),
    INDEX idx_order_items_order (order_id),
    CONSTRAINT fk_order_items_order    FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_resource FOREIGN KEY (resource_id)
        REFERENCES resources (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 17. payments — платежи
-- -----------------------------------------------------------
CREATE TABLE payments (
    id                   BIGINT        NOT NULL AUTO_INCREMENT,
    order_id             BIGINT        NOT NULL,
    provider             VARCHAR(50)   NOT NULL DEFAULT 'ROBOKASSA',
    status               VARCHAR(50)   NOT NULL DEFAULT 'PENDING'
                             COMMENT 'PENDING | SUCCESS | FAILED | REFUNDED',
    amount               DECIMAL(10,2) NOT NULL,
    transaction_id       VARCHAR(255),
    robokassa_invoice_id VARCHAR(255),
    payment_date         DATETIME,
    created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payments_order (order_id),
    INDEX idx_payments_status      (status),
    INDEX idx_payments_transaction (transaction_id),
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 18. license_keys — лицензионные ключи (UUID при каждой покупке)
-- -----------------------------------------------------------
CREATE TABLE license_keys (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    unique_key  VARCHAR(36) NOT NULL COMMENT 'UUID v4',
    user_id     BIGINT      NOT NULL,
    resource_id BIGINT      NOT NULL,
    order_id    BIGINT      NOT NULL,
    license_id  BIGINT      NOT NULL,
    issued_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME,
    status      VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
                    COMMENT 'ACTIVE | REVOKED',
    PRIMARY KEY (id),
    UNIQUE KEY uq_license_keys_key (unique_key),
    INDEX idx_license_keys_user     (user_id),
    INDEX idx_license_keys_resource (resource_id),
    CONSTRAINT fk_lk_user     FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_lk_resource FOREIGN KEY (resource_id)
        REFERENCES resources (id) ON DELETE RESTRICT,
    CONSTRAINT fk_lk_order    FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE RESTRICT,
    CONSTRAINT fk_lk_license  FOREIGN KEY (license_id)
        REFERENCES licenses (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 19. downloads — журнал скачиваний
-- -----------------------------------------------------------
CREATE TABLE downloads (
    id               BIGINT      NOT NULL AUTO_INCREMENT,
    user_id          BIGINT      NOT NULL,
    resource_file_id BIGINT      NOT NULL,
    license_key_id   BIGINT      NOT NULL,
    ip_address       VARCHAR(45),
    watermark_hash   VARCHAR(64) COMMENT 'хеш маркировки файла',
    downloaded_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_downloads_user (user_id),
    INDEX idx_downloads_file (resource_file_id),
    CONSTRAINT fk_downloads_user    FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_downloads_file    FOREIGN KEY (resource_file_id)
        REFERENCES resource_files (id) ON DELETE RESTRICT,
    CONSTRAINT fk_downloads_license FOREIGN KEY (license_key_id)
        REFERENCES license_keys (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 20. reviews — отзывы покупателей
-- -----------------------------------------------------------
CREATE TABLE reviews (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    user_id     BIGINT   NOT NULL,
    resource_id BIGINT   NOT NULL,
    rating      INT      NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME          DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_reviews_user_resource (user_id, resource_id),
    INDEX idx_reviews_resource (resource_id),
    CONSTRAINT fk_reviews_user     FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_resource FOREIGN KEY (resource_id)
        REFERENCES resources (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 21. moderations — история модерации ресурсов
-- -----------------------------------------------------------
CREATE TABLE moderations (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    resource_id BIGINT      NOT NULL,
    admin_id    BIGINT      NOT NULL,
    comment     TEXT,
    status      VARCHAR(50) NOT NULL COMMENT 'PENDING | APPROVED | REJECTED',
    reviewed_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_moderations_resource (resource_id),
    INDEX idx_moderations_status   (status),
    CONSTRAINT fk_moderations_resource FOREIGN KEY (resource_id)
        REFERENCES resources (id) ON DELETE CASCADE,
    CONSTRAINT fk_moderations_admin    FOREIGN KEY (admin_id)
        REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 22. complaints — жалобы DMCA
-- -----------------------------------------------------------
CREATE TABLE complaints (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    user_id      BIGINT       NOT NULL,
    resource_id  BIGINT       NOT NULL,
    reason       VARCHAR(255) NOT NULL,
    comment      TEXT,
    status       VARCHAR(50)  NOT NULL DEFAULT 'PENDING'
                     COMMENT 'PENDING | APPROVED | REJECTED',
    resolution   TEXT,
    submitted_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at  DATETIME,
    PRIMARY KEY (id),
    INDEX idx_complaints_status   (status),
    INDEX idx_complaints_resource (resource_id),
    CONSTRAINT fk_complaints_user     FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_complaints_resource FOREIGN KEY (resource_id)
        REFERENCES resources (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 23. notifications — уведомления пользователей
-- -----------------------------------------------------------
CREATE TABLE notifications (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    type        VARCHAR(100) NOT NULL
                    COMMENT 'PURCHASE | MOD_APPROVED | MOD_REJECTED | NEW_REVIEW | WITHDRAWAL | NEW_COMPLAINT',
    title       VARCHAR(255) NOT NULL,
    message     TEXT,
    is_read     TINYINT(1)   NOT NULL DEFAULT 0,
    target_type VARCHAR(50)  COMMENT 'RESOURCE | ORDER | WITHDRAWAL',
    target_id   BIGINT,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_notifications_user     (user_id),
    INDEX idx_notifications_unread   (user_id, is_read),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 24. admin_action_logs — журнал действий администраторов
-- -----------------------------------------------------------
CREATE TABLE admin_action_logs (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    admin_id    BIGINT       NOT NULL,
    action      VARCHAR(255) NOT NULL,
    target_type VARCHAR(100),
    target_id   BIGINT,
    details     TEXT,
    ip_address  VARCHAR(45),
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_admin_logs_admin   (admin_id),
    INDEX idx_admin_logs_created (created_at),
    CONSTRAINT fk_admin_logs_admin FOREIGN KEY (admin_id)
        REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 25. withdrawals — запросы на вывод средств авторами
-- -----------------------------------------------------------
CREATE TABLE withdrawals (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    author_id      BIGINT        NOT NULL,
    amount         DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status         VARCHAR(50)   NOT NULL DEFAULT 'PENDING'
                       COMMENT 'PENDING | APPROVED | REJECTED | PROCESSED',
    payment_method VARCHAR(100),
    payment_details TEXT,
    admin_comment  TEXT,
    requested_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at   DATETIME,
    PRIMARY KEY (id),
    INDEX idx_withdrawals_author (author_id),
    INDEX idx_withdrawals_status (status),
    CONSTRAINT fk_withdrawals_author FOREIGN KEY (author_id)
        REFERENCES authors (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- TRIGGERS
-- =============================================================

DELIMITER $$

-- Пересчёт среднего рейтинга ресурса при добавлении отзыва
CREATE TRIGGER trg_review_insert
AFTER INSERT ON reviews FOR EACH ROW
BEGIN
    UPDATE resources
    SET avg_rating = (SELECT AVG(rating) FROM reviews WHERE resource_id = NEW.resource_id)
    WHERE id = NEW.resource_id;
END$$

-- Пересчёт среднего рейтинга при обновлении отзыва
CREATE TRIGGER trg_review_update
AFTER UPDATE ON reviews FOR EACH ROW
BEGIN
    UPDATE resources
    SET avg_rating = (SELECT AVG(rating) FROM reviews WHERE resource_id = NEW.resource_id)
    WHERE id = NEW.resource_id;
END$$

-- Пересчёт среднего рейтинга при удалении отзыва
CREATE TRIGGER trg_review_delete
AFTER DELETE ON reviews FOR EACH ROW
BEGIN
    UPDATE resources
    SET avg_rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE resource_id = OLD.resource_id), 0)
    WHERE id = OLD.resource_id;
END$$

-- При успешном платеже: начисляем баланс авторам (70%), увеличиваем счётчики продаж
CREATE TRIGGER trg_payment_success
AFTER UPDATE ON payments FOR EACH ROW
BEGIN
    IF NEW.status = 'SUCCESS' AND OLD.status <> 'SUCCESS' THEN
        -- Обновляем заказ
        UPDATE orders SET status = 'PAID', paid_at = NOW() WHERE id = NEW.order_id;
        -- Начисляем баланс автору (комиссия платформы 30%)
        UPDATE authors a
        INNER JOIN resources r    ON r.author_id = a.id
        INNER JOIN order_items oi ON oi.resource_id = r.id
        SET a.balance        = a.balance        + (oi.price * 0.70),
            a.total_earnings = a.total_earnings + (oi.price * 0.70),
            a.sales_count    = a.sales_count    + 1
        WHERE oi.order_id = NEW.order_id;
        -- Увеличиваем счётчик загрузок ресурса
        UPDATE resources r
        INNER JOIN order_items oi ON oi.resource_id = r.id
        SET r.download_count = r.download_count + 1
        WHERE oi.order_id = NEW.order_id;
    END IF;
END$$

DELIMITER ;

-- =============================================================
-- SEED DATA — начальные данные
-- =============================================================

INSERT INTO types (name, slug) VALUES
    ('Шрифты',       'fonts'),
    ('Иконки',       'icons'),
    ('Иллюстрации',  'illustrations'),
    ('Шаблоны',      'templates');

INSERT INTO licenses (name, type, terms) VALUES
    ('Персональная лицензия', 'PERSONAL',
     'Разрешено использование только в некоммерческих личных проектах. Запрещено коммерческое использование, перепродажа и передача третьим лицам. Соответствует главе 70 ГК РФ «Авторское право».'),
    ('Коммерческая лицензия', 'COMMERCIAL',
     'Разрешено использование в коммерческих проектах любого масштаба. Запрещена перепродажа ресурса как самостоятельного продукта и передача третьим лицам. Соответствует главе 70 ГК РФ «Авторское право».');

INSERT INTO categories (name, slug, type_id) VALUES
    ('Засечки',                  'serif',                    1),
    ('Без засечек',              'sans-serif',               1),
    ('Рукописные',               'handwritten',              1),
    ('Декоративные',             'decorative',               1),
    ('Монопространственные',     'monospace',                1),
    ('Иконки интерфейса',        'ui-icons',                 2),
    ('Иконки соцсетей',          'social-icons',             2),
    ('Персонажи',                'character-illustrations',  3),
    ('Абстрактные',              'abstract-illustrations',   3),
    ('Веб-шаблоны',              'web-templates',            4),
    ('Презентации',              'presentation-templates',   4);

INSERT INTO tags (name, slug, category) VALUES
    ('минимализм',    'minimalism',    'стиль'),
    ('гротеск',       'grotesque',     'стиль'),
    ('кириллица',     'cyrillic',      'язык'),
    ('латиница',      'latin',         'язык'),
    ('жирный',        'bold',          'начертание'),
    ('курсив',        'italic',        'начертание'),
    ('лёгкий',        'light',         'начертание'),
    ('геометрический','geometric',     'стиль'),
    ('ретро',         'retro',         'стиль'),
    ('современный',   'modern',        'стиль');

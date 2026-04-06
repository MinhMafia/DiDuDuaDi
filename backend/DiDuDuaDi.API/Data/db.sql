-- DiDuDuaDi / Vinh Khanh Food Street
-- MySQL 8.0+ schema
-- Recommended server: MySQL on localhost:3306

CREATE DATABASE IF NOT EXISTS didududi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE didududi;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
    id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS accounts (
    id CHAR(36) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NULL,
    phone VARCHAR(20) NULL,
    role_id TINYINT UNSIGNED NOT NULL,
    avatar_url VARCHAR(500) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_accounts_username (username),
    UNIQUE KEY uq_accounts_email (email),
    KEY idx_accounts_role_id (role_id),
    CONSTRAINT fk_accounts_role_id
        FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shops (
    id CHAR(36) NOT NULL,
    owner_account_id CHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    description TEXT NULL,
    approved_intro TEXT NULL,
    pending_intro TEXT NULL,
    intro_review_status ENUM('approved', 'pending', 'rejected') NOT NULL DEFAULT 'approved',
    address_line VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    opening_hours VARCHAR(120) NULL,
    phone VARCHAR(20) NULL,
    image_url VARCHAR(500) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_shops_slug (slug),
    KEY idx_shops_owner_account_id (owner_account_id),
    KEY idx_shops_lat_lng (latitude, longitude),
    CONSTRAINT fk_shops_owner_account_id
        FOREIGN KEY (owner_account_id) REFERENCES accounts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    shop_id CHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500) NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500) NULL,
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_menu_items_shop_id (shop_id),
    KEY idx_menu_items_shop_id_available (shop_id, is_available),
    CONSTRAINT fk_menu_items_shop_id
        FOREIGN KEY (shop_id) REFERENCES shops (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pois (
    id CHAR(36) NOT NULL,
    shop_id CHAR(36) NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'food',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    trigger_radius_meters INT NOT NULL DEFAULT 35,
    hero_image_url VARCHAR(500) NULL,
    default_language_code VARCHAR(10) NOT NULL DEFAULT 'vi',
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_pois_shop_id (shop_id),
    KEY idx_pois_category (category),
    KEY idx_pois_active (is_active),
    KEY idx_pois_lat_lng (latitude, longitude),
    CONSTRAINT fk_pois_shop_id
        FOREIGN KEY (shop_id) REFERENCES shops (id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS poi_translations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    poi_id CHAR(36) NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    name VARCHAR(200) NOT NULL,
    short_description VARCHAR(300) NULL,
    description TEXT NULL,
    audio_url VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_poi_translations_poi_lang (poi_id, language_code),
    KEY idx_poi_translations_language_code (language_code),
    CONSTRAINT fk_poi_translations_poi_id
        FOREIGN KEY (poi_id) REFERENCES pois (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tours (
    id CHAR(36) NOT NULL,
    created_by_account_id CHAR(36) NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    estimated_duration_minutes INT NOT NULL DEFAULT 0,
    cover_image_url VARCHAR(500) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tours_code (code),
    KEY idx_tours_created_by_account_id (created_by_account_id),
    CONSTRAINT fk_tours_created_by_account_id
        FOREIGN KEY (created_by_account_id) REFERENCES accounts (id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tour_pois (
    tour_id CHAR(36) NOT NULL,
    poi_id CHAR(36) NOT NULL,
    sort_order INT NOT NULL,
    stop_minutes INT NOT NULL DEFAULT 0,
    PRIMARY KEY (tour_id, poi_id),
    UNIQUE KEY uq_tour_pois_tour_sort (tour_id, sort_order),
    CONSTRAINT fk_tour_pois_tour_id
        FOREIGN KEY (tour_id) REFERENCES tours (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tour_pois_poi_id
        FOREIGN KEY (poi_id) REFERENCES pois (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_favorites (
    account_id CHAR(36) NOT NULL,
    poi_id CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (account_id, poi_id),
    CONSTRAINT fk_user_favorites_account_id
        FOREIGN KEY (account_id) REFERENCES accounts (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_favorites_poi_id
        FOREIGN KEY (poi_id) REFERENCES pois (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cash_claim_codes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    shop_id CHAR(36) NOT NULL,
    code VARCHAR(12) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status ENUM('issued', 'claimed', 'expired', 'cancelled') NOT NULL DEFAULT 'issued',
    note VARCHAR(255) NULL,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claimed_at DATETIME NULL,
    expires_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cash_claim_codes_code (code),
    KEY idx_cash_claim_codes_shop_id (shop_id),
    CONSTRAINT fk_cash_claim_codes_shop_id
        FOREIGN KEY (shop_id) REFERENCES shops (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shop_visit_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    shop_id CHAR(36) NOT NULL,
    poi_id CHAR(36) NOT NULL,
    language_code VARCHAR(10) NOT NULL DEFAULT 'vi',
    source VARCHAR(50) NOT NULL DEFAULT 'map',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_shop_visit_events_shop_id_created_at (shop_id, created_at),
    CONSTRAINT fk_shop_visit_events_shop_id
        FOREIGN KEY (shop_id) REFERENCES shops (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_shop_visit_events_poi_id
        FOREIGN KEY (poi_id) REFERENCES pois (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audio_play_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    shop_id CHAR(36) NOT NULL,
    poi_id CHAR(36) NOT NULL,
    language_code VARCHAR(10) NOT NULL DEFAULT 'vi',
    source VARCHAR(50) NOT NULL DEFAULT 'tts',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audio_play_events_shop_id_created_at (shop_id, created_at),
    CONSTRAINT fk_audio_play_events_shop_id
        FOREIGN KEY (shop_id) REFERENCES shops (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_audio_play_events_poi_id
        FOREIGN KEY (poi_id) REFERENCES pois (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_sessions (
    id CHAR(36) NOT NULL,
    account_id CHAR(36) NULL,
    language_code VARCHAR(10) NOT NULL DEFAULT 'vi',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_chat_sessions_account_id (account_id),
    CONSTRAINT fk_chat_sessions_account_id
        FOREIGN KEY (account_id) REFERENCES accounts (id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id CHAR(36) NOT NULL,
    sender_role ENUM('user', 'assistant', 'system') NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_chat_messages_session_id_created_at (session_id, created_at),
    CONSTRAINT fk_chat_messages_session_id
        FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (id, code, display_name)
VALUES
    (1, 'admin', 'Administrator'),
    (2, 'owner', 'Shop Owner'),
    (3, 'user', 'Tourist User')
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name);

INSERT INTO accounts (
    id,
    username,
    password_hash,
    display_name,
    role_id,
    is_active
)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin', '123456', 'Demo Admin', 1, 1),
    ('22222222-2222-2222-2222-222222222222', 'owner', '123456', 'Demo Shop Owner', 2, 1),
    ('66666666-6666-6666-6666-666666666666', 'owner_demo', '123456', 'Chu quan Demo Vinh Khanh', 2, 1),
    ('33333333-3333-3333-3333-333333333333', 'user', '123456', 'Demo Tourist User', 3, 1)
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    role_id = VALUES(role_id),
    is_active = VALUES(is_active);

INSERT INTO shops (
    id,
    owner_account_id,
    name,
    slug,
    description,
    approved_intro,
    pending_intro,
    intro_review_status,
    address_line,
    latitude,
    longitude,
    opening_hours,
    phone,
    image_url,
    is_active
)
VALUES
    (
        '44444444-4444-4444-4444-444444444441',
        '22222222-2222-2222-2222-222222222222',
        'Oc Co Thu Vinh Khanh',
        'oc-co-thu-vinh-khanh',
        'Quan oc demo nam tren pho am thuc Vinh Khanh.',
        'Quan oc Co Thu co phong cach binh dan, mon oc tuoi va khong khi nhon nhip phu hop de demo audio guide cho du khach.',
        NULL,
        'approved',
        'Duong Vinh Khanh, Phuong 8, Quan 4, TP. Ho Chi Minh',
        10.75855600,
        106.70328400,
        '16:00 - 23:30',
        '0909000111',
        'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80',
        1
    ),
    (
        '44444444-4444-4444-4444-444444444442',
        '22222222-2222-2222-2222-222222222222',
        'Banh Trang Nuong Co Hai',
        'banh-trang-nuong-co-hai',
        'Quan an vat demo phuc vu du khach tai Vinh Khanh.',
        'Banh Trang Nuong Co Hai la diem dung chan an vat nho, de tiep can va phu hop de demo menu, claim code va thong ke luot ghe.',
        NULL,
        'approved',
        'Duong Vinh Khanh, Phuong 8, Quan 4, TP. Ho Chi Minh',
        10.75899500,
        106.70362100,
        '15:00 - 22:30',
        '0909000222',
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
        1
    ),
    (
        '77777777-7777-7777-7777-777777777777',
        '66666666-6666-6666-6666-666666666666',
        'Bo La Lot Chi Ba Demo',
        'bo-la-lot-chi-ba-demo',
        'Quan demo danh rieng cho luong chu quan, co the sua menu, claim code va thong tin map.',
        'Bo La Lot Chi Ba Demo la dia diem mau de kiem thu day du luong quan ly chu quan tren ban do.',
        NULL,
        'approved',
        '129 Vinh Khanh, Phuong 8, Quan 4, TP. Ho Chi Minh',
        10.75878000,
        106.70351000,
        '16:30 - 23:30',
        '0909000123',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
        1
    )
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    approved_intro = VALUES(approved_intro),
    pending_intro = VALUES(pending_intro),
    intro_review_status = VALUES(intro_review_status),
    opening_hours = VALUES(opening_hours),
    is_active = VALUES(is_active);

INSERT INTO menu_items (
    shop_id,
    name,
    description,
    price,
    image_url,
    is_available,
    display_order
)
VALUES
    (
        '44444444-4444-4444-4444-444444444441',
        'Oc huong xao toi',
        'Oc huong xao toi thom, vi dam va de an khi di nhom.',
        89000,
        'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80',
        1,
        1
    ),
    (
        '44444444-4444-4444-4444-444444444441',
        'Sot trung muoi',
        'Dia hai san sot trung muoi dam vi, de gioi thieu mon dac trung cua quan.',
        99000,
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
        1,
        2
    ),
    (
        '44444444-4444-4444-4444-444444444442',
        'Banh trang nuong trung pho mai',
        'Phien ban an vat gion, beo va de thu cho du khach.',
        35000,
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
        1,
        1
    ),
    (
        '44444444-4444-4444-4444-444444444442',
        'Tra tac mat ong',
        'Do uong giai khat di kem mon nuong.',
        18000,
        'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=900&q=80',
        1,
        2
    ),
    (
        '77777777-7777-7777-7777-777777777777',
        'Bo la lot phan dac biet',
        'Phan bo la lot an kem rau song va nuoc cham nha lam.',
        69000,
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
        1,
        1
    ),
    (
        '77777777-7777-7777-7777-777777777777',
        'Cha dum nuong',
        'Mon nuong them de chu quan thu tinh nang cap nhat menu.',
        49000,
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
        1,
        2
    );

INSERT INTO pois (
    id,
    shop_id,
    category,
    latitude,
    longitude,
    trigger_radius_meters,
    default_language_code,
    is_featured,
    is_active
)
VALUES
    (
        '55555555-5555-5555-5555-555555555551',
        '44444444-4444-4444-4444-444444444441',
        'seafood',
        10.75855600,
        106.70328400,
        35,
        'vi',
        1,
        1
    ),
    (
        '55555555-5555-5555-5555-555555555552',
        '44444444-4444-4444-4444-444444444442',
        'street_food',
        10.75899500,
        106.70362100,
        35,
        'vi',
        1,
        1
    ),
    (
        '55555555-5555-5555-5555-555555555553',
        NULL,
        'dessert',
        10.75830300,
        106.70293500,
        35,
        'vi',
        0,
        1
    ),
    (
        '55555555-5555-5555-5555-555555555554',
        NULL,
        'snack',
        10.75921100,
        106.70398200,
        35,
        'vi',
        0,
        1
    ),
    (
        '88888888-8888-8888-8888-888888888888',
        '77777777-7777-7777-7777-777777777777',
        'grilled_food',
        10.75878000,
        106.70351000,
        35,
        'vi',
        1,
        1
    )
ON DUPLICATE KEY UPDATE
    category = VALUES(category),
    latitude = VALUES(latitude),
    longitude = VALUES(longitude),
    trigger_radius_meters = VALUES(trigger_radius_meters),
    is_featured = VALUES(is_featured),
    is_active = VALUES(is_active);

INSERT INTO poi_translations (
    poi_id,
    language_code,
    name,
    short_description,
    description,
    audio_url
)
VALUES
    (
        '55555555-5555-5555-5555-555555555551',
        'vi',
        'Oc Co Thu Vinh Khanh',
        'Quan oc dong khach ve dem.',
        'Quan oc Co Thu la diem dung chan demo noi bat tai pho am thuc Vinh Khanh, phu hop de gioi thieu GPS, da ngon ngu va voice guide.',
        NULL
    ),
    (
        '55555555-5555-5555-5555-555555555551',
        'en',
        'Oc Co Thu Vinh Khanh',
        'A busy late-night seafood stop.',
        'Oc Co Thu is a demo seafood point of interest on Vinh Khanh Food Street, suitable for map, multilingual content, and voice-guide features.',
        NULL
    ),
    (
        '55555555-5555-5555-5555-555555555552',
        'vi',
        'Banh Trang Nuong Co Hai',
        'Mon an vat de thu khi dao pho.',
        'Banh Trang Nuong Co Hai la diem an vat demo gan trung tam tuyen pho, thuong duoc dung de test tim POI gan day.',
        NULL
    ),
    (
        '55555555-5555-5555-5555-555555555552',
        'en',
        'Banh Trang Nuong Co Hai',
        'A quick street snack stop.',
        'This demo street-food POI is useful for testing nearby search, map markers, and multilingual narration in the tourist app.',
        NULL
    ),
    (
        '55555555-5555-5555-5555-555555555553',
        'vi',
        'Che Nha Lam Vinh Khanh',
        'Quan che demo cho diem dung trang mieng.',
        'Quan che demo phuc vu cho tinh nang goi y lo trinh an toi va am thanh tu dong khi den gan.',
        NULL
    ),
    (
        '55555555-5555-5555-5555-555555555553',
        'en',
        'Che Nha Lam Vinh Khanh',
        'A dessert stop for the route demo.',
        'This dessert POI supports map browsing, route recommendations, and multilingual audio descriptions in the tourist experience.',
        NULL
    ),
    (
        '55555555-5555-5555-5555-555555555554',
        'vi',
        'Bo La Lot Co Van',
        'Mon nuong demo tren tuyen pho am thuc.',
        'Bo la lot Co Van la diem demo phu hop de test marker, popup, va voice guide khi nguoi dung cham vao ban do.',
        NULL
    ),
    (
        '55555555-5555-5555-5555-555555555554',
        'en',
        'Bo La Lot Co Van',
        'A grilled snack stop on the street.',
        'This POI is included to demonstrate marker selection, popup details, and spoken descriptions on the map.',
        NULL
    ),
    (
        '88888888-8888-8888-8888-888888888888',
        'vi',
        'Bo La Lot Chi Ba Demo',
        'Quan demo cho chu quan.',
        'Day la POI mau gan voi tai khoan owner_demo, giup ban thu cap nhat vi tri, menu, mo ta va thong ke ngay tren ban do.',
        NULL
    ),
    (
        '88888888-8888-8888-8888-888888888888',
        'en',
        'Chi Ba Grilled Beef Demo',
        'A demo place for the owner flow.',
        'This POI is linked to the owner_demo account so you can test menu editing, map updates, and owner management immediately.',
        NULL
    )
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    short_description = VALUES(short_description),
    description = VALUES(description),
    audio_url = VALUES(audio_url);

INSERT INTO cash_claim_codes (
    shop_id,
    code,
    amount,
    status,
    note,
    issued_at,
    expires_at
)
VALUES
    (
        '44444444-4444-4444-4444-444444444441',
        'VK2301',
        178000,
        'issued',
        'Ban 4, thanh toan tien mat',
        DATE_SUB(NOW(), INTERVAL 30 MINUTE),
        DATE_ADD(NOW(), INTERVAL 1 DAY)
    ),
    (
        '44444444-4444-4444-4444-444444444442',
        'VK2302',
        53000,
        'claimed',
        'Khach le buoi toi',
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        DATE_ADD(NOW(), INTERVAL 1 DAY)
    );

INSERT INTO shop_visit_events (
    shop_id,
    poi_id,
    language_code,
    source,
    created_at
)
VALUES
    ('44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555551', 'vi', 'map', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
    ('44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555551', 'en', 'map', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    ('44444444-4444-4444-4444-444444444442', '55555555-5555-5555-5555-555555555552', 'vi', 'map', DATE_SUB(NOW(), INTERVAL 90 MINUTE));

INSERT INTO audio_play_events (
    shop_id,
    poi_id,
    language_code,
    source,
    created_at
)
VALUES
    ('44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555551', 'vi', 'tts', DATE_SUB(NOW(), INTERVAL 70 MINUTE)),
    ('44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555551', 'en', 'tts', DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
    ('44444444-4444-4444-4444-444444444442', '55555555-5555-5555-5555-555555555552', 'vi', 'tts', DATE_SUB(NOW(), INTERVAL 20 MINUTE));

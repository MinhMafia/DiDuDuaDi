using Dapper;

namespace DiDuDuaDi.API.Data;

public class MySqlDatabaseInitializer(
    IDbConnectionFactory connectionFactory,
    ILogger<MySqlDatabaseInitializer> logger) : IDatabaseInitializer
{
    public void EnsureSchema()
    {
        using var connection = connectionFactory.CreateConnection();
        var databaseName = connection.ExecuteScalar<string>("SELECT DATABASE();");

        if (string.IsNullOrWhiteSpace(databaseName))
        {
            throw new InvalidOperationException("No database selected for MySQL connection.");
        }

        EnsureShopOwnerColumns(connection, databaseName);
        EnsureMenuItemsTable(connection, databaseName);
        EnsureToursTables(connection, databaseName);
        EnsureCashClaimCodesTable(connection, databaseName);
        EnsureShopVisitEventsTable(connection, databaseName);
        EnsureAudioPlayEventsTable(connection, databaseName);
        EnsureOwnerUpgradeRequestsTable(connection, databaseName);
        EnsureOwnerUpgradeLocationColumns(connection, databaseName);
        EnsureOwnerReviewColumns(connection, databaseName);
        EnsureOwnerUpgradePaymentColumns(connection, databaseName);
        EnsureOwnerDemoSeed(connection);
        EnsureAdminDemoSeed(connection);
        RefreshTouristDemoSeed(connection);
        EnsureAdditionalTouristPois(connection);
        EnsureDemoTours(connection);
    }

    private void EnsureAdminDemoSeed(System.Data.IDbConnection connection)
    {
        const string adminUsername = "admin";
        var adminExists = connection.ExecuteScalar<int>(
            "SELECT COUNT(*) FROM accounts WHERE username = @adminUsername;",
            new { adminUsername }) > 0;

        if (!adminExists)
        {
            logger.LogInformation("Creating demo admin account {Username}", adminUsername);
            var adminRoleId = connection.ExecuteScalar<int>(
                "SELECT id FROM roles WHERE code = 'admin' LIMIT 1;");

            connection.Execute(
                """
                INSERT INTO accounts (
                    id,
                    username,
                    password_hash,
                    display_name,
                    email,
                    role_id,
                    is_active
                )
                VALUES (
                    @Id,
                    @Username,
                    @PasswordHash,
                    @DisplayName,
                    @Email,
                    @RoleId,
                    1
                );
                """,
                new
                {
                    Id = "11111111-1111-1111-1111-111111111111",
                    Username = adminUsername,
                    PasswordHash = "123456",
                    DisplayName = "Demo Admin",
                    Email = "admin@didududadi.local",
                    RoleId = adminRoleId
                });
        }
        else
        {
            logger.LogInformation("Resetting password for demo admin account {Username}", adminUsername);
            connection.Execute(
                "UPDATE accounts SET password_hash = '123456' WHERE username = @adminUsername;",
                new { adminUsername });
        }
    }

    private void EnsureOwnerDemoSeed(System.Data.IDbConnection connection)
    {
        const string ownerUsername = "owner_demo";
        const string ownerAccountId = "66666666-6666-6666-6666-666666666666";
        const string shopId = "77777777-7777-7777-7777-777777777777";
        const string poiId = "88888888-8888-8888-8888-888888888888";

        var ownerExists = connection.ExecuteScalar<int>(
            "SELECT COUNT(*) FROM accounts WHERE username = @ownerUsername;",
            new { ownerUsername }) > 0;

        if (!ownerExists)
        {
            logger.LogInformation("Creating demo owner account {Username}", ownerUsername);
            var ownerRoleId = connection.ExecuteScalar<int>(
                "SELECT id FROM roles WHERE code = 'owner' LIMIT 1;");

            connection.Execute(
                """
                INSERT INTO accounts (
                    id,
                    username,
                    password_hash,
                    display_name,
                    email,
                    role_id,
                    is_active
                )
                VALUES (
                    @Id,
                    @Username,
                    @PasswordHash,
                    @DisplayName,
                    @Email,
                    @RoleId,
                    1
                );
                """,
                new
                {
                    Id = ownerAccountId,
                    Username = ownerUsername,
                    PasswordHash = "123456",
                    DisplayName = "Chủ quán Demo Vĩnh Khánh",
                    Email = "owner_demo@didududadi.local",
                    RoleId = ownerRoleId
                });
        }

        var shopExists = connection.ExecuteScalar<int>(
            "SELECT COUNT(*) FROM shops WHERE id = @shopId;",
            new { shopId }) > 0;

        if (!shopExists)
        {
            logger.LogInformation("Creating demo owner shop");
            connection.Execute(
                """
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
                VALUES (
                    @Id,
                    @OwnerAccountId,
                    @Name,
                    @Slug,
                    @Description,
                    @ApprovedIntro,
                    NULL,
                    'approved',
                    @AddressLine,
                    @Latitude,
                    @Longitude,
                    @OpeningHours,
                    @Phone,
                    @ImageUrl,
                    1
                );
                """,
                new
                {
                    Id = shopId,
                    OwnerAccountId = ownerAccountId,
                    Name = "Bò Lá Lốt Chị Ba Demo",
                    Slug = "bo-la-lot-chi-ba-demo",
                    Description = "Quán demo dành cho luồng chủ quán, có thể chỉnh menu, claim code và thông tin giới thiệu.",
                    ApprovedIntro = "Bò Lá Lốt Chị Ba Demo là địa điểm mẫu để bạn kiểm thử đầy đủ luồng quản lý chủ quán trên bản đồ.",
                    AddressLine = "129 Vĩnh Khánh, Phường 8, Quận 4, TP. Hồ Chí Minh",
                    Latitude = 10.75878000m,
                    Longitude = 106.70351000m,
                    OpeningHours = "16:30 - 23:30",
                    Phone = "0909000123",
                    ImageUrl = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80"
                });
        }

        var poiExists = connection.ExecuteScalar<int>(
            "SELECT COUNT(*) FROM pois WHERE id = @poiId;",
            new { poiId }) > 0;

        if (!poiExists)
        {
            logger.LogInformation("Creating demo owner POI");
            connection.Execute(
                """
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
                VALUES (
                    @Id,
                    @ShopId,
                    'grilled_food',
                    @Latitude,
                    @Longitude,
                    35,
                    'vi',
                    1,
                    1
                );
                """,
                new
                {
                    Id = poiId,
                    ShopId = shopId,
                    Latitude = 10.75878000m,
                    Longitude = 106.70351000m
                });
        }

        EnsurePoiTranslation(connection, poiId, "vi", "Bò Lá Lốt Chị Ba Demo",
            "Quán bò lá lốt demo cho chủ quán.",
            "Đây là POI mẫu gắn với tài khoản owner_demo, giúp bạn thử cập nhật vị trí, menu, mô tả và thống kê ngay trên bản đồ.");
        EnsurePoiTranslation(connection, poiId, "en", "Chi Ba Grilled Beef Demo",
            "A demo grilled-beef stop for the owner flow.",
            "This POI is linked to the owner_demo account so you can test owner management, menu editing, and map updates immediately.");

        EnsureMenuItem(connection, shopId, "Bò lá lốt phần đầy đủ",
            "Suất bò lá lốt ăn kèm rau sống và nước chấm.", 69000m,
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80", 1);
        EnsureMenuItem(connection, shopId, "Chả đùm nướng",
            "Món ăn kèm dành cho khách muốn thử thêm đặc sản nướng.", 49000m,
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80", 2);
    }

    private static void EnsurePoiTranslation(
        System.Data.IDbConnection connection,
        string poiId,
        string languageCode,
        string name,
        string shortDescription,
        string description)
    {
        var exists = connection.ExecuteScalar<int>(
            """
            SELECT COUNT(*)
            FROM poi_translations
            WHERE poi_id = @poiId
              AND language_code = @languageCode;
            """,
            new { poiId, languageCode }) > 0;

        if (exists)
        {
            return;
        }

        connection.Execute(
            """
            INSERT INTO poi_translations (
                poi_id,
                language_code,
                name,
                short_description,
                description,
                audio_url
            )
            VALUES (
                @PoiId,
                @LanguageCode,
                @Name,
                @ShortDescription,
                @Description,
                NULL
            );
            """,
            new
            {
                PoiId = poiId,
                LanguageCode = languageCode,
                Name = name,
                ShortDescription = shortDescription,
                Description = description
            });
    }

    private static void EnsureMenuItem(
        System.Data.IDbConnection connection,
        string shopId,
        string name,
        string description,
        decimal price,
        string imageUrl,
        int displayOrder)
    {
        var exists = connection.ExecuteScalar<int>(
            """
            SELECT COUNT(*)
            FROM menu_items
            WHERE shop_id = @shopId
              AND name = @name;
            """,
            new { shopId, name }) > 0;

        if (exists)
        {
            return;
        }

        connection.Execute(
            """
            INSERT INTO menu_items (
                shop_id,
                name,
                description,
                price,
                image_url,
                is_available,
                display_order
            )
            VALUES (
                @ShopId,
                @Name,
                @Description,
                @Price,
                @ImageUrl,
                1,
                @DisplayOrder
            );
            """,
            new
            {
                ShopId = shopId,
                Name = name,
                Description = description,
                Price = price,
                ImageUrl = imageUrl,
                DisplayOrder = displayOrder
            });
    }

    private void EnsureShopOwnerColumns(System.Data.IDbConnection connection, string databaseName)
    {
        EnsureColumn(
            connection,
            databaseName,
            "shops",
            "approved_intro",
            "ALTER TABLE shops ADD COLUMN approved_intro TEXT NULL AFTER description;");

        EnsureColumn(
            connection,
            databaseName,
            "shops",
            "pending_intro",
            "ALTER TABLE shops ADD COLUMN pending_intro TEXT NULL AFTER approved_intro;");

        EnsureColumn(
            connection,
            databaseName,
            "shops",
            "intro_review_status",
            """
            ALTER TABLE shops
            ADD COLUMN intro_review_status ENUM('approved', 'pending', 'rejected')
            NOT NULL DEFAULT 'approved' AFTER pending_intro;
            """);

        EnsureColumn(
            connection,
            databaseName,
            "shops",
            "intro_review_note",
            "ALTER TABLE shops ADD COLUMN intro_review_note VARCHAR(500) NULL AFTER intro_review_status;");
    }

    private void EnsureOwnerReviewColumns(System.Data.IDbConnection connection, string databaseName)
    {
        EnsureColumn(
            connection,
            databaseName,
            "owner_upgrade_requests",
            "review_note",
            "ALTER TABLE owner_upgrade_requests ADD COLUMN review_note VARCHAR(500) NULL AFTER reviewed_at;");
    }

    private void EnsureOwnerUpgradeLocationColumns(System.Data.IDbConnection connection, string databaseName)
    {
        if (!TableExists(connection, databaseName, "owner_upgrade_requests"))
        {
            return;
        }

        EnsureColumn(
            connection,
            databaseName,
            "owner_upgrade_requests",
            "latitude",
            "ALTER TABLE owner_upgrade_requests ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER address_line;");

        EnsureColumn(
            connection,
            databaseName,
            "owner_upgrade_requests",
            "longitude",
            "ALTER TABLE owner_upgrade_requests ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude;");
    }

    private void EnsureOwnerUpgradePaymentColumns(System.Data.IDbConnection connection, string databaseName)
    {
        if (!TableExists(connection, databaseName, "owner_upgrade_requests"))
        {
            return;
        }

        connection.Execute(
            """
            ALTER TABLE owner_upgrade_requests
            MODIFY COLUMN status ENUM('pending', 'payment_pending', 'approved', 'rejected')
            NOT NULL DEFAULT 'pending';
            """);

        EnsureColumn(
            connection,
            databaseName,
            "owner_upgrade_requests",
            "upgrade_fee_amount",
            "ALTER TABLE owner_upgrade_requests ADD COLUMN upgrade_fee_amount DECIMAL(10, 2) NULL AFTER review_note;");

        EnsureColumn(
            connection,
            databaseName,
            "owner_upgrade_requests",
            "payment_reference_code",
            "ALTER TABLE owner_upgrade_requests ADD COLUMN payment_reference_code VARCHAR(50) NULL AFTER upgrade_fee_amount;");

        EnsureColumn(
            connection,
            databaseName,
            "owner_upgrade_requests",
            "payment_qr_content",
            "ALTER TABLE owner_upgrade_requests ADD COLUMN payment_qr_content TEXT NULL AFTER payment_reference_code;");

        EnsureColumn(
            connection,
            databaseName,
            "owner_upgrade_requests",
            "payment_qr_image_url",
            "ALTER TABLE owner_upgrade_requests ADD COLUMN payment_qr_image_url VARCHAR(500) NULL AFTER payment_qr_content;");

        EnsureColumn(
            connection,
            databaseName,
            "owner_upgrade_requests",
            "payment_requested_at",
            "ALTER TABLE owner_upgrade_requests ADD COLUMN payment_requested_at DATETIME NULL AFTER payment_qr_image_url;");

        EnsureColumn(
            connection,
            databaseName,
            "owner_upgrade_requests",
            "payment_confirmed_at",
            "ALTER TABLE owner_upgrade_requests ADD COLUMN payment_confirmed_at DATETIME NULL AFTER payment_requested_at;");

        EnsureColumn(
            connection,
            databaseName,
            "owner_upgrade_requests",
            "activated_at",
            "ALTER TABLE owner_upgrade_requests ADD COLUMN activated_at DATETIME NULL AFTER payment_confirmed_at;");
    }

    private void EnsureMenuItemsTable(System.Data.IDbConnection connection, string databaseName)
    {
        if (TableExists(connection, databaseName, "menu_items"))
        {
            return;
        }

        logger.LogInformation("Creating missing table: menu_items");
        connection.Execute(
            """
            CREATE TABLE menu_items (
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
            """);
    }

    private void EnsureToursTables(System.Data.IDbConnection connection, string databaseName)
    {
        if (!TableExists(connection, databaseName, "tours"))
        {
            logger.LogInformation("Creating missing table: tours");
            connection.Execute(
                """
                CREATE TABLE tours (
                    id CHAR(36) NOT NULL,
                    created_by_account_id CHAR(36) NULL,
                    code VARCHAR(50) NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    category VARCHAR(80) NULL,
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
                """);
        }
        else
        {
            EnsureColumn(
                connection,
                databaseName,
                "tours",
                "category",
                "ALTER TABLE tours ADD COLUMN category VARCHAR(80) NULL AFTER name;");
        }

        if (TableExists(connection, databaseName, "tour_pois"))
        {
            return;
        }

        logger.LogInformation("Creating missing table: tour_pois");
        connection.Execute(
            """
            CREATE TABLE tour_pois (
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
            """);
    }

    private void EnsureCashClaimCodesTable(System.Data.IDbConnection connection, string databaseName)
    {
        if (TableExists(connection, databaseName, "cash_claim_codes"))
        {
            return;
        }

        logger.LogInformation("Creating missing table: cash_claim_codes");
        connection.Execute(
            """
            CREATE TABLE cash_claim_codes (
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
            """);
    }

    private void EnsureShopVisitEventsTable(System.Data.IDbConnection connection, string databaseName)
    {
        if (TableExists(connection, databaseName, "shop_visit_events"))
        {
            return;
        }

        logger.LogInformation("Creating missing table: shop_visit_events");
        connection.Execute(
            """
            CREATE TABLE shop_visit_events (
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
            """);
    }

    private void EnsureAudioPlayEventsTable(System.Data.IDbConnection connection, string databaseName)
    {
        if (TableExists(connection, databaseName, "audio_play_events"))
        {
            return;
        }

        logger.LogInformation("Creating missing table: audio_play_events");
        connection.Execute(
            """
            CREATE TABLE audio_play_events (
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
            """);
    }

    private void EnsureOwnerUpgradeRequestsTable(System.Data.IDbConnection connection, string databaseName)
    {
        if (TableExists(connection, databaseName, "owner_upgrade_requests"))
        {
            return;
        }

        logger.LogInformation("Creating missing table: owner_upgrade_requests");
        connection.Execute(
            """
            CREATE TABLE owner_upgrade_requests (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                account_id CHAR(36) NOT NULL,
                shop_name VARCHAR(150) NOT NULL,
                address_line VARCHAR(255) NOT NULL,
                latitude DECIMAL(10, 8) NULL,
                longitude DECIMAL(11, 8) NULL,
                id_card_image_url VARCHAR(500) NULL,
                business_license_image_url VARCHAR(500) NULL,
                note VARCHAR(500) NULL,
                status ENUM('pending', 'payment_pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
                submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                reviewed_by_account_id CHAR(36) NULL,
                reviewed_at DATETIME NULL,
                review_note VARCHAR(500) NULL,
                upgrade_fee_amount DECIMAL(10, 2) NULL,
                payment_reference_code VARCHAR(50) NULL,
                payment_qr_content TEXT NULL,
                payment_qr_image_url VARCHAR(500) NULL,
                payment_requested_at DATETIME NULL,
                payment_confirmed_at DATETIME NULL,
                activated_at DATETIME NULL,
                PRIMARY KEY (id),
                KEY idx_owner_upgrade_requests_account_id (account_id),
                KEY idx_owner_upgrade_requests_status (status),
                CONSTRAINT fk_owner_upgrade_requests_account_id
                    FOREIGN KEY (account_id) REFERENCES accounts (id)
                    ON DELETE CASCADE,
                CONSTRAINT fk_owner_upgrade_requests_reviewer
                    FOREIGN KEY (reviewed_by_account_id) REFERENCES accounts (id)
                    ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """);
    }

    private void EnsureColumn(
        System.Data.IDbConnection connection,
        string databaseName,
        string tableName,
        string columnName,
        string alterSql)
    {
        if (ColumnExists(connection, databaseName, tableName, columnName))
        {
            return;
        }

        logger.LogInformation("Adding missing column {ColumnName} to {TableName}", columnName, tableName);
        connection.Execute(alterSql);
    }

    private static bool TableExists(System.Data.IDbConnection connection, string databaseName, string tableName) =>
        connection.ExecuteScalar<int>(
            """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = @databaseName
              AND table_name = @tableName;
            """,
            new { databaseName, tableName }) > 0;

    private static bool ColumnExists(
        System.Data.IDbConnection connection,
        string databaseName,
        string tableName,
        string columnName) =>
        connection.ExecuteScalar<int>(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = @databaseName
              AND table_name = @tableName
              AND column_name = @columnName;
            """,
            new { databaseName, tableName, columnName }) > 0;

    private void RefreshTouristDemoSeed(System.Data.IDbConnection connection)
    {
        logger.LogInformation("Refreshing tourist-facing demo POIs and menus");

        connection.Execute(
            """
            UPDATE shops
            SET
                name = CASE id
                    WHEN '44444444-4444-4444-4444-444444444441' THEN 'Oc Thao - Vinh Khanh'
                    WHEN '44444444-4444-4444-4444-444444444442' THEN 'Banh Trang Nuong Win'
                    WHEN '77777777-7777-7777-7777-777777777777' THEN 'Bò Lá Lốt Chị Ba Demo'
                    ELSE name
                END,
                description = CASE id
                    WHEN '44444444-4444-4444-4444-444444444441' THEN 'Quán ốc quen trên đường Vĩnh Khánh, đông khách từ chiều tới. Không gian giản dị, lên món nhanh và hợp đi nhóm nhỏ.'
                    WHEN '44444444-4444-4444-4444-444444444442' THEN 'Điểm ăn vặt nhỏ trên đường Vĩnh Khánh, phù hợp ghé nhanh buổi xế. Bánh tráng nướng làm tại chỗ, dễ ăn và dễ mang đi.'
                    WHEN '77777777-7777-7777-7777-777777777777' THEN 'Quán demo dành cho luồng chủ quán, mô phỏng một điểm nướng bình dân trên phố ẩm thực.'
                    ELSE description
                END,
                approved_intro = CASE id
                    WHEN '44444444-4444-4444-4444-444444444441' THEN 'Ốc Thảo được biết đến là một điểm hẹn bình dân ở khu Vĩnh Khánh, thường nhộn nhịp vào buổi tối. Khách hay gọi nhiều món ốc xào, nướng và ngồi lại lai rai cùng bạn bè.'
                    WHEN '44444444-4444-4444-4444-444444444442' THEN 'Bánh Tráng Nướng Win có kiểu quán ăn vặt gọn nhẹ, phù hợp cho khách muốn đổi món sau khi đi một vòng phố ốc. Món nướng được làm tại chỗ nên mùi thơm và dễ ăn khi còn nóng.'
                    WHEN '77777777-7777-7777-7777-777777777777' THEN 'Đây là quán demo để bạn thử tính năng quản lý chủ quán. Nội dung, menu và thông tin hiển thị trên bản đồ đều có thể sửa trực tiếp.'
                    ELSE approved_intro
                END,
                address_line = CASE id
                    WHEN '44444444-4444-4444-4444-444444444441' THEN '212 Vĩnh Khánh, Phường 10, Quận 4, TP. Hồ Chí Minh'
                    WHEN '44444444-4444-4444-4444-444444444442' THEN '150/38 Vĩnh Khánh, Phường 10, Quận 4, TP. Hồ Chí Minh'
                    WHEN '77777777-7777-7777-7777-777777777777' THEN '129 Vĩnh Khánh, Phường 8, Quận 4, TP. Hồ Chí Minh'
                    ELSE address_line
                END,
                opening_hours = CASE id
                    WHEN '44444444-4444-4444-4444-444444444441' THEN '16:00 - 23:30'
                    WHEN '44444444-4444-4444-4444-444444444442' THEN '15:00 - 22:30'
                    WHEN '77777777-7777-7777-7777-777777777777' THEN '16:30 - 23:30'
                    ELSE opening_hours
                END,
                phone = CASE id
                    WHEN '44444444-4444-4444-4444-444444444441' THEN '0909 000 111'
                    WHEN '44444444-4444-4444-4444-444444444442' THEN '0909 000 222'
                    WHEN '77777777-7777-7777-7777-777777777777' THEN '0909 000 123'
                    ELSE phone
                END
            WHERE id IN (
                '44444444-4444-4444-4444-444444444441',
                '44444444-4444-4444-4444-444444444442',
                '77777777-7777-7777-7777-777777777777'
            );
            """);

        connection.Execute(
            """
            UPDATE poi_translations
            SET
                name = CASE
                    WHEN poi_id = '55555555-5555-5555-5555-555555555551' AND language_code = 'vi' THEN 'Ốc Thảo - Vĩnh Khánh'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555551' AND language_code = 'en' THEN 'Oc Thao - Vinh Khanh'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555552' AND language_code = 'vi' THEN 'Bánh Tráng Nướng Win'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555552' AND language_code = 'en' THEN 'Banh Trang Nuong Win'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555553' AND language_code = 'vi' THEN 'Ốc Loan - Vĩnh Khánh'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555553' AND language_code = 'en' THEN 'Oc Loan - Vinh Khanh'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555554' AND language_code = 'vi' THEN 'Trà Viên Quán - Vĩnh Khánh'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555554' AND language_code = 'en' THEN 'Tra Vien Quan - Vinh Khanh'
                    ELSE name
                END,
                short_description = CASE
                    WHEN poi_id = '55555555-5555-5555-5555-555555555551' AND language_code = 'vi' THEN 'Quán ốc đông khách về đêm trên phố Vĩnh Khánh.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555551' AND language_code = 'en' THEN 'A busy seafood stop on Vinh Khanh street.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555552' AND language_code = 'vi' THEN 'Quán bánh tráng nướng gọn nhẹ, dễ ghé nhanh.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555552' AND language_code = 'en' THEN 'A compact grilled-rice-paper snack stop.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555553' AND language_code = 'vi' THEN 'Điểm ốc quen cho nhóm bạn muốn ngồi lai rai.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555553' AND language_code = 'en' THEN 'A familiar shellfish stop for a relaxed evening meal.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555554' AND language_code = 'vi' THEN 'Quán nước và ăn vặt nhỏ để dừng chân.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555554' AND language_code = 'en' THEN 'A light drinks and snack stop for a short break.'
                    ELSE short_description
                END,
                description = CASE
                    WHEN poi_id = '55555555-5555-5555-5555-555555555551' AND language_code = 'vi' THEN 'Ốc Thảo nằm trên tuyến phố ẩm thực Vĩnh Khánh, thường nhộn nhịp từ cuối chiều đến khuya. Quầy bếp mở, món ra đều tay, hợp cho khách muốn thử kiểu ăn tối bình dân của khu Quận 4.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555551' AND language_code = 'en' THEN 'Oc Thao sits on Vinh Khanh food street and gets lively from late afternoon into the night. It suits visitors who want a casual District 4 seafood dinner with quick, hot dishes.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555552' AND language_code = 'vi' THEN 'Bánh Tráng Nướng Win là điểm ăn vặt dễ ghé khi đi quanh khu Vĩnh Khánh. Quán nhỏ, lên món nhanh, hợp với khách muốn thử bánh tráng nướng nhiều topping mà không cần ngồi lâu.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555552' AND language_code = 'en' THEN 'Banh Trang Nuong Win is a quick snack stop near Vinh Khanh street. The shop is small and the food comes out fast, making it easy to try grilled rice paper without a long sit-down meal.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555553' AND language_code = 'vi' THEN 'Ốc Loan ở số 129 Vĩnh Khánh là một điểm hẹn quen của khu phố ốc. Khách thường ghé theo nhóm nhỏ, gọi vài món xào nướng và ngồi lại tới muộn trong không khí rất đời thường của Quận 4.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555553' AND language_code = 'en' THEN 'Oc Loan at 129 Vinh Khanh is a familiar name on the shellfish street. Small groups often stop here for a few grilled or stir-fried dishes and stay late in the relaxed District 4 atmosphere.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555554' AND language_code = 'vi' THEN 'Trà Viên Quán là điểm dừng chân nhẹ ở khu Vĩnh Khánh, hợp để gọi một ly trà mát lạnh hoặc ăn vặt nhanh trước khi đi tiếp sang các quán ốc xung quanh.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555554' AND language_code = 'en' THEN 'Tra Vien Quan works as a light break stop around Vinh Khanh, suitable for a cold drink or a quick snack before moving on to the seafood places nearby.'
                    ELSE description
                END
            WHERE poi_id IN (
                '55555555-5555-5555-5555-555555555551',
                '55555555-5555-5555-5555-555555555552',
                '55555555-5555-5555-5555-555555555553',
                '55555555-5555-5555-5555-555555555554'
            )
            AND language_code IN ('vi', 'en');
            """);

        connection.Execute(
            """
            UPDATE poi_translations
            SET
                name = CASE
                    WHEN poi_id = '55555555-5555-5555-5555-555555555551' AND language_code = 'vi' THEN 'Ốc Thảo - Vĩnh Khánh'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555552' AND language_code = 'vi' THEN 'Bánh Tráng Nướng Win'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555553' AND language_code = 'vi' THEN 'Ốc Loan - Vĩnh Khánh'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555554' AND language_code = 'vi' THEN 'Trà Viên Quán - Vĩnh Khánh'
                    ELSE name
                END,
                short_description = CASE
                    WHEN poi_id = '55555555-5555-5555-5555-555555555551' AND language_code = 'vi' THEN 'Quán ốc đông khách về đêm trên phố Vĩnh Khánh.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555552' AND language_code = 'vi' THEN 'Quán bánh tráng nướng gọn nhẹ, dễ ghé nhanh.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555553' AND language_code = 'vi' THEN 'Điểm ốc quen cho nhóm bạn muốn ngồi lai rai.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555554' AND language_code = 'vi' THEN 'Quán nước và ăn vặt nhỏ để dừng chân.'
                    ELSE short_description
                END,
                description = CASE
                    WHEN poi_id = '55555555-5555-5555-5555-555555555551' AND language_code = 'vi' THEN 'Ốc Thảo nằm trên tuyến phố ẩm thực Vĩnh Khánh, thường nhộn nhịp từ cuối chiều đến khuya. Quầy bếp mở, món ra đều tay, hợp cho khách muốn thử kiểu ăn tối bình dân của khu Quận 4.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555552' AND language_code = 'vi' THEN 'Bánh Tráng Nướng Win là điểm ăn vặt dễ ghé khi đi quanh khu Vĩnh Khánh. Quán nhỏ, lên món nhanh, hợp với khách muốn thử bánh tráng nướng nhiều topping mà không cần ngồi lâu.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555553' AND language_code = 'vi' THEN 'Ốc Loan ở số 129 Vĩnh Khánh là một điểm hẹn quen của khu phố ốc. Khách thường ghé theo nhóm nhỏ, gọi vài món xào nướng và ngồi lại tới muộn trong không khí rất đời thường của Quận 4.'
                    WHEN poi_id = '55555555-5555-5555-5555-555555555554' AND language_code = 'vi' THEN 'Trà Viên Quán là điểm dừng chân nhẹ ở khu Vĩnh Khánh, hợp để gọi một ly trà mát lạnh hoặc ăn vặt nhanh trước khi đi tiếp sang các quán ốc xung quanh.'
                    ELSE description
                END
            WHERE poi_id IN (
                '55555555-5555-5555-5555-555555555551',
                '55555555-5555-5555-5555-555555555552',
                '55555555-5555-5555-5555-555555555553',
                '55555555-5555-5555-5555-555555555554'
            )
            AND language_code = 'vi';
            """);

        connection.Execute(
            """
            UPDATE shops
            SET
                name = CASE
                    WHEN id = '44444444-4444-4444-4444-444444444441' THEN 'Ốc Thảo - Vĩnh Khánh'
                    WHEN id = '44444444-4444-4444-4444-444444444442' THEN 'Bánh Tráng Nướng Win'
                    WHEN id = '77777777-7777-7777-7777-777777777777' THEN 'Bò Lá Lốt Chị Ba Demo'
                    WHEN id = '44444444-4444-4444-4444-444444444443' THEN 'Ốc Vũ - Vĩnh Khánh'
                    WHEN id = '44444444-4444-4444-4444-444444444444' THEN 'Ốc Cúc - Vĩnh Khánh'
                    ELSE name
                END,
                description = CASE
                    WHEN id = '44444444-4444-4444-4444-444444444441' THEN 'Quán ốc quen trên đường Vĩnh Khánh, đông khách từ chiều tới. Không gian giản dị, lên món nhanh và hợp đi nhóm nhỏ.'
                    WHEN id = '44444444-4444-4444-4444-444444444442' THEN 'Điểm ăn vặt nhỏ trên đường Vĩnh Khánh, phù hợp ghé nhanh buổi xế. Bánh tráng nướng làm tại chỗ, dễ ăn và dễ mang đi.'
                    WHEN id = '77777777-7777-7777-7777-777777777777' THEN 'Quán demo dành cho luồng chủ quán, mô phỏng một điểm nướng bình dân trên phố ẩm thực.'
                    WHEN id = '44444444-4444-4444-4444-444444444443' THEN 'Quán ốc quen thuộc ở đầu đường Vĩnh Khánh, hợp cho nhóm bạn muốn ăn tối gọn mà nhiều món.'
                    WHEN id = '44444444-4444-4444-4444-444444444444' THEN 'Quán ốc nhỏ, phù hợp cho khách muốn ghé nhanh và thử vài món nướng quen thuộc của phố Vĩnh Khánh.'
                    ELSE description
                END,
                approved_intro = CASE
                    WHEN id = '44444444-4444-4444-4444-444444444441' THEN 'Ốc Thảo được biết đến là một điểm hẹn bình dân ở khu Vĩnh Khánh, thường nhộn nhịp vào buổi tối. Khách hay gọi nhiều món ốc xào, nướng và ngồi lại lai rai cùng bạn bè.'
                    WHEN id = '44444444-4444-4444-4444-444444444442' THEN 'Bánh Tráng Nướng Win có kiểu quán ăn vặt gọn nhẹ, phù hợp cho khách muốn đổi món sau khi đi một vòng phố ốc. Món nướng được làm tại chỗ nên mùi thơm và dễ ăn khi còn nóng.'
                    WHEN id = '77777777-7777-7777-7777-777777777777' THEN 'Đây là quán demo để bạn thử tính năng quản lý chủ quán. Nội dung, menu và thông tin hiển thị trên bản đồ đều có thể sửa trực tiếp.'
                    WHEN id = '44444444-4444-4444-4444-444444444443' THEN 'Ốc Vũ thường đông vào buổi tối, thực đơn có nhiều món ốc xào và nướng để chia nhau theo nhóm. Không gian bình dân và lên món khá nhanh.'
                    WHEN id = '44444444-4444-4444-4444-444444444444' THEN 'Ốc Cúc thường được nhắc đến nhờ các món hàu nướng, sò điệp mỡ hành và nghêu hấp. Quán nhỏ nhưng gọn, hợp cho buổi ăn tối không quá cầu kỳ.'
                    ELSE approved_intro
                END,
                address_line = CASE
                    WHEN id = '44444444-4444-4444-4444-444444444441' THEN '212 Vĩnh Khánh, Phường 10, Quận 4, TP. Hồ Chí Minh'
                    WHEN id = '44444444-4444-4444-4444-444444444442' THEN '150/38 Vĩnh Khánh, Phường 10, Quận 4, TP. Hồ Chí Minh'
                    WHEN id = '77777777-7777-7777-7777-777777777777' THEN '129 Vĩnh Khánh, Phường 8, Quận 4, TP. Hồ Chí Minh'
                    WHEN id = '44444444-4444-4444-4444-444444444443' THEN '37 Vĩnh Khánh, Phường 8, Quận 4, TP. Hồ Chí Minh'
                    WHEN id = '44444444-4444-4444-4444-444444444444' THEN '128 Bis Vĩnh Khánh, Phường 8, Quận 4, TP. Hồ Chí Minh'
                    ELSE address_line
                END
            WHERE id IN (
                '44444444-4444-4444-4444-444444444441',
                '44444444-4444-4444-4444-444444444442',
                '77777777-7777-7777-7777-777777777777',
                '44444444-4444-4444-4444-444444444443',
                '44444444-4444-4444-4444-444444444444'
            );
            """);

        RefreshMenuItem(
            connection,
            "44444444-4444-4444-4444-444444444441",
            "Oc huong rang muoi",
            "Oc huong rang muoi thom, vi dam va de goi theo nhom.",
            99000m,
            "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
            1,
            oldNames: ["Oc huong xao toi"]);

        RefreshMenuItem(
            connection,
            "44444444-4444-4444-4444-444444444441",
            "Hau nuong pho mai",
            "Hau nuong beo va thom, la mon hay duoc goi de an mo dau.",
            89000m,
            "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
            2,
            oldNames: ["Sot trung muoi"]);

        RefreshMenuItem(
            connection,
            "44444444-4444-4444-4444-444444444442",
            "Banh trang nuong thap cam",
            "Banh trang nuong voi trung, hanh, xuc xich va sot meo beo.",
            35000m,
            "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
            1,
            oldNames: ["Banh trang nuong trung pho mai"]);

        RefreshMenuItem(
            connection,
            "44444444-4444-4444-4444-444444444442",
            "Tra tac",
            "Ly tra tac mat lanh, de uong cung mon nuong va an vat.",
            18000m,
            "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=900&q=80",
            2,
            oldNames: ["Tra tac mat ong"]);

        RefreshMenuItem(
            connection,
            "77777777-7777-7777-7777-777777777777",
            "Bo la lot phan dac biet",
            "Bo la lot an kem rau song, do chua va nuoc cham nha lam.",
            69000m,
            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80",
            1,
            oldNames: ["Bo la lot phan dac biet", "Bò lá lốt phần đầy đủ"]);

        RefreshMenuItem(
            connection,
            "77777777-7777-7777-7777-777777777777",
            "Cha dum nuong",
            "Mon nuong them de doi vi, phu hop cho nhom 2 den 3 nguoi.",
            49000m,
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
            2,
            oldNames: ["Cha dum nuong", "Chả đùm nướng"]);
    }

    private static void RefreshMenuItem(
        System.Data.IDbConnection connection,
        string shopId,
        string name,
        string description,
        decimal price,
        string imageUrl,
        int displayOrder,
        string[] oldNames)
    {
        var existingId = connection.ExecuteScalar<long?>(
            """
            SELECT id
            FROM menu_items
            WHERE shop_id = @shopId
              AND (name = @name OR name IN @oldNames)
            ORDER BY id ASC
            LIMIT 1;
            """,
            new { shopId, name, oldNames });

        if (existingId.HasValue)
        {
            connection.Execute(
                """
                UPDATE menu_items
                SET
                    name = @name,
                    description = @description,
                    price = @price,
                    image_url = @imageUrl,
                    is_available = 1,
                    display_order = @displayOrder
                WHERE id = @id;
                """,
                new
                {
                    id = existingId.Value,
                    name,
                    description,
                    price,
                    imageUrl,
                    displayOrder
                });

            return;
        }

        connection.Execute(
            """
            INSERT INTO menu_items (
                shop_id,
                name,
                description,
                price,
                image_url,
                is_available,
                display_order
            )
            VALUES (
                @shopId,
                @name,
                @description,
                @price,
                @imageUrl,
                1,
                @displayOrder
            );
            """,
            new { shopId, name, description, price, imageUrl, displayOrder });
    }

    private void EnsureDemoTours(System.Data.IDbConnection connection)
    {
        EnsureTourSeed(
            connection,
            "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
            "11111111-1111-1111-1111-111111111111",
            "vinh-khanh-street-food-walk",
            "street_food",
            SerializeLocalizedString("Tour ăn vặt Vĩnh Khánh", "Vinh Khanh street snack walk"),
            SerializeLocalizedString(
                "Lộ trình ngắn để thử bánh tráng nướng, nước mát và một điểm ốc quen trên phố.",
                "A short route to try grilled rice paper, cool drinks, and a familiar shellfish stop on the street."),
            75,
            "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
            [
                "55555555-5555-5555-5555-555555555552",
                "55555555-5555-5555-5555-555555555554",
                "55555555-5555-5555-5555-555555555553"
            ]);

        EnsureTourSeed(
            connection,
            "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
            "11111111-1111-1111-1111-111111111111",
            "vinh-khanh-seafood-night",
            "seafood",
            SerializeLocalizedString("Tour hải sản buổi tối", "Vinh Khanh seafood night route"),
            SerializeLocalizedString(
                "Lộ trình dành cho khách muốn đi một vòng các quán ốc nổi bật ở khu Vĩnh Khánh.",
                "A route for visitors who want to spend the evening moving through standout seafood stops around Vinh Khanh."),
            95,
            "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
            [
                "55555555-5555-5555-5555-555555555551",
                "99999999-9999-9999-9999-999999999991",
                "99999999-9999-9999-9999-999999999992"
            ]);

        EnsureTourSeed(
            connection,
            "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
            "11111111-1111-1111-1111-111111111111",
            "vinh-khanh-grill-and-shellfish",
            "grilled_food",
            SerializeLocalizedString("Tour nướng và ốc", "Vinh Khanh grilled and shellfish route"),
            SerializeLocalizedString(
                "Lộ trình kết hợp bò lá lốt, quán ốc và điểm ăn nhanh để khách dễ đổi món.",
                "A route that mixes grilled beef, seafood, and a quick snack stop for visitors who want more variety."),
            90,
            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80",
            [
                "88888888-8888-8888-8888-888888888888",
                "55555555-5555-5555-5555-555555555551",
                "55555555-5555-5555-5555-555555555552"
            ]);
    }

    private void EnsureAdditionalTouristPois(System.Data.IDbConnection connection)
    {
        EnsureTouristShop(
            connection,
            "44444444-4444-4444-4444-444444444443",
            "Oc Vu - Vinh Khanh",
            "oc-vu-vinh-khanh",
            "Quán ốc quen thuộc ở đầu đường Vĩnh Khánh, hợp cho nhóm bạn muốn ăn tối gọn mà nhiều món.",
            "Ốc Vũ thường đông vào buổi tối, thực đơn có nhiều món ốc xào và nướng để chia nhau theo nhóm. Không gian bình dân và lên món khá nhanh.",
            "37 Vĩnh Khánh, Phường 8, Quận 4, TP. Hồ Chí Minh",
            10.75894000m,
            106.70272000m,
            "15:00 - 22:00",
            "0909 000 333",
            "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80");

        EnsureTouristShop(
            connection,
            "44444444-4444-4444-4444-444444444444",
            "Oc Cuc - Vinh Khanh",
            "oc-cuc-vinh-khanh",
            "Quán ốc nhỏ, phù hợp cho khách muốn ghé nhanh và thử vài món nướng quen thuộc của phố Vĩnh Khánh.",
            "Oc Cuc thuong duoc nhac den nhờ cac mon hau nuong, so diep mo hanh va ngheu hap. Quan nho nhung gon, hop cho buoi an toi khong qua cau ky.",
            "128 Bis Vĩnh Khánh, Phường 8, Quận 4, TP. Hồ Chí Minh",
            10.75842000m,
            106.70306000m,
            "15:30 - 22:00",
            "0909 000 444",
            "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80");

        EnsurePoiWithTranslations(
            connection,
            "99999999-9999-9999-9999-999999999991",
            "44444444-4444-4444-4444-444444444443",
            "seafood",
            10.75894000m,
            106.70272000m,
            "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
            "Ốc Vũ - Vĩnh Khánh",
            "Quán ốc quen cho nhóm bạn muốn ngồi ăn tối.",
            "Quán ốc có nhiều món xào bơ, xào rau muống và hải sản nướng để gọi chung. Nếu muốn thử không khí phố ốc Vĩnh Khánh theo kiểu bình dân, đây là điểm dừng khá dễ tiếp cận.",
            "Oc Vu - Vinh Khanh",
            "A familiar shellfish stop for small groups.",
            "Oc Vu is a casual seafood stop where visitors often share stir-fried and grilled dishes. It gives a straightforward taste of the lively Vinh Khanh shellfish street.");

        EnsurePoiWithTranslations(
            connection,
            "99999999-9999-9999-9999-999999999992",
            "44444444-4444-4444-4444-444444444444",
            "seafood",
            10.75842000m,
            106.70306000m,
            "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
            "Ốc Cúc - Vĩnh Khánh",
            "Điểm dừng gọn nhẹ để thử các món ốc nướng quen thuộc.",
            "Ốc Cúc có menu gọn hơn nhưng dễ chọn món, thường hợp với khách muốn ghé nhanh để ăn hàu nướng, sò điệp mỡ hành hay nghêu hấp sả. Quán nằm ngay trên tuyến phố ẩm thực nên rất tiện khi đi bộ.",
            "Oc Cuc - Vinh Khanh",
            "A compact stop known for grilled shellfish.",
            "Oc Cuc keeps a shorter, easy-to-order menu focused on grilled oysters, scallops with scallion oil, and lemongrass clams. It is convenient for a short stop while walking through the food street.");

        EnsureMenuItem(
            connection,
            "44444444-4444-4444-4444-444444444443",
            "Oc mong tay xao bo toi",
            "Mon de chia nhau, vi bo toi ro va de an voi banh mi.",
            79000m,
            "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
            1);

        EnsureMenuItem(
            connection,
            "44444444-4444-4444-4444-444444444443",
            "Tom nuong sate",
            "Tom nuong thom, vi cay nhe, phu hop an cung nhom.",
            89000m,
            "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=900&q=80",
            2);

        EnsureMenuItem(
            connection,
            "44444444-4444-4444-4444-444444444444",
            "Hau nuong pho mai",
            "Hau nuong beo va nong, hay duoc goi de mo dau bua an.",
            89000m,
            "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
            1);

        EnsureMenuItem(
            connection,
            "44444444-4444-4444-4444-444444444444",
            "Ngheu hap sa",
            "Mon nuoc nong, de an va hop khi di nhom nho.",
            69000m,
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
            2);
    }

    private static void EnsureTouristShop(
        System.Data.IDbConnection connection,
        string shopId,
        string name,
        string slug,
        string description,
        string approvedIntro,
        string addressLine,
        decimal latitude,
        decimal longitude,
        string openingHours,
        string phone,
        string imageUrl)
    {
        connection.Execute(
            """
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
            VALUES (
                @Id,
                '22222222-2222-2222-2222-222222222222',
                @Name,
                @Slug,
                @Description,
                @ApprovedIntro,
                NULL,
                'approved',
                @AddressLine,
                @Latitude,
                @Longitude,
                @OpeningHours,
                @Phone,
                @ImageUrl,
                1
            )
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                description = VALUES(description),
                approved_intro = VALUES(approved_intro),
                address_line = VALUES(address_line),
                latitude = VALUES(latitude),
                longitude = VALUES(longitude),
                opening_hours = VALUES(opening_hours),
                phone = VALUES(phone),
                image_url = VALUES(image_url),
                is_active = VALUES(is_active);
            """,
            new
            {
                Id = shopId,
                Name = name,
                Slug = slug,
                Description = description,
                ApprovedIntro = approvedIntro,
                AddressLine = addressLine,
                Latitude = latitude,
                Longitude = longitude,
                OpeningHours = openingHours,
                Phone = phone,
                ImageUrl = imageUrl
            });
    }

    private static void EnsurePoiWithTranslations(
        System.Data.IDbConnection connection,
        string poiId,
        string shopId,
        string category,
        decimal latitude,
        decimal longitude,
        string imageUrl,
        string nameVi,
        string shortVi,
        string descriptionVi,
        string nameEn,
        string shortEn,
        string descriptionEn)
    {
        connection.Execute(
            """
            INSERT INTO pois (
                id,
                shop_id,
                category,
                latitude,
                longitude,
                trigger_radius_meters,
                hero_image_url,
                default_language_code,
                is_featured,
                is_active
            )
            VALUES (
                @Id,
                @ShopId,
                @Category,
                @Latitude,
                @Longitude,
                35,
                @ImageUrl,
                'vi',
                1,
                1
            )
            ON DUPLICATE KEY UPDATE
                shop_id = VALUES(shop_id),
                category = VALUES(category),
                latitude = VALUES(latitude),
                longitude = VALUES(longitude),
                hero_image_url = VALUES(hero_image_url),
                is_featured = VALUES(is_featured),
                is_active = VALUES(is_active);
            """,
            new
            {
                Id = poiId,
                ShopId = shopId,
                Category = category,
                Latitude = latitude,
                Longitude = longitude,
                ImageUrl = imageUrl
            });

        connection.Execute(
            """
            INSERT INTO poi_translations (
                poi_id,
                language_code,
                name,
                short_description,
                description,
                audio_url
            )
            VALUES
                (@PoiId, 'vi', @NameVi, @ShortVi, @DescriptionVi, NULL),
                (@PoiId, 'en', @NameEn, @ShortEn, @DescriptionEn, NULL)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                short_description = VALUES(short_description),
                description = VALUES(description),
                audio_url = VALUES(audio_url);
            """,
            new
            {
                PoiId = poiId,
                NameVi = nameVi,
                ShortVi = shortVi,
                DescriptionVi = descriptionVi,
                NameEn = nameEn,
                ShortEn = shortEn,
                DescriptionEn = descriptionEn
            });
    }

    private static void EnsureTourSeed(
        System.Data.IDbConnection connection,
        string tourId,
        string createdByAccountId,
        string code,
        string category,
        string name,
        string description,
        int estimatedDurationMinutes,
        string coverImageUrl,
        IReadOnlyList<string> poiIds)
    {
        connection.Execute(
            """
            INSERT INTO tours (
                id,
                created_by_account_id,
                code,
                name,
                category,
                description,
                estimated_duration_minutes,
                cover_image_url,
                is_active
            )
            VALUES (
                @Id,
                @CreatedByAccountId,
                @Code,
                @Name,
                @Category,
                @Description,
                @EstimatedDurationMinutes,
                @CoverImageUrl,
                1
            )
            ON DUPLICATE KEY UPDATE
                created_by_account_id = VALUES(created_by_account_id),
                code = VALUES(code),
                name = VALUES(name),
                category = VALUES(category),
                description = VALUES(description),
                estimated_duration_minutes = VALUES(estimated_duration_minutes),
                cover_image_url = VALUES(cover_image_url),
                is_active = VALUES(is_active);
            """,
            new
            {
                Id = tourId,
                CreatedByAccountId = createdByAccountId,
                Code = code,
                Name = name,
                Category = category,
                Description = description,
                EstimatedDurationMinutes = estimatedDurationMinutes,
                CoverImageUrl = coverImageUrl
            });

        connection.Execute(
            "DELETE FROM tour_pois WHERE tour_id = @tourId;",
            new { tourId });

        connection.Execute(
            """
            INSERT INTO tour_pois (
                tour_id,
                poi_id,
                sort_order,
                stop_minutes
            )
            VALUES (
                @TourId,
                @PoiId,
                @SortOrder,
                @StopMinutes
            );
            """,
            poiIds.Select((poiId, index) => new
            {
                TourId = tourId,
                PoiId = poiId,
                SortOrder = index + 1,
                StopMinutes = 20
            }));
    }

    private static string SerializeLocalizedString(string vi, string en) =>
        System.Text.Json.JsonSerializer.Serialize(new
        {
            Vi = vi,
            En = en
        });
}

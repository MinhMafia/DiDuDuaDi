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
        EnsureCashClaimCodesTable(connection, databaseName);
        EnsureShopVisitEventsTable(connection, databaseName);
        EnsureAudioPlayEventsTable(connection, databaseName);
        EnsureOwnerUpgradeRequestsTable(connection, databaseName);
        EnsureOwnerReviewColumns(connection, databaseName);
        EnsureOwnerDemoSeed(connection);
        EnsureAdminDemoSeed(connection);
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
                id_card_image_url VARCHAR(500) NULL,
                business_license_image_url VARCHAR(500) NULL,
                note VARCHAR(500) NULL,
                status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
                submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                reviewed_by_account_id CHAR(36) NULL,
                reviewed_at DATETIME NULL,
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
}

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

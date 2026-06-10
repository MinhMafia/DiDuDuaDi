using Microsoft.EntityFrameworkCore;

namespace DiDuDuaDi.API.Data;

public class DiDuDuaDiDbContext(DbContextOptions<DiDuDuaDiDbContext> options) : DbContext(options)
{
    public DbSet<RoleSchema> Roles => Set<RoleSchema>();
    public DbSet<AccountSchema> Accounts => Set<AccountSchema>();
    public DbSet<ShopSchema> Shops => Set<ShopSchema>();
    public DbSet<MenuItemSchema> MenuItems => Set<MenuItemSchema>();
    public DbSet<PoiSchema> Pois => Set<PoiSchema>();
    public DbSet<PoiTranslationSchema> PoiTranslations => Set<PoiTranslationSchema>();
    public DbSet<TourSchema> Tours => Set<TourSchema>();
    public DbSet<TourPoiSchema> TourPois => Set<TourPoiSchema>();
    public DbSet<UserFavoriteSchema> UserFavorites => Set<UserFavoriteSchema>();
    public DbSet<CashClaimCodeSchema> CashClaimCodes => Set<CashClaimCodeSchema>();
    public DbSet<ShopVisitEventSchema> ShopVisitEvents => Set<ShopVisitEventSchema>();
    public DbSet<AudioPlayEventSchema> AudioPlayEvents => Set<AudioPlayEventSchema>();
    public DbSet<VisitorActivityEventSchema> VisitorActivityEvents => Set<VisitorActivityEventSchema>();
    public DbSet<OwnerUpgradeRequestSchema> OwnerUpgradeRequests => Set<OwnerUpgradeRequestSchema>();
    public DbSet<ChatSessionSchema> ChatSessions => Set<ChatSessionSchema>();
    public DbSet<ChatMessageSchema> ChatMessages => Set<ChatMessageSchema>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RoleSchema>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique().HasDatabaseName("uq_roles_code");
            entity.Property(e => e.Id).HasColumnName("id").HasColumnType("tinyint unsigned").ValueGeneratedOnAdd();
            entity.Property(e => e.Code).HasColumnName("code").HasMaxLength(20).IsRequired();
            entity.Property(e => e.DisplayName).HasColumnName("display_name").HasMaxLength(50).IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<AccountSchema>(entity =>
        {
            entity.ToTable("accounts");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Username).IsUnique().HasDatabaseName("uq_accounts_username");
            entity.HasIndex(e => e.Email).IsUnique().HasDatabaseName("uq_accounts_email");
            entity.HasIndex(e => e.RoleId).HasDatabaseName("idx_accounts_role_id");
            entity.Property(e => e.Id).HasColumnName("id").HasMaxLength(36);
            entity.Property(e => e.Username).HasColumnName("username").HasMaxLength(50).IsRequired();
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
            entity.Property(e => e.DisplayName).HasColumnName("display_name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(120);
            entity.Property(e => e.Phone).HasColumnName("phone").HasMaxLength(20);
            entity.Property(e => e.RoleId).HasColumnName("role_id").HasColumnType("tinyint unsigned");
            entity.Property(e => e.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(500);
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasColumnType("tinyint(1)").HasDefaultValue(true);
            entity.Property(e => e.LastLoginAt).HasColumnName("last_login_at").HasColumnType("datetime");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();
            entity.HasOne<RoleSchema>().WithMany().HasForeignKey(e => e.RoleId).HasConstraintName("fk_accounts_role_id");
        });

        modelBuilder.Entity<ShopSchema>(entity =>
        {
            entity.ToTable("shops");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique().HasDatabaseName("uq_shops_slug");
            entity.HasIndex(e => e.OwnerAccountId).HasDatabaseName("idx_shops_owner_account_id");
            entity.HasIndex(e => new { e.Latitude, e.Longitude }).HasDatabaseName("idx_shops_lat_lng");
            entity.Property(e => e.Id).HasColumnName("id").HasMaxLength(36);
            entity.Property(e => e.OwnerAccountId).HasColumnName("owner_account_id").HasMaxLength(36);
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
            entity.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(160).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description").HasColumnType("text");
            entity.Property(e => e.ApprovedIntro).HasColumnName("approved_intro").HasColumnType("text");
            entity.Property(e => e.PendingIntro).HasColumnName("pending_intro").HasColumnType("text");
            entity.Property(e => e.IntroReviewStatus).HasColumnName("intro_review_status").HasMaxLength(20).HasDefaultValue("approved").IsRequired();
            entity.Property(e => e.IntroReviewNote).HasColumnName("intro_review_note").HasMaxLength(500);
            entity.Property(e => e.AddressLine).HasColumnName("address_line").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Latitude).HasColumnName("latitude").HasPrecision(10, 8);
            entity.Property(e => e.Longitude).HasColumnName("longitude").HasPrecision(11, 8);
            entity.Property(e => e.OpeningHours).HasColumnName("opening_hours").HasMaxLength(120);
            entity.Property(e => e.Phone).HasColumnName("phone").HasMaxLength(20);
            entity.Property(e => e.ImageUrl).HasColumnName("image_url").HasMaxLength(500);
            entity.Property(e => e.IsTemporarilyClosed).HasColumnName("is_temporarily_closed").HasColumnType("tinyint(1)").HasDefaultValue(false);
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasColumnType("tinyint(1)").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();
            entity.HasOne<AccountSchema>().WithMany().HasForeignKey(e => e.OwnerAccountId).HasConstraintName("fk_shops_owner_account_id");
        });

        ConfigureMenuItem(modelBuilder);
        ConfigurePoi(modelBuilder);
        ConfigureTours(modelBuilder);
        ConfigureEventsAndRequests(modelBuilder);
        ConfigureChat(modelBuilder);
    }

    private static void ConfigureMenuItem(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MenuItemSchema>(entity =>
        {
            entity.ToTable("menu_items");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ShopId).HasDatabaseName("idx_menu_items_shop_id");
            entity.HasIndex(e => new { e.ShopId, e.IsAvailable }).HasDatabaseName("idx_menu_items_shop_id_available");
            entity.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint unsigned").ValueGeneratedOnAdd();
            entity.Property(e => e.ShopId).HasColumnName("shop_id").HasMaxLength(36);
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(500);
            entity.Property(e => e.Price).HasColumnName("price").HasPrecision(10, 2);
            entity.Property(e => e.ImageUrl).HasColumnName("image_url").HasMaxLength(500);
            entity.Property(e => e.IsAvailable).HasColumnName("is_available").HasColumnType("tinyint(1)").HasDefaultValue(true);
            entity.Property(e => e.DisplayOrder).HasColumnName("display_order").HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();
            entity.HasOne<ShopSchema>().WithMany().HasForeignKey(e => e.ShopId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_menu_items_shop_id");
        });
    }

    private static void ConfigurePoi(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PoiSchema>(entity =>
        {
            entity.ToTable("pois");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ShopId).HasDatabaseName("idx_pois_shop_id");
            entity.HasIndex(e => e.Category).HasDatabaseName("idx_pois_category");
            entity.HasIndex(e => e.IsActive).HasDatabaseName("idx_pois_active");
            entity.HasIndex(e => new { e.Latitude, e.Longitude }).HasDatabaseName("idx_pois_lat_lng");
            entity.Property(e => e.Id).HasColumnName("id").HasMaxLength(36);
            entity.Property(e => e.ShopId).HasColumnName("shop_id").HasMaxLength(36);
            entity.Property(e => e.Category).HasColumnName("category").HasMaxLength(50).HasDefaultValue("food").IsRequired();
            entity.Property(e => e.Latitude).HasColumnName("latitude").HasPrecision(10, 8);
            entity.Property(e => e.Longitude).HasColumnName("longitude").HasPrecision(11, 8);
            entity.Property(e => e.TriggerRadiusMeters).HasColumnName("trigger_radius_meters").HasDefaultValue(35);
            entity.Property(e => e.HeroImageUrl).HasColumnName("hero_image_url").HasMaxLength(500);
            entity.Property(e => e.DefaultLanguageCode).HasColumnName("default_language_code").HasMaxLength(10).HasDefaultValue("vi").IsRequired();
            entity.Property(e => e.IsFeatured).HasColumnName("is_featured").HasColumnType("tinyint(1)").HasDefaultValue(false);
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasColumnType("tinyint(1)").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();
            entity.HasOne<ShopSchema>().WithMany().HasForeignKey(e => e.ShopId).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_pois_shop_id");
        });

        modelBuilder.Entity<PoiTranslationSchema>(entity =>
        {
            entity.ToTable("poi_translations");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.PoiId, e.LanguageCode }).IsUnique().HasDatabaseName("uq_poi_translations_poi_lang");
            entity.HasIndex(e => e.LanguageCode).HasDatabaseName("idx_poi_translations_language_code");
            entity.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint unsigned").ValueGeneratedOnAdd();
            entity.Property(e => e.PoiId).HasColumnName("poi_id").HasMaxLength(36);
            entity.Property(e => e.LanguageCode).HasColumnName("language_code").HasMaxLength(10).IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            entity.Property(e => e.ShortDescription).HasColumnName("short_description").HasMaxLength(300);
            entity.Property(e => e.Description).HasColumnName("description").HasColumnType("text");
            entity.Property(e => e.AudioUrl).HasColumnName("audio_url").HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();
            entity.HasOne<PoiSchema>().WithMany().HasForeignKey(e => e.PoiId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_poi_translations_poi_id");
        });
    }

    private static void ConfigureTours(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TourSchema>(entity =>
        {
            entity.ToTable("tours");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique().HasDatabaseName("uq_tours_code");
            entity.HasIndex(e => e.CreatedByAccountId).HasDatabaseName("idx_tours_created_by_account_id");
            entity.Property(e => e.Id).HasColumnName("id").HasMaxLength(36);
            entity.Property(e => e.CreatedByAccountId).HasColumnName("created_by_account_id").HasMaxLength(36);
            entity.Property(e => e.Code).HasColumnName("code").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            entity.Property(e => e.Category).HasColumnName("category").HasMaxLength(80);
            entity.Property(e => e.Description).HasColumnName("description").HasColumnType("text");
            entity.Property(e => e.EstimatedDurationMinutes).HasColumnName("estimated_duration_minutes").HasDefaultValue(0);
            entity.Property(e => e.CoverImageUrl).HasColumnName("cover_image_url").HasMaxLength(500);
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasColumnType("tinyint(1)").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();
            entity.HasOne<AccountSchema>().WithMany().HasForeignKey(e => e.CreatedByAccountId).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_tours_created_by_account_id");
        });

        modelBuilder.Entity<TourPoiSchema>(entity =>
        {
            entity.ToTable("tour_pois");
            entity.HasKey(e => new { e.TourId, e.PoiId });
            entity.HasIndex(e => new { e.TourId, e.SortOrder }).IsUnique().HasDatabaseName("uq_tour_pois_tour_sort");
            entity.Property(e => e.TourId).HasColumnName("tour_id").HasMaxLength(36);
            entity.Property(e => e.PoiId).HasColumnName("poi_id").HasMaxLength(36);
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.Property(e => e.StopMinutes).HasColumnName("stop_minutes").HasDefaultValue(0);
            entity.HasOne<TourSchema>().WithMany().HasForeignKey(e => e.TourId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_tour_pois_tour_id");
            entity.HasOne<PoiSchema>().WithMany().HasForeignKey(e => e.PoiId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_tour_pois_poi_id");
        });

        modelBuilder.Entity<UserFavoriteSchema>(entity =>
        {
            entity.ToTable("user_favorites");
            entity.HasKey(e => new { e.AccountId, e.PoiId });
            entity.Property(e => e.AccountId).HasColumnName("account_id").HasMaxLength(36);
            entity.Property(e => e.PoiId).HasColumnName("poi_id").HasMaxLength(36);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne<AccountSchema>().WithMany().HasForeignKey(e => e.AccountId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_user_favorites_account_id");
            entity.HasOne<PoiSchema>().WithMany().HasForeignKey(e => e.PoiId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_user_favorites_poi_id");
        });
    }

    private static void ConfigureEventsAndRequests(ModelBuilder modelBuilder)
    {
        ConfigureClaimCodes(modelBuilder);
        ConfigureShopVisitEvents(modelBuilder);
        ConfigureAudioPlayEvents(modelBuilder);
        ConfigureVisitorActivityEvents(modelBuilder);
        ConfigureOwnerUpgradeRequests(modelBuilder);
    }

    private static void ConfigureClaimCodes(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CashClaimCodeSchema>(entity =>
        {
            entity.ToTable("cash_claim_codes");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique().HasDatabaseName("uq_cash_claim_codes_code");
            entity.HasIndex(e => e.ShopId).HasDatabaseName("idx_cash_claim_codes_shop_id");
            entity.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint unsigned").ValueGeneratedOnAdd();
            entity.Property(e => e.ShopId).HasColumnName("shop_id").HasMaxLength(36);
            entity.Property(e => e.Code).HasColumnName("code").HasMaxLength(12).IsRequired();
            entity.Property(e => e.Amount).HasColumnName("amount").HasPrecision(10, 2).HasDefaultValue(0m);
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("issued").IsRequired();
            entity.Property(e => e.Note).HasColumnName("note").HasMaxLength(255);
            entity.Property(e => e.IssuedAt).HasColumnName("issued_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.ClaimedAt).HasColumnName("claimed_at").HasColumnType("datetime");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at").HasColumnType("datetime");
            entity.HasOne<ShopSchema>().WithMany().HasForeignKey(e => e.ShopId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_cash_claim_codes_shop_id");
        });
    }

    private static void ConfigureShopVisitEvents(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ShopVisitEventSchema>(entity =>
        {
            entity.ToTable("shop_visit_events");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ShopId, e.CreatedAt }).HasDatabaseName("idx_shop_visit_events_shop_id_created_at");
            entity.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint unsigned").ValueGeneratedOnAdd();
            entity.Property(e => e.ShopId).HasColumnName("shop_id").HasMaxLength(36);
            entity.Property(e => e.PoiId).HasColumnName("poi_id").HasMaxLength(36);
            entity.Property(e => e.LanguageCode).HasColumnName("language_code").HasMaxLength(10).HasDefaultValue("vi").IsRequired();
            entity.Property(e => e.Source).HasColumnName("source").HasMaxLength(50).HasDefaultValue("map").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne<ShopSchema>().WithMany().HasForeignKey(e => e.ShopId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_shop_visit_events_shop_id");
            entity.HasOne<PoiSchema>().WithMany().HasForeignKey(e => e.PoiId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_shop_visit_events_poi_id");
        });
    }

    private static void ConfigureAudioPlayEvents(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AudioPlayEventSchema>(entity =>
        {
            entity.ToTable("audio_play_events");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ShopId, e.CreatedAt }).HasDatabaseName("idx_audio_play_events_shop_id_created_at");
            entity.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint unsigned").ValueGeneratedOnAdd();
            entity.Property(e => e.ShopId).HasColumnName("shop_id").HasMaxLength(36);
            entity.Property(e => e.PoiId).HasColumnName("poi_id").HasMaxLength(36);
            entity.Property(e => e.LanguageCode).HasColumnName("language_code").HasMaxLength(10).HasDefaultValue("vi").IsRequired();
            entity.Property(e => e.Source).HasColumnName("source").HasMaxLength(50).HasDefaultValue("tts").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne<ShopSchema>().WithMany().HasForeignKey(e => e.ShopId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_audio_play_events_shop_id");
            entity.HasOne<PoiSchema>().WithMany().HasForeignKey(e => e.PoiId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_audio_play_events_poi_id");
        });
    }

    private static void ConfigureVisitorActivityEvents(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<VisitorActivityEventSchema>(entity =>
        {
            entity.ToTable("visitor_activity_events");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SessionKey, e.CreatedAt }).HasDatabaseName("idx_visitor_activity_events_session_created_at");
            entity.HasIndex(e => e.CreatedAt).HasDatabaseName("idx_visitor_activity_events_created_at");
            entity.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint unsigned").ValueGeneratedOnAdd();
            entity.Property(e => e.SessionKey).HasColumnName("session_key").HasMaxLength(80).IsRequired();
            entity.Property(e => e.Source).HasColumnName("source").HasMaxLength(50).HasDefaultValue("map").IsRequired();
            entity.Property(e => e.Page).HasColumnName("page").HasMaxLength(50).HasDefaultValue("map").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
        });
    }

    private static void ConfigureOwnerUpgradeRequests(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OwnerUpgradeRequestSchema>(entity =>
        {
            entity.ToTable("owner_upgrade_requests");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.AccountId).HasDatabaseName("idx_owner_upgrade_requests_account_id");
            entity.HasIndex(e => e.Status).HasDatabaseName("idx_owner_upgrade_requests_status");
            entity.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint unsigned").ValueGeneratedOnAdd();
            entity.Property(e => e.AccountId).HasColumnName("account_id").HasMaxLength(36);
            entity.Property(e => e.ShopName).HasColumnName("shop_name").HasMaxLength(150).IsRequired();
            entity.Property(e => e.AddressLine).HasColumnName("address_line").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Latitude).HasColumnName("latitude").HasPrecision(10, 8);
            entity.Property(e => e.Longitude).HasColumnName("longitude").HasPrecision(11, 8);
            entity.Property(e => e.IdCardImageUrl).HasColumnName("id_card_image_url").HasMaxLength(500);
            entity.Property(e => e.BusinessLicenseImageUrl).HasColumnName("business_license_image_url").HasMaxLength(500);
            entity.Property(e => e.Note).HasColumnName("note").HasMaxLength(500);
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("pending").IsRequired();
            entity.Property(e => e.SubmittedAt).HasColumnName("submitted_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.ReviewedByAccountId).HasColumnName("reviewed_by_account_id").HasMaxLength(36);
            entity.Property(e => e.ReviewedAt).HasColumnName("reviewed_at").HasColumnType("datetime");
            entity.Property(e => e.ReviewNote).HasColumnName("review_note").HasMaxLength(500);
            entity.Property(e => e.UpgradeFeeAmount).HasColumnName("upgrade_fee_amount").HasPrecision(10, 2);
            entity.Property(e => e.PaymentReferenceCode).HasColumnName("payment_reference_code").HasMaxLength(50);
            entity.Property(e => e.PaymentQrContent).HasColumnName("payment_qr_content").HasColumnType("text");
            entity.Property(e => e.PaymentQrImageUrl).HasColumnName("payment_qr_image_url").HasMaxLength(500);
            entity.Property(e => e.PaymentRequestedAt).HasColumnName("payment_requested_at").HasColumnType("datetime");
            entity.Property(e => e.PaymentConfirmedAt).HasColumnName("payment_confirmed_at").HasColumnType("datetime");
            entity.Property(e => e.ActivatedAt).HasColumnName("activated_at").HasColumnType("datetime");
            entity.HasOne<AccountSchema>().WithMany().HasForeignKey(e => e.AccountId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_owner_upgrade_requests_account_id");
            entity.HasOne<AccountSchema>().WithMany().HasForeignKey(e => e.ReviewedByAccountId).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_owner_upgrade_requests_reviewer");
        });
    }

    private static void ConfigureChat(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ChatSessionSchema>(entity =>
        {
            entity.ToTable("chat_sessions");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.AccountId).HasDatabaseName("idx_chat_sessions_account_id");
            entity.Property(e => e.Id).HasColumnName("id").HasMaxLength(36);
            entity.Property(e => e.AccountId).HasColumnName("account_id").HasMaxLength(36);
            entity.Property(e => e.LanguageCode).HasColumnName("language_code").HasMaxLength(10).HasDefaultValue("vi").IsRequired();
            entity.Property(e => e.StartedAt).HasColumnName("started_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.LastMessageAt).HasColumnName("last_message_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne<AccountSchema>().WithMany().HasForeignKey(e => e.AccountId).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_chat_sessions_account_id");
        });

        modelBuilder.Entity<ChatMessageSchema>(entity =>
        {
            entity.ToTable("chat_messages");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SessionId, e.CreatedAt }).HasDatabaseName("idx_chat_messages_session_id_created_at");
            entity.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint unsigned").ValueGeneratedOnAdd();
            entity.Property(e => e.SessionId).HasColumnName("session_id").HasMaxLength(36);
            entity.Property(e => e.SenderRole).HasColumnName("sender_role").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Content).HasColumnName("content").HasColumnType("text").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne<ChatSessionSchema>().WithMany().HasForeignKey(e => e.SessionId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_chat_messages_session_id");
        });
    }
}

public sealed class RoleSchema
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public sealed class AccountSchema
{
    public string Id { get; set; } = "";
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int RoleId { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class ShopSchema
{
    public string Id { get; set; } = "";
    public string OwnerAccountId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string? Description { get; set; }
    public string? ApprovedIntro { get; set; }
    public string? PendingIntro { get; set; }
    public string IntroReviewStatus { get; set; } = "approved";
    public string? IntroReviewNote { get; set; }
    public string AddressLine { get; set; } = "";
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string? OpeningHours { get; set; }
    public string? Phone { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsTemporarilyClosed { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class MenuItemSchema
{
    public long Id { get; set; }
    public string ShopId { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class PoiSchema
{
    public string Id { get; set; } = "";
    public string? ShopId { get; set; }
    public string Category { get; set; } = "food";
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public int TriggerRadiusMeters { get; set; }
    public string? HeroImageUrl { get; set; }
    public string DefaultLanguageCode { get; set; } = "vi";
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class PoiTranslationSchema
{
    public long Id { get; set; }
    public string PoiId { get; set; } = "";
    public string LanguageCode { get; set; } = "";
    public string Name { get; set; } = "";
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public string? AudioUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class TourSchema
{
    public string Id { get; set; } = "";
    public string? CreatedByAccountId { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Category { get; set; }
    public string? Description { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public string? CoverImageUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class TourPoiSchema
{
    public string TourId { get; set; } = "";
    public string PoiId { get; set; } = "";
    public int SortOrder { get; set; }
    public int StopMinutes { get; set; }
}

public sealed class UserFavoriteSchema
{
    public string AccountId { get; set; } = "";
    public string PoiId { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public sealed class CashClaimCodeSchema
{
    public long Id { get; set; }
    public string ShopId { get; set; } = "";
    public string Code { get; set; } = "";
    public decimal Amount { get; set; }
    public string Status { get; set; } = "issued";
    public string? Note { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime? ClaimedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public sealed class ShopVisitEventSchema
{
    public long Id { get; set; }
    public string ShopId { get; set; } = "";
    public string PoiId { get; set; } = "";
    public string LanguageCode { get; set; } = "vi";
    public string Source { get; set; } = "map";
    public DateTime CreatedAt { get; set; }
}

public sealed class AudioPlayEventSchema
{
    public long Id { get; set; }
    public string ShopId { get; set; } = "";
    public string PoiId { get; set; } = "";
    public string LanguageCode { get; set; } = "vi";
    public string Source { get; set; } = "tts";
    public DateTime CreatedAt { get; set; }
}

public sealed class VisitorActivityEventSchema
{
    public long Id { get; set; }
    public string SessionKey { get; set; } = "";
    public string Source { get; set; } = "map";
    public string Page { get; set; } = "map";
    public DateTime CreatedAt { get; set; }
}

public sealed class OwnerUpgradeRequestSchema
{
    public long Id { get; set; }
    public string AccountId { get; set; } = "";
    public string ShopName { get; set; } = "";
    public string AddressLine { get; set; } = "";
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? IdCardImageUrl { get; set; }
    public string? BusinessLicenseImageUrl { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime SubmittedAt { get; set; }
    public string? ReviewedByAccountId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNote { get; set; }
    public decimal? UpgradeFeeAmount { get; set; }
    public string? PaymentReferenceCode { get; set; }
    public string? PaymentQrContent { get; set; }
    public string? PaymentQrImageUrl { get; set; }
    public DateTime? PaymentRequestedAt { get; set; }
    public DateTime? PaymentConfirmedAt { get; set; }
    public DateTime? ActivatedAt { get; set; }
}

public sealed class ChatSessionSchema
{
    public string Id { get; set; } = "";
    public string? AccountId { get; set; }
    public string LanguageCode { get; set; } = "vi";
    public DateTime StartedAt { get; set; }
    public DateTime LastMessageAt { get; set; }
}

public sealed class ChatMessageSchema
{
    public long Id { get; set; }
    public string SessionId { get; set; } = "";
    public string SenderRole { get; set; } = "";
    public string Content { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

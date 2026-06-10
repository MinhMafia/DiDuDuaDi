using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiDuDuaDi.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class BaselineSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Baseline only: the existing schema is currently created by MySqlDatabaseInitializer/db.sql.
            // Keep this migration empty so existing databases can be marked as migrated safely.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Baseline only: do not drop existing Dapper-managed tables when rolling back this marker.
        }
    }
}

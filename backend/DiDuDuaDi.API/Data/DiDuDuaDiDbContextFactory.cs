using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DiDuDuaDi.API.Data;

public sealed class DiDuDuaDiDbContextFactory : IDesignTimeDbContextFactory<DiDuDuaDiDbContext>
{
    public DiDuDuaDiDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = NormalizeForEfProvider(
            configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection"));

        var options = new DbContextOptionsBuilder<DiDuDuaDiDbContext>()
            .UseMySQL(connectionString)
            .Options;

        return new DiDuDuaDiDbContext(options);
    }

    private static string NormalizeForEfProvider(string connectionString) =>
        connectionString.Replace("SslMode=None", "SslMode=Disabled", StringComparison.OrdinalIgnoreCase);
}

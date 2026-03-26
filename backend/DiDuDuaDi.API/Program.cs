using DiDuDuaDi.API.Data;
using DiDuDuaDi.API.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<IDbConnectionFactory, MySqlConnectionFactory>();
builder.Services.AddSingleton<IDatabaseInitializer, MySqlDatabaseInitializer>();
builder.Services.AddScoped<IPoiRepository, MySqlPoiRepository>();
builder.Services.AddScoped<IAuthRepository, MySqlAuthRepository>();
builder.Services.AddScoped<IOwnerRepository, MySqlOwnerRepository>();
builder.Services.AddScoped<IAnalyticsRepository, MySqlAnalyticsRepository>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy
            .WithOrigins("http://localhost:3000", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var databaseInitializer = scope.ServiceProvider.GetRequiredService<IDatabaseInitializer>();
    databaseInitializer.EnsureSchema();
}

app.UseCors();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.MapGet("/", () => Results.Ok(new { success = true, message = "DiDuDuaDi.API (.NET 10) is running" }));
app.MapControllers();

app.Run();

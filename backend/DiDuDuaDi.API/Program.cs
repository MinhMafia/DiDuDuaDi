using DiDuDuaDi.API.Data;
using DiDuDuaDi.API.Repositories;
using DiDuDuaDi.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtSecretKey = jwtSection["SecretKey"] ?? throw new InvalidOperationException("Missing Jwt:SecretKey");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddSingleton<IDbConnectionFactory, MySqlConnectionFactory>();
builder.Services.AddSingleton<IDatabaseInitializer, MySqlDatabaseInitializer>();
builder.Services.AddSingleton<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IPoiRepository, MySqlPoiRepository>();
builder.Services.AddScoped<IAuthRepository, MySqlAuthRepository>();
builder.Services.AddScoped<IOwnerRepository, MySqlOwnerRepository>();
builder.Services.AddScoped<IAnalyticsRepository, MySqlAnalyticsRepository>();
builder.Services.AddScoped<IAdminRepository, MySqlAdminRepository>();
builder.Services.AddScoped<ITranslationService, GoogleFreeTranslationService>();
builder.Services.AddHttpClient<ITextToSpeechService, GoogleFreeTextToSpeechService>();

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
    try
    {
        var databaseInitializer = scope.ServiceProvider.GetRequiredService<IDatabaseInitializer>();
        databaseInitializer.EnsureSchema();
    }
    catch (Exception ex)
    {
        System.IO.File.WriteAllText("fatal_error.log", ex.ToString());
        throw;
    }
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.MapGet("/", () => Results.Ok(new { success = true, message = "DiDuDuaDi.API (.NET 10) is running" }));
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
});app.MapControllers();

app.Run();

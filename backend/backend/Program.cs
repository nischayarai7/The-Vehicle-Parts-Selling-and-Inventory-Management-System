using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using backend.Data;
using backend.Middleware;
using backend.Repositories;
using backend.Repositories.Interfaces;
using backend.Services;
using backend.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// ── 1. Database ──────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── 2. Repositories (Data Access Layer) ─────────────────────────────────────
builder.Services.AddScoped<IPartRepository, PartRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();

// ── 3. Services (Business Logic Layer) ──────────────────────────────────────
builder.Services.AddScoped<IPartService, PartService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();

// ── 4. CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ── 5. JWT Authentication ────────────────────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey   = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtSettings["Issuer"],
        ValidAudience            = jwtSettings["Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(secretKey)
    };
});

// ── 6. Controllers & OpenAPI ─────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// ════════════════════════════════════════════════════════════════════════════
var app = builder.Build();
// ════════════════════════════════════════════════════════════════════════════

// ── 7. Auto-migrate and Seed database on startup ─────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    db.Database.Migrate();

    // Seed the database with initial data
    await DbSeeder.SeedAsync(db, logger);
}

// ── 8. Middleware Pipeline (ORDER MATTERS) ────────────────────────────────────
// Global error handler must be FIRST so it catches errors from all later middleware
app.UseExceptionMiddleware();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

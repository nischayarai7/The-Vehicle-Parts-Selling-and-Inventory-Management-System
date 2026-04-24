using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext context, ILogger logger)
        {
            try
            {
                // Check if categories already exist, if so, database is already seeded
                if (await context.Categories.AnyAsync())
                {
                    logger.LogInformation("Database already seeded. Skipping seeder.");
                    return;
                }

                logger.LogInformation("Starting database seeding...");

                // ── 1. Seed Categories ────────────────────────────────────────────────
                var categories = new List<Category>
                {
                    new() { Name = "Brakes", Description = "Brake pads, rotors, and calipers", ImageUrl = "/images/categories/brakes.png", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new() { Name = "Engine", Description = "Engine components and filters", ImageUrl = "/images/categories/engine.png", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new() { Name = "Suspension", Description = "Shocks, struts, and springs", ImageUrl = "/images/categories/suspension.png", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new() { Name = "Lighting", Description = "Headlights, taillights, and bulbs", ImageUrl = "/images/categories/lighting.png", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new() { Name = "Interior", Description = "Seats, mats, and steering wheels", ImageUrl = "/images/categories/interior.png", IsActive = true, CreatedAt = DateTime.UtcNow }
                };

                await context.Categories.AddRangeAsync(categories);
                await context.SaveChangesAsync();
                logger.LogInformation($"Seeded {categories.Count} categories.");

                // ── 2. Seed Parts ─────────────────────────────────────────────────────
                var parts = new List<Part>
                {
                    new() {
                        PartNumber = "BRK-PAD-001",
                        Name = "Ceramic Front Brake Pads",
                        Description = "High-performance ceramic brake pads for smooth and quiet stopping.",
                        Price = 4500.00m,
                        StockQuantity = 50,
                        ReorderLevel = 10,
                        Condition = "New",
                        Brand = "Brembo",
                        CategoryId = categories.First(c => c.Name == "Brakes").Id,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new() {
                        PartNumber = "ENG-FLT-102",
                        Name = "Premium Oil Filter",
                        Description = "Advanced synthetic oil filter for maximum engine protection.",
                        Price = 1200.00m,
                        StockQuantity = 100,
                        ReorderLevel = 20,
                        Condition = "New",
                        Brand = "Bosch",
                        CategoryId = categories.First(c => c.Name == "Engine").Id,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new() {
                        PartNumber = "SUS-SHK-205",
                        Name = "Gas-A-Just Shock Absorber",
                        Description = "Monotube shock absorber for improved handling and ride quality.",
                        Price = 8500.00m,
                        StockQuantity = 30,
                        ReorderLevel = 5,
                        Condition = "New",
                        Brand = "KYB",
                        CategoryId = categories.First(c => c.Name == "Suspension").Id,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new() {
                        PartNumber = "LGT-LED-301",
                        Name = "H11 LED Headlight Bulbs",
                        Description = "Ultra-bright 6000K white LED headlight bulbs. Plug and play.",
                        Price = 3200.00m,
                        StockQuantity = 40,
                        ReorderLevel = 10,
                        Condition = "New",
                        Brand = "Philips",
                        CategoryId = categories.First(c => c.Name == "Lighting").Id,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };

                await context.Parts.AddRangeAsync(parts);
                await context.SaveChangesAsync();
                logger.LogInformation($"Seeded {parts.Count} parts.");

                logger.LogInformation("Database seeding completed successfully.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while seeding the database.");
            }
        }
    }
}

using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace backend.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext context, ILogger logger)
        {
            try
            {
                logger.LogInformation("Checking database seeding status...");

                // ── 0. Seed Permissions ──────────────────────────────────────────────
                if (!await context.Permissions.AnyAsync())
                {
                    var permissions = new List<Permission>
                    {
                        new() { Name = "parts.view", Description = "Can view parts", Group = "Parts" },
                        new() { Name = "parts.create", Description = "Can create parts", Group = "Parts" },
                        new() { Name = "parts.edit", Description = "Can edit parts", Group = "Parts" },
                        new() { Name = "parts.delete", Description = "Can delete parts", Group = "Parts" },
                        new() { Name = "categories.manage", Description = "Can manage categories", Group = "Categories" },
                        new() { Name = "users.view", Description = "Can view users", Group = "Users" },
                        new() { Name = "users.manage", Description = "Can manage user roles", Group = "Users" },
                        new() { Name = "roles.manage", Description = "Can manage roles and permissions", Group = "Roles" }
                    };
                    await context.Permissions.AddRangeAsync(permissions);
                    await context.SaveChangesAsync();
                    logger.LogInformation($"Seeded {permissions.Count} permissions.");
                }

                // ── 1. Seed Roles ────────────────────────────────────────────────────
                if (!await context.Roles.AnyAsync())
                {
                    var initialAdminRole = new AppRole { Name = "Admin", Description = "Full system access" };
                    var staffRole = new AppRole { Name = "Staff", Description = "Operational access" };
                    var customerRole = new AppRole { Name = "Customer", Description = "Basic access" };

                    await context.Roles.AddRangeAsync(initialAdminRole, staffRole, customerRole);
                    await context.SaveChangesAsync();

                    // Link all permissions to Admin
                    var allPermissions = await context.Permissions.ToListAsync();
                    foreach (var p in allPermissions)
                    {
                        context.RolePermissions.Add(new RolePermission { RoleId = initialAdminRole.Id, PermissionId = p.Id });
                    }

                    // Link basic permissions to Staff
                    var staffPerms = allPermissions.Where(p => p.Name.StartsWith("parts") || p.Name.StartsWith("categories")).ToList();
                    foreach (var p in staffPerms)
                    {
                        context.RolePermissions.Add(new RolePermission { RoleId = staffRole.Id, PermissionId = p.Id });
                    }

                    await context.SaveChangesAsync();
                    logger.LogInformation("Seeded default roles and linked permissions.");
                }

                // ── 2. Seed/Fix Admin User ───────────────────────────────────────────
                var adminEmail = "admin@6ix7even.com";
                var adminUser = await context.Users
                    .Include(u => u.UserRoles)
                    .FirstOrDefaultAsync(u => u.Email == adminEmail);

                var targetAdminRole = await context.Roles.FirstAsync(r => r.Name == "Admin");

                if (adminUser == null)
                {
                    adminUser = new User
                    {
                        FullName = "System Administrator",
                        Email = adminEmail,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                        CreatedAt = DateTime.UtcNow
                    };
                    await context.Users.AddAsync(adminUser);
                    await context.SaveChangesAsync();
                    logger.LogInformation($"Created new admin user: {adminEmail}");
                }

                // Ensure the user has the Admin role
                if (!adminUser.UserRoles.Any(ur => ur.RoleId == targetAdminRole.Id))
                {
                    await context.UserRoles.AddAsync(new UserRole { UserId = adminUser.Id, RoleId = targetAdminRole.Id });
                    await context.SaveChangesAsync();
                    logger.LogInformation($"Assigned 'Admin' role to {adminEmail}");
                }

                // Check if categories already exist
                if (await context.Categories.AnyAsync())
                {
                    logger.LogInformation("Categories already exist. Skipping category/part seeding.");
                    return;
                }

                logger.LogInformation("Starting core data seeding...");

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

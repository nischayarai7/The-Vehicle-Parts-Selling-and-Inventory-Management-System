using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Models;

namespace backend.Data
{
    public static class CatalogSeeder
    {
        public static async Task SeedCatalogFromCsv(AppDbContext db, ILogger logger)
        {
            var pathsToCheck = new[]
            {
                "../../vehicle_parts_seed.csv",
                "../vehicle_parts_seed.csv",
                "vehicle_parts_seed.csv",
                @"c:\Users\nisch\OneDrive - Itahari International College Pvt. Ltd\Documents\Application Development\The Vehicle Parts Selling and Inventory Management System\vehicle_parts_seed.csv"
            };

            string csvPath = null;
            foreach (var p in pathsToCheck)
            {
                if (File.Exists(p))
                {
                    csvPath = p;
                    break;
                }
            }

            if (csvPath == null)
            {
                logger.LogWarning("Catalog CSV seed file not found. Skipping dynamic seeding.");
                return;
            }

            logger.LogInformation($"Found catalog CSV at: {csvPath}. Starting dynamic seeding process...");

            try
            {
                var lines = await File.ReadAllLinesAsync(csvPath);
                if (lines.Length <= 1)
                {
                    logger.LogWarning("Catalog CSV file is empty or contains only headers. Skipping seeding.");
                    return;
                }

                // Header mapping: PartName,SKU,Brand,Category,Price_NPR,Condition,Compatible_Make,Compatible_Model,Compatible_Year,StockQuantity
                int importedCount = 0;
                int skippedCount = 0;
                int vehiclesCreated = 0;
                int categoriesCreated = 0;

                using var transaction = await db.Database.BeginTransactionAsync();

                // Skip header (index 0)
                for (int i = 1; i < lines.Length; i++)
                {
                    var line = lines[i];
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    var cols = line.Split(',');
                    if (cols.Length < 10)
                    {
                        logger.LogWarning($"Line {i+1} in CSV is invalid (less than 10 columns). Skipping: {line}");
                        continue;
                    }

                    var partName = cols[0].Trim();
                    var sku = cols[1].Trim();
                    var brandName = cols[2].Trim();
                    var categoryName = cols[3].Trim();
                    var priceStr = cols[4].Trim();
                    var conditionStr = cols[5].Trim();
                    var makeName = cols[6].Trim();
                    var modelName = cols[7].Trim();
                    var yearStr = cols[8].Trim();
                    var qtyStr = cols[9].Trim();

                    // 1. Resolve or dynamically create category
                    var category = await db.Categories.FirstOrDefaultAsync(c => c.Name.ToLower() == categoryName.ToLower());
                    if (category == null)
                    {
                        category = new Category
                        {
                            Name = categoryName,
                            Description = $"{categoryName} components and replacement parts.",
                            IsActive = true
                        };
                        db.Categories.Add(category);
                        await db.SaveChangesAsync();
                        categoriesCreated++;
                    }

                    // 2. Resolve or dynamically create vehicle (Brand/Model/Year)
                    if (!int.TryParse(yearStr, out int year))
                    {
                        year = 2020;
                    }

                    var vehicle = await db.Vehicles.FirstOrDefaultAsync(v =>
                        v.Make.ToLower() == makeName.ToLower() &&
                        v.Model.ToLower() == modelName.ToLower() &&
                        v.Year == year);

                    if (vehicle == null)
                    {
                        vehicle = new Vehicle
                        {
                            Make = makeName,
                            Model = modelName,
                            Year = year,
                            Trim = "Base",
                            EngineType = "Standard"
                        };
                        db.Vehicles.Add(vehicle);
                        await db.SaveChangesAsync();
                        vehiclesCreated++;
                    }

                    // 3. Resolve or create part
                    if (!decimal.TryParse(priceStr, out decimal originalPrice))
                    {
                        originalPrice = 1000.00M;
                    }

                    if (!int.TryParse(qtyStr, out int stockQty))
                    {
                        stockQty = 10;
                    }

                    // Dynamic Condition Assignment: ~15% chance to mark as Used based on SKU hash
                    bool isUsed = Math.Abs(sku.GetHashCode() % 7) == 0;
                    string finalCondition = isUsed ? "Used" : "New";

                    // Dynamic Price Adjustments: Used parts are slashed by 45% (lower price)
                    decimal finalPrice = isUsed ? Math.Round(originalPrice * 0.55M, 2) : originalPrice;

                    // Dynamic Description builder
                    string description = $"Premium {brandName} {partName} engineered specifically for compatible {makeName} {modelName} models.";
                    if (isUsed)
                    {
                        description += " Note: This is a high-grade used OEM part in excellent operating condition. Professionally inspected and tested.";
                    }
                    else
                    {
                        description += " Brand new OEM quality, guaranteed high-performance replacement component.";
                    }

                    var part = await db.Parts
                        .Include(p => p.Compatibilities)
                        .FirstOrDefaultAsync(p => p.PartNumber.ToLower() == sku.ToLower());

                    if (part == null)
                    {
                        part = new Part
                        {
                            PartNumber = sku,
                            Name = partName,
                            Brand = brandName,
                            Description = description,
                            Price = finalPrice,
                            StockQuantity = stockQty,
                            ReorderLevel = 5,
                            Condition = finalCondition,
                            IsActive = true,
                            CategoryId = category.Id,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        db.Parts.Add(part);
                        await db.SaveChangesAsync();
                        importedCount++;
                    }
                    else
                    {
                        skippedCount++;
                    }

                    // 4. Ensure part compatibility link exists
                    var compatExists = part.Compatibilities.Any(c => c.VehicleId == vehicle.Id);
                    if (!compatExists)
                    {
                        db.PartCompatibilities.Add(new PartCompatibility
                        {
                            PartId = part.Id,
                            VehicleId = vehicle.Id,
                            Notes = isUsed ? "Fits compatible models. Used part fitment approved." : "Direct OEM fitment."
                        });
                        await db.SaveChangesAsync();
                    }
                }

                await transaction.CommitAsync();

                logger.LogInformation($"Dynamic Seed Completed successfully!");
                logger.LogInformation($"Categories created: {categoriesCreated}");
                logger.LogInformation($"Vehicles registered dynamically: {vehiclesCreated}");
                logger.LogInformation($"New Parts imported: {importedCount}");
                logger.LogInformation($"Existing Parts skipped: {skippedCount}");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to dynamically import vehicle parts catalog from CSV.");
            }
        }
    }
}

using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations
{
    public class PartConfiguration : IEntityTypeConfiguration<Part>
    {
        public void Configure(EntityTypeBuilder<Part> builder)
        {
            builder.ToTable("parts");

            builder.HasKey(p => p.Id);
            builder.Property(p => p.Id).HasColumnName("id");

            builder.Property(p => p.PartNumber)
                .HasColumnName("part_number")
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(p => p.Name)
                .HasColumnName("name")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(p => p.Description)
                .HasColumnName("description")
                .HasMaxLength(2000);

            builder.Property(p => p.ImageUrl)
                .HasColumnName("image_url")
                .HasMaxLength(500);

            builder.Property(p => p.Price)
                .HasColumnName("price")
                .HasPrecision(10, 2)   // Up to 99,999,999.99
                .IsRequired();

            builder.Property(p => p.StockQuantity)
                .HasColumnName("stock_quantity")
                .HasDefaultValue(0);

            builder.Property(p => p.ReorderLevel)
                .HasColumnName("reorder_level")
                .HasDefaultValue(5);

            builder.Property(p => p.Condition)
                .HasColumnName("condition")
                .HasMaxLength(20)
                .HasDefaultValue("New");

            builder.Property(p => p.Brand)
                .HasColumnName("brand")
                .HasMaxLength(100);

            builder.Property(p => p.IsActive)
                .HasColumnName("is_active")
                .HasDefaultValue(true);

            builder.Property(p => p.CreatedAt)
                .HasColumnName("created_at")
                .HasDefaultValueSql("NOW()");

            builder.Property(p => p.UpdatedAt)
                .HasColumnName("updated_at")
                .HasDefaultValueSql("NOW()");

            builder.Property(p => p.CategoryId)
                .HasColumnName("category_id");

            // Unique index on part number for fast search + OEM lookups
            builder.HasIndex(p => p.PartNumber)
                .IsUnique()
                .HasDatabaseName("ix_parts_part_number");

            // Index on category for fast category browsing queries
            builder.HasIndex(p => p.CategoryId)
                .HasDatabaseName("ix_parts_category_id");

            // Relationship: Part belongs to Category
            builder.HasOne(p => p.Category)
                .WithMany(c => c.Parts)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade-deleting all parts
        }
    }
}

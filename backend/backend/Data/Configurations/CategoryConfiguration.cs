using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations
{
    public class CategoryConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            builder.ToTable("categories");

            builder.HasKey(c => c.Id);
            builder.Property(c => c.Id).HasColumnName("id");

            builder.Property(c => c.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(c => c.Description)
                .HasColumnName("description")
                .HasMaxLength(500);

            builder.Property(c => c.ImageUrl)
                .HasColumnName("image_url")
                .HasMaxLength(500);

            builder.Property(c => c.IsActive)
                .HasColumnName("is_active")
                .HasDefaultValue(true);

            builder.Property(c => c.CreatedAt)
                .HasColumnName("created_at")
                .HasDefaultValueSql("NOW()");

            builder.HasIndex(c => c.Name)
                .IsUnique()
                .HasDatabaseName("ix_categories_name");
        }
    }
}

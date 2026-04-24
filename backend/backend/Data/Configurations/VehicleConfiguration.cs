using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations
{
    public class VehicleConfiguration : IEntityTypeConfiguration<Vehicle>
    {
        public void Configure(EntityTypeBuilder<Vehicle> builder)
        {
            builder.ToTable("vehicles");

            builder.HasKey(v => v.Id);
            builder.Property(v => v.Id).HasColumnName("id");

            builder.Property(v => v.Year)
                .HasColumnName("year")
                .IsRequired();

            builder.Property(v => v.Make)
                .HasColumnName("make")
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(v => v.Model)
                .HasColumnName("model")
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(v => v.Trim)
                .HasColumnName("trim")
                .HasMaxLength(100);

            builder.Property(v => v.EngineType)
                .HasColumnName("engine_type")
                .HasMaxLength(100);

            // Composite index for fast Year/Make/Model lookups (the most common query)
            builder.HasIndex(v => new { v.Year, v.Make, v.Model })
                .HasDatabaseName("ix_vehicles_year_make_model");
        }
    }
}

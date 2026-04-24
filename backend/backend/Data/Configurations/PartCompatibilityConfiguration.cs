using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations
{
    public class PartCompatibilityConfiguration : IEntityTypeConfiguration<PartCompatibility>
    {
        public void Configure(EntityTypeBuilder<PartCompatibility> builder)
        {
            builder.ToTable("part_compatibilities");

            // Composite primary key — no separate Id column needed
            builder.HasKey(pc => new { pc.PartId, pc.VehicleId });

            builder.Property(pc => pc.PartId).HasColumnName("part_id");
            builder.Property(pc => pc.VehicleId).HasColumnName("vehicle_id");

            builder.Property(pc => pc.Notes)
                .HasColumnName("notes")
                .HasMaxLength(300);

            // Relationship: Part → Compatibilities
            builder.HasOne(pc => pc.Part)
                .WithMany(p => p.Compatibilities)
                .HasForeignKey(pc => pc.PartId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relationship: Vehicle → Compatibilities
            builder.HasOne(pc => pc.Vehicle)
                .WithMany(v => v.Compatibilities)
                .HasForeignKey(pc => pc.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}

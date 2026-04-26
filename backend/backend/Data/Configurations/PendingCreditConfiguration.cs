using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations
{
    public class PendingCreditConfiguration : IEntityTypeConfiguration<PendingCredit>
    {
        public void Configure(EntityTypeBuilder<PendingCredit> builder)
        {
            builder.ToTable("pending_credits");

            builder.HasKey(pc => pc.Id);
            builder.Property(pc => pc.Id).HasColumnName("id");

            builder.Property(pc => pc.UserId).HasColumnName("user_id");
            builder.Property(pc => pc.Amount).HasColumnName("amount").HasPrecision(18, 2);
            builder.Property(pc => pc.Description).HasColumnName("description").HasMaxLength(255);
            builder.Property(pc => pc.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("Pending");
            builder.Property(pc => pc.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.Property(pc => pc.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Relationship
            builder.HasOne(pc => pc.User)
                .WithMany() // We can add a collection to User later if needed
                .HasForeignKey(pc => pc.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}

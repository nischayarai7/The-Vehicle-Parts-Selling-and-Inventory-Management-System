using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations
{
    public class OrderConfiguration : IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.ToTable("orders");

            builder.HasKey(o => o.Id);
            builder.Property(o => o.Id).HasColumnName("id");

            builder.Property(o => o.OrderNumber)
                .HasColumnName("order_number")
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(o => o.UserId)
                .HasColumnName("user_id");

            builder.Property(o => o.Status)
                .HasColumnName("status")
                .HasMaxLength(20)
                .HasDefaultValue("Pending");

            builder.Property(o => o.TotalAmount)
                .HasColumnName("total_amount")
                .HasPrecision(10, 2);

            builder.Property(o => o.ShippingAddress)
                .HasColumnName("shipping_address")
                .HasMaxLength(500);

            builder.Property(o => o.Notes)
                .HasColumnName("notes")
                .HasMaxLength(500);

            builder.Property(o => o.CreatedAt)
                .HasColumnName("created_at")
                .HasDefaultValueSql("NOW()");

            builder.Property(o => o.UpdatedAt)
                .HasColumnName("updated_at")
                .HasDefaultValueSql("NOW()");

            builder.HasIndex(o => o.OrderNumber)
                .IsUnique()
                .HasDatabaseName("ix_orders_order_number");

            builder.HasIndex(o => o.UserId)
                .HasDatabaseName("ix_orders_user_id");

            // Relationship: Order belongs to User
            builder.HasOne(o => o.User)
                .WithMany()
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}

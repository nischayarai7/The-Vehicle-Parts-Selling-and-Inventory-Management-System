using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace backend.Data.Configurations
{
    public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
    {
        public void Configure(EntityTypeBuilder<OrderItem> builder)
        {
            builder.ToTable("order_items");

            builder.HasKey(oi => oi.Id);
            builder.Property(oi => oi.Id).HasColumnName("id");

            builder.Property(oi => oi.OrderId).HasColumnName("order_id");
            builder.Property(oi => oi.PartId).HasColumnName("part_id");

            builder.Property(oi => oi.Quantity)
                .HasColumnName("quantity")
                .IsRequired();

            builder.Property(oi => oi.UnitPrice)
                .HasColumnName("unit_price")
                .HasPrecision(10, 2)
                .IsRequired();

            // Relationship: OrderItem belongs to Order
            builder.HasOne(oi => oi.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relationship: OrderItem references Part (Restrict to preserve history)
            builder.HasOne(oi => oi.Part)
                .WithMany(p => p.OrderItems)
                .HasForeignKey(oi => oi.PartId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}

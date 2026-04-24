namespace backend.Models
{
    /// <summary>
    /// Represents a customer's purchase order.
    /// </summary>
    public class Order
    {
        public int Id { get; set; }

        /// <summary>Human-readable order reference, e.g., "ORD-20260403-0001".</summary>
        public string OrderNumber { get; set; } = string.Empty;

        public int UserId { get; set; }

        /// <summary>e.g., "Pending", "Processing", "Shipped", "Delivered", "Cancelled".</summary>
        public string Status { get; set; } = "Pending";

        public decimal TotalAmount { get; set; }
        public string? ShippingAddress { get; set; }
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation
        public User User { get; set; } = null!;
        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}

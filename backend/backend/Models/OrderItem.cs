namespace backend.Models
{
    /// <summary>
    /// A single line item within an Order (one Part, its quantity, and the price at time of purchase).
    /// Price is stored here (not read from Part) to preserve history even if the Part's price changes.
    /// </summary>
    public class OrderItem
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int PartId { get; set; }
        public int Quantity { get; set; }

        /// <summary>Price captured at the moment of purchase — immutable.</summary>
        public decimal UnitPrice { get; set; }

        // Navigation
        public Order Order { get; set; } = null!;
        public Part Part { get; set; } = null!;
    }
}

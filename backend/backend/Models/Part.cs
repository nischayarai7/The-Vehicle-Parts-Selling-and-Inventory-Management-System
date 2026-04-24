namespace backend.Models
{
    /// <summary>
    /// The core inventory item — a vehicle part for sale.
    /// </summary>
    public class Part
    {
        public int Id { get; set; }

        /// <summary>OEM or aftermarket part number (e.g., "TY-BR-4523").</summary>
        public string PartNumber { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }

        /// <summary>Selling price in NPR (or configured currency).</summary>
        public decimal Price { get; set; }

        /// <summary>Number of units currently in stock.</summary>
        public int StockQuantity { get; set; }

        /// <summary>Stock level that triggers a low-stock warning.</summary>
        public int ReorderLevel { get; set; } = 5;

        /// <summary>e.g., "New", "Used", "Refurbished".</summary>
        public string Condition { get; set; } = "New";

        public string? Brand { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Foreign key
        public int CategoryId { get; set; }

        // Navigation
        public Category Category { get; set; } = null!;
        public ICollection<PartCompatibility> Compatibilities { get; set; } = new List<PartCompatibility>();
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}

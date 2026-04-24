namespace backend.DTOs.Part
{
    /// <summary>
    /// Read-only response shape for a Part.
    /// Includes flattened category info so the client avoids extra round-trips.
    /// </summary>
    public class PartResponseDto
    {
        public int Id { get; set; }
        public string PartNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int ReorderLevel { get; set; }
        public bool IsLowStock => StockQuantity <= ReorderLevel;
        public string Condition { get; set; } = string.Empty;
        public string? Brand { get; set; }
        public bool IsActive { get; set; }

        // Flattened category — avoids nesting complexity on the frontend
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

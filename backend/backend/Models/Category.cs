namespace backend.Models
{
    /// <summary>
    /// Represents a top-level grouping for parts (e.g., Engine, Brakes, Suspension).
    /// </summary>
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }

        // Navigation
        public ICollection<Part> Parts { get; set; } = new List<Part>();
    }
}

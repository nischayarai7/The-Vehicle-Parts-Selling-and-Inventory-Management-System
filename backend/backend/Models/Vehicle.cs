namespace backend.Models
{
    /// <summary>
    /// Represents a specific vehicle (Year + Make + Model) for fitment/compatibility checks.
    /// </summary>
    public class Vehicle
    {
        public int Id { get; set; }

        /// <summary>e.g., 2018</summary>
        public int Year { get; set; }

        /// <summary>e.g., "Toyota"</summary>
        public string Make { get; set; } = string.Empty;

        /// <summary>e.g., "Camry"</summary>
        public string Model { get; set; } = string.Empty;

        /// <summary>e.g., "LE", "XSE" — optional trim level.</summary>
        public string? Trim { get; set; }

        /// <summary>e.g., "2.5L I4", "3.5L V6"</summary>
        public string? EngineType { get; set; }

        // Navigation
        public ICollection<PartCompatibility> Compatibilities { get; set; } = new List<PartCompatibility>();
    }
}

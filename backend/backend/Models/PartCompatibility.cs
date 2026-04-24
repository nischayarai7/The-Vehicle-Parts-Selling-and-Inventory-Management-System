namespace backend.Models
{
    /// <summary>
    /// Join table — links a Part to the Vehicles it is compatible with (many-to-many).
    /// </summary>
    public class PartCompatibility
    {
        public int PartId { get; set; }
        public int VehicleId { get; set; }

        /// <summary>Optional note, e.g., "Front axle only".</summary>
        public string? Notes { get; set; }

        // Navigation
        public Part Part { get; set; } = null!;
        public Vehicle Vehicle { get; set; } = null!;
    }
}

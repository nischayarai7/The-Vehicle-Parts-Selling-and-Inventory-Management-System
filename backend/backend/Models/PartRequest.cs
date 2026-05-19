using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class PartRequest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [Required]
        [MaxLength(200)]
        public string PartName { get; set; } = null!;

        [MaxLength(100)]
        public string? PartNumber { get; set; }

        [MaxLength(500)]
        public string? VehicleDetails { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        public int Quantity { get; set; } = 1;

        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Sourced, Unavailable

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("CustomerId")]
        public User Customer { get; set; } = null!;
    }
}

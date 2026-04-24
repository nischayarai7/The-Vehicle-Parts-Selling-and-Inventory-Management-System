using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Part
{
    /// <summary>Request body for updating an existing part.</summary>
    public class UpdatePartDto
    {
        [Required]
        [MaxLength(50)]
        public string PartNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than zero.")]
        public decimal Price { get; set; }

        [Range(0, int.MaxValue)]
        public int StockQuantity { get; set; }

        [Range(0, int.MaxValue)]
        public int ReorderLevel { get; set; }

        [MaxLength(20)]
        public string Condition { get; set; } = "New";

        [MaxLength(100)]
        public string? Brand { get; set; }

        [Required]
        public int CategoryId { get; set; }

        public bool IsActive { get; set; } = true;
    }
}

using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Category
{
    /// <summary>Request body for creating a new category.</summary>
    public class CreateCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }
    }
}

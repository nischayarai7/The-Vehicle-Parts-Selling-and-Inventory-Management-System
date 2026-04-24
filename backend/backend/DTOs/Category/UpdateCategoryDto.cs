using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Category
{
    /// <summary>Request body for updating an existing category.</summary>
    public class UpdateCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class PartReview
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PartId { get; set; }

        [Required]
        [Column("UserId")]
        public int CustomerId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("PartId")]
        public Part Part { get; set; } = null!;

        [ForeignKey("CustomerId")]
        public User Customer { get; set; } = null!;
    }
}

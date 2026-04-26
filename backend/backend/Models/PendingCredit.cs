using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    /// <summary>
    /// Tracks credits assigned to users that are awaiting approval or finalization.
    /// </summary>
    public class PendingCredit
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(255)]
        public string Description { get; set; } = string.Empty;

        /// <summary>e.g., "Pending", "Approved", "Rejected".</summary>
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
    }
}

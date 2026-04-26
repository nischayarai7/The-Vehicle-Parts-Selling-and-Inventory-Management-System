using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class PendingCreditDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserFullName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreatePendingCreditDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        [Range(0.01, 1000000)]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(255)]
        public string Description { get; set; } = string.Empty;
    }

    public class UpdatePendingCreditStatusDto
    {
        [Required]
        [RegularExpression("Approved|Rejected")]
        public string Status { get; set; } = string.Empty;
    }
}

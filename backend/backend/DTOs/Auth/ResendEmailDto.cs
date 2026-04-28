using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth
{
    public class ResendEmailDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}

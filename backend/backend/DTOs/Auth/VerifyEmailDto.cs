using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth
{
    public class VerifyEmailDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(6, MinimumLength = 6)]
        public string Token { get; set; } = string.Empty;
    }
}

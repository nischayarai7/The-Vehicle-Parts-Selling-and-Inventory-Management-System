using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Auth
{
    /// <summary>Request body for user login.</summary>
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}

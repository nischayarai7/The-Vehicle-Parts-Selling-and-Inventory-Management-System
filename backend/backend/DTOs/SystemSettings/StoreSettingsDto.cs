using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.SystemSettings
{
    public class StoreSettingsDto
    {
        [Required(ErrorMessage = "Store address is required")]
        public string Address { get; set; } = string.Empty;

        [Required(ErrorMessage = "Store phone is required")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Store email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Business hours are required")]
        public string BusinessHours { get; set; } = string.Empty;
    }
}

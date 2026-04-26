using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Staff
{
    public class RegisterCustomerDto
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        // Optional vehicle linking during registration
        public int? VehicleId { get; set; }
        
        [MaxLength(20)]
        public string? LicensePlate { get; set; }
        
        [MaxLength(50)]
        public string? VIN { get; set; }
        
        [MaxLength(30)]
        public string? Color { get; set; }
    }
}

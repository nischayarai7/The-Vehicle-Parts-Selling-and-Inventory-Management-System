using System;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Appointment
{
    public class CreateAppointmentDto
    {
        public int? VehicleId { get; set; }

        [Required]
        [MaxLength(100)]
        public string ServiceType { get; set; } = string.Empty;

        [Required]
        public DateTime AppointmentDate { get; set; }

        public string? Notes { get; set; }
    }
}

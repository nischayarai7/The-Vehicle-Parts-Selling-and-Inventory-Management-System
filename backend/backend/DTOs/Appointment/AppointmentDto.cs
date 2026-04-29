using System;

namespace backend.DTOs.Appointment
{
    public class AppointmentDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int? VehicleId { get; set; }
        public string? VehicleName { get; set; }
        public string ServiceType { get; set; } = string.Empty;
        public DateTime AppointmentDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

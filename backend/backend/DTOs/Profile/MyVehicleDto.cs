namespace backend.DTOs.Profile
{
    public class MyVehicleDto
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string? LicensePlate { get; set; }
        public string? VIN { get; set; }
        public string? Color { get; set; }
    }

    public class AddVehicleDto
    {
        public int VehicleId { get; set; }
        public string? LicensePlate { get; set; }
        public string? VIN { get; set; }
        public string? Color { get; set; }
    }
}

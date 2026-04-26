namespace backend.DTOs.Staff
{
    public class StaffCustomerListDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalOrders { get; set; }
    }

    public class StaffCustomerDetailsDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public List<CustomerVehicleDto> Vehicles { get; set; } = new();
        public List<CustomerOrderHistoryDto> RecentOrders { get; set; } = new();
    }

    public class CustomerVehicleDto
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public string? LicensePlate { get; set; }
        public string? VIN { get; set; }
        public string? Color { get; set; }
    }

    public class CustomerOrderHistoryDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

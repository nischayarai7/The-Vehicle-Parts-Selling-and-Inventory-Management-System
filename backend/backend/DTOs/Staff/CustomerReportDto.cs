namespace backend.DTOs.Staff
{
    public class CustomerReportDto
    {
        public List<ReportCustomerInfo> Regulars { get; set; } = new List<ReportCustomerInfo>();
        public List<ReportCustomerInfo> HighSpenders { get; set; } = new List<ReportCustomerInfo>();
    }

    public class ReportCustomerInfo
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int OrderCount { get; set; }
        public decimal TotalSpent { get; set; }
    }
}

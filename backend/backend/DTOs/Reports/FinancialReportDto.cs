using System;
using System.Collections.Generic;

namespace backend.DTOs.Reports
{
    public class FinancialReportDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetProfit { get; set; }
        public int TotalOrders { get; set; }
        public int TotalPurchaseInvoices { get; set; }
        public decimal AverageOrderValue { get; set; }
        public List<PeriodicBreakdownItem> PeriodicBreakdown { get; set; } = new();
        public List<TopProductItem> TopSellingProducts { get; set; } = new();
        public List<TopExpenseItem> TopExpenses { get; set; } = new();
    }

    public class PeriodicBreakdownItem
    {
        public string PeriodLabel { get; set; } = string.Empty; // e.g. "Hour 08", "Monday", "Day 15", "May"
        public decimal Revenue { get; set; }
        public decimal Expenses { get; set; }
    }

    public class TopProductItem
    {
        public string PartName { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class TopExpenseItem
    {
        public string PartName { get; set; } = string.Empty;
        public int QuantityPurchased { get; set; }
        public decimal TotalCost { get; set; }
    }
}

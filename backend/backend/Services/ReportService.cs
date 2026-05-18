using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs.Reports;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _context;

        public ReportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<FinancialReportDto> GetFinancialReportAsync(string range, DateTime? anchorDate)
        {
            var date = anchorDate.HasValue 
                ? DateTime.SpecifyKind(anchorDate.Value, DateTimeKind.Utc) 
                : DateTime.UtcNow;
            DateTime startDate;
            DateTime endDate;

            // 1. Resolve exact date ranges dynamically (no hardcoding)
            switch (range.ToLower())
            {
                case "daily":
                    startDate = new DateTime(date.Year, date.Month, date.Day, 0, 0, 0, DateTimeKind.Utc);
                    endDate = startDate.AddDays(1).AddTicks(-1);
                    break;

                case "weekly":
                    // Start of the week: Sunday
                    int diff = (7 + (date.DayOfWeek - DayOfWeek.Sunday)) % 7;
                    var baseDate = new DateTime(date.Year, date.Month, date.Day, 0, 0, 0, DateTimeKind.Utc);
                    startDate = baseDate.AddDays(-1 * diff);
                    endDate = startDate.AddDays(7).AddTicks(-1);
                    break;

                case "monthly":
                    startDate = new DateTime(date.Year, date.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                    endDate = startDate.AddMonths(1).AddTicks(-1);
                    break;

                case "yearly":
                    startDate = new DateTime(date.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                    endDate = startDate.AddYears(1).AddTicks(-1);
                    break;

                default:
                    // Fallback to monthly
                    startDate = new DateTime(date.Year, date.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                    endDate = startDate.AddMonths(1).AddTicks(-1);
                    range = "monthly";
                    break;
            }

            // PostgreSQL requires UTC Kind for timestamptz columns
            startDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
            endDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);

            // 2. Fetch Orders & Invoices in target range
            var orders = await _context.Orders
                .Where(o => o.Status != "Cancelled" && o.CreatedAt >= startDate && o.CreatedAt <= endDate)
                .Include(o => o.Items)
                .ThenInclude(i => i.Part)
                .ToListAsync();

            var purchaseInvoices = await _context.PurchaseInvoices
                .Where(pi => pi.InvoiceDate >= startDate && pi.InvoiceDate <= endDate)
                .Include(pi => pi.Items)
                .ThenInclude(i => i.Part)
                .ToListAsync();

            // 3. Compute Basic Aggregate Metrics
            decimal totalRevenue = orders.Sum(o => o.TotalAmount);
            decimal totalExpenses = purchaseInvoices.Sum(pi => pi.TotalAmount);
            decimal netProfit = totalRevenue - totalExpenses;
            int totalOrdersCount = orders.Count;
            int totalInvoicesCount = purchaseInvoices.Count;
            decimal averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

            // 4. Generate Periodic Timeline Breakdowns (Dynamic Buckets)
            var periodicBreakdown = new List<PeriodicBreakdownItem>();

            if (range.ToLower() == "daily")
            {
                // Buckets by Hour
                for (int h = 0; h < 24; h++)
                {
                    var hourLabel = $"{h:D2}:00";
                    var rev = orders.Where(o => o.CreatedAt.Hour == h).Sum(o => o.TotalAmount);
                    var exp = purchaseInvoices.Where(pi => pi.InvoiceDate.Hour == h).Sum(pi => pi.TotalAmount);
                    periodicBreakdown.Add(new PeriodicBreakdownItem { PeriodLabel = hourLabel, Revenue = rev, Expenses = exp });
                }
            }
            else if (range.ToLower() == "weekly")
            {
                // Buckets by Day of Week
                string[] days = { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };
                for (int d = 0; d < 7; d++)
                {
                    var targetDay = (DayOfWeek)d;
                    var rev = orders.Where(o => o.CreatedAt.DayOfWeek == targetDay).Sum(o => o.TotalAmount);
                    var exp = purchaseInvoices.Where(pi => pi.InvoiceDate.DayOfWeek == targetDay).Sum(pi => pi.TotalAmount);
                    periodicBreakdown.Add(new PeriodicBreakdownItem { PeriodLabel = days[d], Revenue = rev, Expenses = exp });
                }
            }
            else if (range.ToLower() == "monthly")
            {
                // Buckets by Day of Month
                int daysInMonth = DateTime.DaysInMonth(startDate.Year, startDate.Month);
                for (int d = 1; d <= daysInMonth; d++)
                {
                    var rev = orders.Where(o => o.CreatedAt.Day == d).Sum(o => o.TotalAmount);
                    var exp = purchaseInvoices.Where(pi => pi.InvoiceDate.Day == d).Sum(pi => pi.TotalAmount);
                    periodicBreakdown.Add(new PeriodicBreakdownItem { PeriodLabel = $"Day {d:D2}", Revenue = rev, Expenses = exp });
                }
            }
            else if (range.ToLower() == "yearly")
            {
                // Buckets by Month
                string[] months = { "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" };
                for (int m = 1; m <= 12; m++)
                {
                    var rev = orders.Where(o => o.CreatedAt.Month == m).Sum(o => o.TotalAmount);
                    var exp = purchaseInvoices.Where(pi => pi.InvoiceDate.Month == m).Sum(pi => pi.TotalAmount);
                    periodicBreakdown.Add(new PeriodicBreakdownItem { PeriodLabel = months[m - 1], Revenue = rev, Expenses = exp });
                }
            }

            // 5. Aggregate Top-Selling Products (Part groupings)
            var topSellingProducts = orders
                .SelectMany(o => o.Items)
                .GroupBy(i => i.Part?.Name ?? "Unknown Product")
                .Select(g => new TopProductItem
                {
                    PartName = g.Key,
                    QuantitySold = g.Sum(i => i.Quantity),
                    TotalRevenue = g.Sum(i => i.Quantity * i.UnitPrice)
                })
                .OrderByDescending(x => x.QuantitySold)
                .Take(5)
                .ToList();

            // 6. Aggregate Top Expenses (Vendor items purchase costs)
            var topExpenses = purchaseInvoices
                .SelectMany(pi => pi.Items)
                .GroupBy(i => i.Part?.Name ?? "Unknown Product")
                .Select(g => new TopExpenseItem
                {
                    PartName = g.Key,
                    QuantityPurchased = g.Sum(i => i.Quantity),
                    TotalCost = g.Sum(i => i.Subtotal)
                })
                .OrderByDescending(x => x.TotalCost)
                .Take(5)
                .ToList();

            // 7. Map to DTO and Return
            return new FinancialReportDto
            {
                StartDate = startDate,
                EndDate = endDate,
                TotalRevenue = totalRevenue,
                TotalExpenses = totalExpenses,
                NetProfit = netProfit,
                TotalOrders = totalOrdersCount,
                TotalPurchaseInvoices = totalInvoicesCount,
                AverageOrderValue = averageOrderValue,
                PeriodicBreakdown = periodicBreakdown,
                TopSellingProducts = topSellingProducts,
                TopExpenses = topExpenses
            };
        }
    }
}

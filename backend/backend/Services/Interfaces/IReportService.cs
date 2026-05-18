using System;
using System.Threading.Tasks;
using backend.DTOs.Reports;

namespace backend.Services.Interfaces
{
    public interface IReportService
    {
        Task<FinancialReportDto> GetFinancialReportAsync(string range, DateTime? anchorDate);
    }
}

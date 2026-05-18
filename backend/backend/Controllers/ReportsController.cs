using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Common;
using backend.Middleware;
using backend.Services.Interfaces;
using backend.DTOs.Reports;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        // ── GET /api/reports/financial ───────────────────────────────────────────
        [HttpGet("financial")]
        public async Task<IActionResult> GetFinancialReport([FromQuery] string range = "monthly", [FromQuery] DateTime? date = null)
        {
            try
            {
                if (string.IsNullOrEmpty(range))
                {
                    range = "monthly";
                }

                var report = await _reportService.GetFinancialReportAsync(range, date);
                return Ok(ApiResponse<FinancialReportDto>.Ok(report, "Financial report retrieved successfully"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse.Fail(ex.Message));
            }
        }
    }
}

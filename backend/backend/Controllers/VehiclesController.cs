using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Common;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VehiclesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VehiclesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetVehicles()
        {
            // Returns a flat list of vehicles for frontend dropdowns
            var vehicles = await _context.Vehicles
                .Select(v => new {
                    v.Id,
                    v.Make,
                    v.Model,
                    v.Year,
                    v.Trim,
                    DisplayName = $"{v.Year} {v.Make} {v.Model} {v.Trim}".Trim()
                })
                .OrderBy(v => v.Make)
                .ThenBy(v => v.Model)
                .ThenByDescending(v => v.Year)
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(vehicles));
        }
    }
}

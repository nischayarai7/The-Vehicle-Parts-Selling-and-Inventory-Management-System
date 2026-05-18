using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Common;
using backend.Models;

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
                    v.EngineType,
                    DisplayName = $"{v.Year} {v.Make} {v.Model} {v.Trim}".Trim()
                })
                .OrderBy(v => v.Make)
                .ThenBy(v => v.Model)
                .ThenByDescending(v => v.Year)
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(vehicles));
        }

        [HttpPost]
        public async Task<IActionResult> AddVehicle([FromBody] CreateVehicleDto dto)
        {
            if (dto == null) return BadRequest(ApiResponse.Fail("Invalid vehicle data."));
            if (string.IsNullOrWhiteSpace(dto.Make)) return BadRequest(ApiResponse.Fail("Vehicle Make is required."));
            if (string.IsNullOrWhiteSpace(dto.Model)) return BadRequest(ApiResponse.Fail("Vehicle Model is required."));
            if (dto.Year < 1900 || dto.Year > DateTime.UtcNow.Year + 2) return BadRequest(ApiResponse.Fail("Invalid vehicle year."));

            // Check if vehicle already exists
            var exists = await _context.Vehicles.AnyAsync(v => 
                v.Make.ToLower() == dto.Make.ToLower() && 
                v.Model.ToLower() == dto.Model.ToLower() && 
                v.Year == dto.Year && 
                (v.Trim ?? "").ToLower() == (dto.Trim ?? "").ToLower());
            if (exists)
            {
                return BadRequest(ApiResponse.Fail("This vehicle model configuration already exists in the system."));
            }

            var vehicle = new Vehicle
            {
                Make = dto.Make,
                Model = dto.Model,
                Year = dto.Year,
                Trim = dto.Trim,
                EngineType = dto.EngineType
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(vehicle));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null)
            {
                return NotFound(ApiResponse.Fail("Vehicle not found."));
            }

            // Remove compatibility links first to avoid foreign key constraint violations
            var compatibilities = await _context.PartCompatibilities.Where(pc => pc.VehicleId == id).ToListAsync();
            if (compatibilities.Any())
            {
                _context.PartCompatibilities.RemoveRange(compatibilities);
            }

            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Ok("Vehicle deleted successfully."));
        }
    }

    public class CreateVehicleDto
    {
        public int Year { get; set; }
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string? Trim { get; set; }
        public string? EngineType { get; set; }
    }
}

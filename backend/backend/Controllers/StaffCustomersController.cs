using backend.Data;
using backend.DTOs.Staff;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff")]
    public class StaffCustomersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StaffCustomersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StaffCustomerListDto>>> GetCustomers()
        {
            var customerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Customer");
            if (customerRole == null) return Ok(new { success = true, data = new List<StaffCustomerListDto>() });

            var customers = await _context.Users
                .Where(u => u.UserRoles.Any(ur => ur.RoleId == customerRole.Id))
                .Select(u => new StaffCustomerListDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    CreatedAt = u.CreatedAt,
                    TotalOrders = u.Orders.Count
                })
                .ToListAsync();

            return Ok(new { success = true, data = customers });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StaffCustomerDetailsDto>> GetCustomerDetails(int id)
        {
            var user = await _context.Users
                .Include(u => u.CustomerVehicles)
                    .ThenInclude(cv => cv.Vehicle)
                .Include(u => u.Orders)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound("Customer not found.");

            var details = new StaffCustomerDetailsDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                CreatedAt = user.CreatedAt,
                Vehicles = user.CustomerVehicles.Select(cv => new CustomerVehicleDto
                {
                    Id = cv.Id,
                    VehicleId = cv.VehicleId,
                    VehicleName = $"{cv.Vehicle.Year} {cv.Vehicle.Make} {cv.Vehicle.Model} {cv.Vehicle.Trim}".Trim(),
                    LicensePlate = cv.LicensePlate,
                    VIN = cv.VIN,
                    Color = cv.Color
                }).ToList(),
                RecentOrders = user.Orders.OrderByDescending(o => o.CreatedAt).Select(o => new CustomerOrderHistoryDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    Status = o.Status,
                    TotalAmount = o.TotalAmount,
                    CreatedAt = o.CreatedAt
                }).ToList()
            };

            return Ok(new { success = true, data = details });
        }

        [HttpGet("vehicles")]
        public async Task<ActionResult> GetAvailableVehicles()
        {
            var vehicles = await _context.Vehicles
                .Select(v => new {
                    v.Id,
                    Name = $"{v.Year} {v.Make} {v.Model} {v.Trim}".Trim()
                })
                .ToListAsync();

            return Ok(new { success = true, data = vehicles });
        }

        [HttpPost("register")]
        public async Task<ActionResult> RegisterCustomer([FromBody] RegisterCustomerDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest(new { success = false, message = "Email is already in use." });
            }

            if (!string.IsNullOrEmpty(dto.LicensePlate))
            {
                if (await _context.CustomerVehicles.AnyAsync(cv => cv.LicensePlate == dto.LicensePlate))
                {
                    return BadRequest(new { success = false, message = "A vehicle with this license plate is already registered." });
                }
            }

            var customerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Customer");
            if (customerRole == null) return BadRequest(new { success = false, message = "Customer role not found." });

            // Create User
            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                // Staff sets a temporary password. Customer should ideally change it later.
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Welcome123!"), 
                CreatedAt = DateTime.UtcNow
            };

            user.UserRoles.Add(new UserRole { RoleId = customerRole.Id });

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Link vehicle if provided
            if (dto.VehicleId.HasValue)
            {
                var vehicleExists = await _context.Vehicles.AnyAsync(v => v.Id == dto.VehicleId.Value);
                if (vehicleExists)
                {
                    var customerVehicle = new CustomerVehicle
                    {
                        UserId = user.Id,
                        VehicleId = dto.VehicleId.Value,
                        LicensePlate = dto.LicensePlate,
                        VIN = dto.VIN,
                        Color = dto.Color
                    };
                    await _context.CustomerVehicles.AddAsync(customerVehicle);
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new { success = true, data = new { Message = "Customer registered successfully.", CustomerId = user.Id } });
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using backend.Data;
using backend.Common;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PartRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PartRequestsController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/PartRequests
        [HttpPost]
        public async Task<IActionResult> PostPartRequest(PartRequestDto requestDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Fail("Unauthorized access."));
            }

            var partRequest = new PartRequest
            {
                CustomerId = int.Parse(userId),
                PartName = requestDto.PartName,
                PartNumber = requestDto.PartNumber,
                VehicleDetails = requestDto.VehicleDetails,
                Notes = requestDto.Notes,
                Quantity = requestDto.Quantity,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.PartRequests.Add(partRequest);
            await _context.SaveChangesAsync();

            // Load customer details
            await _context.Entry(partRequest).Reference(r => r.Customer).LoadAsync();

            return Ok(ApiResponse<PartRequest>.Ok(partRequest, "Part request submitted successfully"));
        }

        // GET: api/PartRequests/my
        [HttpGet("my")]
        public async Task<IActionResult> GetMyPartRequests()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Fail("Unauthorized access."));
            }

            var customerId = int.Parse(userId);
            var requests = await _context.PartRequests
                .Where(r => r.CustomerId == customerId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<IEnumerable<PartRequest>>.Ok(requests));
        }

        // GET: api/PartRequests
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetPartRequests()
        {
            var requests = await _context.PartRequests
                .Include(r => r.Customer)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<IEnumerable<PartRequest>>.Ok(requests));
        }

        // GET: api/PartRequests/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPartRequest(int id)
        {
            var partRequest = await _context.PartRequests
                .Include(r => r.Customer)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (partRequest == null)
            {
                return NotFound(ApiResponse.Fail("Part request not found"));
            }

            return Ok(ApiResponse<PartRequest>.Ok(partRequest));
        }

        // PUT: api/PartRequests/5/status
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var partRequest = await _context.PartRequests.FindAsync(id);
            if (partRequest == null)
            {
                return NotFound(ApiResponse.Fail("Part request not found"));
            }

            partRequest.Status = status;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Ok("Part request status updated successfully"));
        }
    }

    public class PartRequestDto
    {
        [Required]
        public string PartName { get; set; } = null!;
        public string? PartNumber { get; set; }
        public string? VehicleDetails { get; set; }
        public string? Notes { get; set; }
        public int Quantity { get; set; } = 1;
    }
}

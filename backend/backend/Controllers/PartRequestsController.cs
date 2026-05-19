using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using backend.Data;
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
        public async Task<ActionResult<PartRequest>> PostPartRequest(PartRequestDto requestDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
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

            return CreatedAtAction("GetPartRequest", new { id = partRequest.Id }, partRequest);
        }

        // GET: api/PartRequests/my
        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<PartRequest>>> GetMyPartRequests()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var customerId = int.Parse(userId);
            return await _context.PartRequests
                .Where(r => r.CustomerId == customerId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        // GET: api/PartRequests
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<IEnumerable<PartRequest>>> GetPartRequests()
        {
            return await _context.PartRequests
                .Include(r => r.Customer)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        // GET: api/PartRequests/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PartRequest>> GetPartRequest(int id)
        {
            var partRequest = await _context.PartRequests.FindAsync(id);

            if (partRequest == null)
            {
                return NotFound();
            }

            return partRequest;
        }

        // PUT: api/PartRequests/5/status
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var partRequest = await _context.PartRequests.FindAsync(id);
            if (partRequest == null)
            {
                return NotFound();
            }

            partRequest.Status = status;
            await _context.SaveChangesAsync();

            return NoContent();
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

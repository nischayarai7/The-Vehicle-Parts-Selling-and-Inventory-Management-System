using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PendingCreditsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PendingCreditsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult> GetAllPendingCredits()
        {
            var credits = await _context.PendingCredits
                .Include(pc => pc.User)
                .OrderByDescending(pc => pc.CreatedAt)
                .Select(pc => new PendingCreditDto
                {
                    Id = pc.Id,
                    UserId = pc.UserId,
                    UserFullName = pc.User.FullName,
                    Amount = pc.Amount,
                    Description = pc.Description,
                    Status = pc.Status,
                    CreatedAt = pc.CreatedAt,
                    UpdatedAt = pc.UpdatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = credits });
        }

        [HttpGet("my")]
        [Authorize]
        public async Task<ActionResult> GetMyCredits()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            int userId = int.Parse(userIdClaim.Value);

            var credits = await _context.PendingCredits
                .Where(pc => pc.UserId == userId)
                .OrderByDescending(pc => pc.CreatedAt)
                .Select(pc => new PendingCreditDto
                {
                    Id = pc.Id,
                    UserId = pc.UserId,
                    UserFullName = pc.User.FullName,
                    Amount = pc.Amount,
                    Description = pc.Description,
                    Status = pc.Status,
                    CreatedAt = pc.CreatedAt,
                    UpdatedAt = pc.UpdatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = credits });
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult> CreatePendingCredit([FromBody] CreatePendingCreditDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return NotFound(new { success = false, message = "User not found." });

            var pendingCredit = new PendingCredit
            {
                UserId = dto.UserId,
                Amount = dto.Amount,
                Description = dto.Description,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.PendingCredits.AddAsync(pendingCredit);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Pending credit created successfully." });
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult> UpdateCreditStatus(int id, [FromBody] UpdatePendingCreditStatusDto dto)
        {
            var credit = await _context.PendingCredits.FindAsync(id);
            if (credit == null) return NotFound(new { success = false, message = "Credit record not found." });

            if (credit.Status != "Pending")
            {
                return BadRequest(new { success = false, message = "Only pending credits can have their status updated." });
            }

            credit.Status = dto.Status;
            credit.UpdatedAt = DateTime.UtcNow;

            _context.PendingCredits.Update(credit);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = $"Credit {dto.Status.ToLower()} successfully." });
        }
    }
}

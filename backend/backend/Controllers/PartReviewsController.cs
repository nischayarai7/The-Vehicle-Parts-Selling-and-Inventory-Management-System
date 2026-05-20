using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using backend.Data;
using backend.Common;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PartReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PartReviewsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/PartReviews/part/{partId}
        [HttpGet("part/{partId}")]
        public async Task<IActionResult> GetPartReviews(int partId)
        {
            var reviews = await _context.PartReviews
                .Include(r => r.Customer)
                .Where(r => r.PartId == partId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<IEnumerable<PartReview>>.Ok(reviews));
        }

        // GET: api/PartReviews/part/{partId}/my-last-review
        [HttpGet("part/{partId}/my-last-review")]
        [Authorize]
        public async Task<IActionResult> GetMyLastPartReview(int partId)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr))
            {
                return Unauthorized(ApiResponse.Fail("Unauthorized access."));
            }

            var userId = int.Parse(userIdStr);
            var lastReview = await _context.PartReviews
                .Where(r => r.PartId == partId && r.CustomerId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefaultAsync();

            return Ok(ApiResponse<PartReview?>.Ok(lastReview));
        }

        // POST: api/PartReviews
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> PostPartReview(PartReviewDto reviewDto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr))
            {
                return Unauthorized(ApiResponse.Fail("Unauthorized access."));
            }

            var userId = int.Parse(userIdStr);

            // Check if the part exists
            var partExists = await _context.Parts.AnyAsync(p => p.Id == reviewDto.PartId);
            if (!partExists)
            {
                return NotFound(ApiResponse.Fail("Part not found."));
            }

            // Check if user has already reviewed this specific part in the last 30 days
            var lastReview = await _context.PartReviews
                .Where(r => r.PartId == reviewDto.PartId && r.CustomerId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefaultAsync();

            if (lastReview != null)
            {
                var timePassed = DateTime.UtcNow - lastReview.CreatedAt;
                if (timePassed.TotalDays < 30)
                {
                    var remainingDays = (int)Math.Ceiling(30 - timePassed.TotalDays);
                    return BadRequest(ApiResponse.Fail($"You have already reviewed this part recently. You can review it again in {remainingDays} days."));
                }
            }

            var review = new PartReview
            {
                PartId = reviewDto.PartId,
                CustomerId = userId,
                Rating = reviewDto.Rating,
                Comment = reviewDto.Comment,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.PartReviews.Add(review);
            await _context.SaveChangesAsync();

            // Load customer details so frontend has access to customer name, etc. immediately
            await _context.Entry(review).Reference(r => r.Customer).LoadAsync();

            return Ok(ApiResponse<PartReview>.Ok(review, "Your review has been submitted successfully!"));
        }

        // PUT: api/PartReviews/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdatePartReview(int id, PartReviewUpdateDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr))
            {
                return Unauthorized(ApiResponse.Fail("Unauthorized access."));
            }

            var userId = int.Parse(userIdStr);

            var review = await _context.PartReviews.FindAsync(id);
            if (review == null)
            {
                return NotFound(ApiResponse.Fail("Review not found."));
            }

            if (review.CustomerId != userId)
            {
                return StatusCode(403, ApiResponse.Fail("You do not have permission to edit this review."));
            }

            review.Rating = dto.Rating;
            review.Comment = dto.Comment;
            review.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _context.Entry(review).Reference(r => r.Customer).LoadAsync();

            return Ok(ApiResponse<PartReview>.Ok(review, "Your review has been updated successfully."));
        }

        // DELETE: api/PartReviews/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeletePartReview(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr))
            {
                return Unauthorized(ApiResponse.Fail("Unauthorized access."));
            }

            var userId = int.Parse(userIdStr);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            var review = await _context.PartReviews.FindAsync(id);
            if (review == null)
            {
                return NotFound(ApiResponse.Fail("Review not found."));
            }

            // Allow owner OR Admin to delete
            if (review.CustomerId != userId && userRole != "Admin")
            {
                return StatusCode(403, ApiResponse.Fail("You do not have permission to delete this review."));
            }

            _context.PartReviews.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Ok("Your review has been successfully deleted."));
        }

        // GET: api/PartReviews/averages
        [HttpGet("averages")]
        public async Task<IActionResult> GetPartReviewAverages()
        {
            var averages = await _context.PartReviews
                .GroupBy(r => r.PartId)
                .Select(g => new PartReviewAverageDto
                {
                    PartId = g.Key,
                    AverageRating = Math.Round(g.Average(r => r.Rating), 1),
                    Count = g.Count()
                })
                .ToListAsync();

            return Ok(ApiResponse<IEnumerable<PartReviewAverageDto>>.Ok(averages));
        }
    }

    public class PartReviewAverageDto
    {
        public int PartId { get; set; }
        public double AverageRating { get; set; }
        public int Count { get; set; }
    }

    public class PartReviewDto
    {
        [Required]
        public int PartId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        public string? Comment { get; set; }
    }

    public class PartReviewUpdateDto
    {
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        public string? Comment { get; set; }
    }
}

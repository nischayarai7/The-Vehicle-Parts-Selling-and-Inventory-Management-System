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
    public class ServiceReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ServiceReviewsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ServiceReviews/my-last-review
        [HttpGet("my-last-review")]
        [Authorize]
        public async Task<IActionResult> GetMyLastReview()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Fail("Unauthorized access."));
            }

            var lastReview = await _context.ServiceReviews
                .Where(r => r.CustomerId == int.Parse(userId))
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefaultAsync();

            return Ok(ApiResponse<ServiceReview?>.Ok(lastReview));
        }

        // GET: api/ServiceReviews/admin
        [HttpGet("admin")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAdminServiceReviews()
        {
            var reviews = await _context.ServiceReviews
                .Include(r => r.Customer)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<IEnumerable<ServiceReview>>.Ok(reviews));
        }

        // POST: api/ServiceReviews
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> PostServiceReview(ServiceReviewDto reviewDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Fail("Unauthorized access."));
            }

            var customerId = int.Parse(userId);

            // Check if user has already reviewed in the last 30 days dynamically
            var lastReview = await _context.ServiceReviews
                .Where(r => r.CustomerId == customerId)
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefaultAsync();

            if (lastReview != null)
            {
                var timePassed = DateTime.UtcNow - lastReview.CreatedAt;
                if (timePassed.TotalDays < 30)
                {
                    var remainingDays = (int)Math.Ceiling(30 - timePassed.TotalDays);
                    return BadRequest(ApiResponse.Fail($"You have already submitted a review recently. You can submit another review in {remainingDays} days."));
                }
            }

            var review = new ServiceReview
            {
                CustomerId = customerId,
                AppointmentId = reviewDto.AppointmentId,
                Rating = reviewDto.Rating,
                Comment = reviewDto.Comment,
                IsVisible = false, // Set to false by default - needs admin review and approval
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ServiceReviews.Add(review);
            await _context.SaveChangesAsync();

            // Load customer details so frontend has access to customer name, etc. immediately
            await _context.Entry(review).Reference(r => r.Customer).LoadAsync();

            return Ok(ApiResponse<ServiceReview>.Ok(review, "Your review has been submitted successfully! It has been sent to our administration for review and approval."));
        }

        // GET: api/ServiceReviews
        [HttpGet]
        public async Task<IActionResult> GetServiceReviews()
        {
            var reviews = await _context.ServiceReviews
                .Include(r => r.Customer)
                .Where(r => r.IsVisible)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<IEnumerable<ServiceReview>>.Ok(reviews));
        }

        // GET: api/ServiceReviews/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetServiceReview(int id)
        {
            var review = await _context.ServiceReviews
                .Include(r => r.Customer)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (review == null)
            {
                return NotFound(ApiResponse.Fail("Review not found"));
            }

            return Ok(ApiResponse<ServiceReview>.Ok(review));
        }

        // PUT: api/ServiceReviews/5/visibility
        [HttpPut("{id}/visibility")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateVisibility(int id, [FromBody] bool isVisible)
        {
            var review = await _context.ServiceReviews.FindAsync(id);
            if (review == null)
            {
                return NotFound(ApiResponse.Fail("Review not found"));
            }

            review.IsVisible = isVisible;
            review.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var statusMessage = isVisible ? "Review approved and is now visible on the homepage." : "Review rejected/hidden from the homepage.";
            return Ok(ApiResponse.Ok(statusMessage));
        }

        // DELETE: api/ServiceReviews/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteServiceReview(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Fail("Unauthorized access."));
            }

            var review = await _context.ServiceReviews.FindAsync(id);
            if (review == null)
            {
                return NotFound(ApiResponse.Fail("Review not found."));
            }

            var customerId = int.Parse(userId);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            // Allow the owner of the review OR an Admin to delete it
            if (review.CustomerId != customerId && userRole != "Admin")
            {
                return StatusCode(403, ApiResponse.Fail("You do not have permission to delete this review."));
            }

            _context.ServiceReviews.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Ok("Your review has been successfully deleted."));
        }
    }

    public class ServiceReviewDto
    {
        public int? AppointmentId { get; set; }
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}

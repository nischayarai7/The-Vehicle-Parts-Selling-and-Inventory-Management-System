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

            var review = new ServiceReview
            {
                CustomerId = int.Parse(userId),
                AppointmentId = reviewDto.AppointmentId,
                Rating = reviewDto.Rating,
                Comment = reviewDto.Comment,
                IsVisible = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ServiceReviews.Add(review);
            await _context.SaveChangesAsync();

            // Load customer details so frontend has access to customer name, etc. immediately
            await _context.Entry(review).Reference(r => r.Customer).LoadAsync();

            return Ok(ApiResponse<ServiceReview>.Ok(review, "Review submitted successfully"));
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

            return Ok(ApiResponse.Ok("Review visibility updated successfully"));
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

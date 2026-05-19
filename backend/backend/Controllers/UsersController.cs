using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;
using backend.Data;
using backend.Models;
using backend.Common;
using backend.Middleware;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [HasPermission("users.manage")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Select(u => new {
                    u.Id,
                    u.FullName,
                    u.Email,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name),
                    u.CreatedAt
                })
                .ToListAsync();
            return Ok(ApiResponse<IEnumerable<object>>.Ok(users));
        }

        [HttpPost("{userId}/roles")]
        public async Task<IActionResult> AssignRoles(int userId, [FromBody] List<int> roleIds)
        {
            var user = await _context.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound(ApiResponse.Fail("User not found"));

            // Clear existing roles
            _context.UserRoles.RemoveRange(user.UserRoles);

            // Add new roles
            foreach (var rId in roleIds)
            {
                _context.UserRoles.Add(new UserRole { UserId = userId, RoleId = rId });
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse.Ok("Roles assigned successfully"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            // Get current user's email or ID from claims
            var currentUserEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            
            var userToDelete = await _context.Users.FindAsync(id);
            if (userToDelete == null) return NotFound(ApiResponse.Fail("User not found"));

            // Prevent self-deletion
            if (userToDelete.Email == currentUserEmail)
            {
                return BadRequest(ApiResponse.Fail("You cannot delete your own account"));
            }

            // Optional: Prevent deleting the system admin
            if (userToDelete.Email == "admin@6ix7even.com")
            {
                return BadRequest(ApiResponse.Fail("The primary system administrator cannot be deleted"));
            }

            // Prevent deleting the system-wide placeholder account
            if (userToDelete.Email == "deleted@6ix7even.com")
            {
                return BadRequest(ApiResponse.Fail("The system placeholder account cannot be deleted as it is required to preserve transaction history."));
            }

            // Resolve or dynamically create the system-wide "Deleted User" placeholder
            var deletedUserPlaceholder = await _context.Users.FirstOrDefaultAsync(u => u.Email == "deleted@6ix7even.com");
            if (deletedUserPlaceholder == null)
            {
                deletedUserPlaceholder = new User
                {
                    FullName = "Deleted User",
                    Email = "deleted@6ix7even.com",
                    PasswordHash = System.Guid.NewGuid().ToString(), // secure random hash
                    IsEmailVerified = true,
                    AuthProvider = "System"
                };
                await _context.Users.AddAsync(deletedUserPlaceholder);
                await _context.SaveChangesAsync();
            }

            // 1. Reassign orders purchased by this customer to the placeholder account to preserve store ledger history
            var ordersToReassign = await _context.Orders.Where(o => o.UserId == id).ToListAsync();
            foreach (var order in ordersToReassign)
            {
                order.UserId = deletedUserPlaceholder.Id;
            }

            // 2. Reassign orders created/managed by this user (if they had staff privileges) to the placeholder account
            var ordersCreatedToReassign = await _context.Orders.Where(o => o.CreatedById == id).ToListAsync();
            foreach (var order in ordersCreatedToReassign)
            {
                order.CreatedById = deletedUserPlaceholder.Id;
            }

            // 3. Remove User Roles association
            var userRoles = await _context.UserRoles.Where(ur => ur.UserId == id).ToListAsync();
            _context.UserRoles.RemoveRange(userRoles);

            // 4. Remove customer vehicles
            var customerVehicles = await _context.CustomerVehicles.Where(cv => cv.UserId == id).ToListAsync();
            _context.CustomerVehicles.RemoveRange(customerVehicles);

            // 5. Remove pending credits
            var pendingCredits = await _context.PendingCredits.Where(pc => pc.UserId == id).ToListAsync();
            _context.PendingCredits.RemoveRange(pendingCredits);

            // 6. Remove appointments
            var appointments = await _context.Appointments.Where(a => a.UserId == id).ToListAsync();
            _context.Appointments.RemoveRange(appointments);

            // 7. Remove service reviews
            var reviews = await _context.ServiceReviews.Where(sr => sr.CustomerId == id).ToListAsync();
            _context.ServiceReviews.RemoveRange(reviews);

            // 8. Remove part requests
            var partRequests = await _context.PartRequests.Where(pr => pr.CustomerId == id).ToListAsync();
            _context.PartRequests.RemoveRange(partRequests);

            // Save relationship adjustments
            await _context.SaveChangesAsync();

            // Finally, remove the actual user profile safely
            _context.Users.Remove(userToDelete);
            await _context.SaveChangesAsync();
            
            return Ok(ApiResponse.Ok("User deleted successfully"));
        }
    }
}

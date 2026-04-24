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

            _context.Users.Remove(userToDelete);
            await _context.SaveChangesAsync();
            
            return Ok(ApiResponse.Ok("User deleted successfully"));
        }
    }
}

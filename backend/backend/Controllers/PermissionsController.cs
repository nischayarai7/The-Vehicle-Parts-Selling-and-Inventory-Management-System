using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Common;
using backend.Middleware;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [HasPermission("roles.manage")] // Use existing role management permission
    public class PermissionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PermissionsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var permissions = await _context.Permissions.ToListAsync();
            return Ok(ApiResponse<IEnumerable<Permission>>.Ok(permissions));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Permission permission)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.Fail("Validation failed"));

            _context.Permissions.Add(permission);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<Permission>.Ok(permission, "Permission created successfully"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var permission = await _context.Permissions.FindAsync(id);
            if (permission == null) return NotFound(ApiResponse.Fail("Permission not found"));

            // Check if it's being used
            var isUsed = await _context.RolePermissions.AnyAsync(rp => rp.PermissionId == id);
            if (isUsed) return BadRequest(ApiResponse.Fail("Cannot delete a permission that is assigned to roles"));

            _context.Permissions.Remove(permission);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse.Ok("Permission deleted successfully"));
        }
    }
}

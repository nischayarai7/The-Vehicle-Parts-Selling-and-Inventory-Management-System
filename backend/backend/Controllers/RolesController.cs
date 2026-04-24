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
    [HasPermission("roles.manage")]
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RolesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var roles = await _context.Roles
                .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .ToListAsync();
            return Ok(ApiResponse<IEnumerable<AppRole>>.Ok(roles));
        }

        [HttpGet("permissions")]
        public async Task<IActionResult> GetPermissions()
        {
            var permissions = await _context.Permissions.ToListAsync();
            return Ok(ApiResponse<IEnumerable<Permission>>.Ok(permissions));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AppRole role)
        {
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<AppRole>.Ok(role));
        }

        [HttpPost("{roleId}/permissions")]
        public async Task<IActionResult> AssignPermissions(int roleId, [FromBody] List<int> permissionIds)
        {
            var role = await _context.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Id == roleId);
            if (role == null) return NotFound(ApiResponse.Fail("Role not found"));

            // Clear existing
            _context.RolePermissions.RemoveRange(role.RolePermissions);

            // Add new
            foreach (var pId in permissionIds)
            {
                _context.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = pId });
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse.Ok("Permissions assigned successfully"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var role = await _context.Roles
                .Include(r => r.UserRoles)
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return NotFound(ApiResponse.Fail("Role not found"));

            // Safety: Prevent deleting core system roles
            if (role.Name == "Admin" || role.Name == "Customer")
            {
                return BadRequest(ApiResponse.Fail("Cannot delete core system roles"));
            }

            // Safety: Check if users are assigned to this role
            if (role.UserRoles.Any())
            {
                return BadRequest(ApiResponse.Fail("Cannot delete a role that is assigned to users"));
            }

            // Remove associated permissions first (though CASCADE should handle it, explicit is safer)
            _context.RolePermissions.RemoveRange(role.RolePermissions);
            _context.Roles.Remove(role);
            
            await _context.SaveChangesAsync();
            return Ok(ApiResponse.Ok("Role deleted successfully"));
        }
    }
}

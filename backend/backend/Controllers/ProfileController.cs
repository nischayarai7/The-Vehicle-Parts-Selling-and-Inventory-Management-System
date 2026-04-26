using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using backend.Data;
using backend.Models;
using backend.DTOs.Profile;
using backend.Services;
using backend.Common;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ICloudinaryService _cloudinaryService;

        public ProfileController(AppDbContext context, ICloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var user = await _context.Users
                .Select(u => new { u.FullName, u.Email, u.AvatarUrl, u.CreatedAt })
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return NotFound(ApiResponse.Fail("User not found"));
            return Ok(ApiResponse<object>.Ok(user));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return NotFound(ApiResponse.Fail("User not found"));

            user.FullName = dto.FullName;
            if (!string.IsNullOrEmpty(dto.AvatarUrl))
            {
                user.AvatarUrl = dto.AvatarUrl;
            }

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.Ok(new { user.FullName, user.AvatarUrl }, "Profile updated successfully"));
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return NotFound(ApiResponse.Fail("User not found"));

            // Verify old password
            if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash))
            {
                return BadRequest(ApiResponse.Fail("Incorrect current password"));
            }

            // Hash and save new password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Ok("Password changed successfully"));
        }

        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            try 
            {
                var url = await _cloudinaryService.UploadImageAsync(file);
                if (url == null) return BadRequest(ApiResponse.Fail("Upload failed"));

                var email = User.FindFirst(ClaimTypes.Email)?.Value;
                if (!string.IsNullOrEmpty(email))
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
                    if (user != null)
                    {
                        user.AvatarUrl = url;
                        await _context.SaveChangesAsync();
                    }
                }

                return Ok(ApiResponse<object>.Ok(new { url }, "Image uploaded successfully"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse.Fail(ex.Message));
            }
        }
    }
}

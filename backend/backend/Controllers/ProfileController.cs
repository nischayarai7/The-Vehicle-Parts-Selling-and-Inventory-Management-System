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
        [HttpGet("vehicles")]
        public async Task<IActionResult> GetMyVehicles()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var user = await _context.Users
                .Include(u => u.CustomerVehicles)
                .ThenInclude(cv => cv.Vehicle)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return NotFound(ApiResponse.Fail("User not found"));

            var vehicles = user.CustomerVehicles.Select(cv => new MyVehicleDto
            {
                Id = cv.Id,
                VehicleId = cv.VehicleId,
                DisplayName = $"{cv.Vehicle.Year} {cv.Vehicle.Make} {cv.Vehicle.Model} {cv.Vehicle.Trim}".Trim(),
                LicensePlate = cv.LicensePlate,
                VIN = cv.VIN,
                Color = cv.Color
            }).ToList();

            return Ok(ApiResponse<List<MyVehicleDto>>.Ok(vehicles));
        }

        [HttpPost("vehicles")]
        public async Task<IActionResult> AddMyVehicle([FromBody] AddVehicleDto dto)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return NotFound(ApiResponse.Fail("User not found"));

            var vehicleExists = await _context.Vehicles.AnyAsync(v => v.Id == dto.VehicleId);
            if (!vehicleExists) return BadRequest(ApiResponse.Fail("Invalid vehicle selected."));

            var cv = new CustomerVehicle
            {
                UserId = user.Id,
                VehicleId = dto.VehicleId,
                LicensePlate = dto.LicensePlate,
                VIN = dto.VIN,
                Color = dto.Color
            };

            _context.CustomerVehicles.Add(cv);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Ok("Vehicle added to your garage successfully."));
        }

        [HttpDelete("vehicles/{id}")]
        public async Task<IActionResult> DeleteMyVehicle(int id)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return NotFound(ApiResponse.Fail("User not found"));

            var cv = await _context.CustomerVehicles.FirstOrDefaultAsync(v => v.Id == id && v.UserId == user.Id);
            if (cv == null) return NotFound(ApiResponse.Fail("Vehicle not found in your garage."));

            _context.CustomerVehicles.Remove(cv);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Ok("Vehicle removed from your garage."));
        }
    }
}

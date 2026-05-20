using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;
using backend.Common;
using Microsoft.AspNetCore.Authorization;
using backend.DTOs.SystemSettings;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SystemSettingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ICloudinaryService _cloudinaryService;

        public SystemSettingsController(AppDbContext context, ICloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        // ── GET /api/SystemSettings/wallpaper ──────────────────────────────────
        [HttpGet("wallpaper")]
        [AllowAnonymous]
        public async Task<IActionResult> GetWallpaper()
        {
            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == "system_wallpaper");

            var url = setting?.Value;
            return Ok(ApiResponse<object>.Ok(new { url }, "Wallpaper fetched successfully"));
        }

        // ── POST /api/SystemSettings/wallpaper/upload ──────────────────────────
        [HttpPost("wallpaper/upload")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadWallpaper(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(ApiResponse.Fail("No file was uploaded."));
                }

                var url = await _cloudinaryService.UploadImageAsync(file);
                if (url == null)
                {
                    return BadRequest(ApiResponse.Fail("Cloudinary image upload failed."));
                }

                var setting = await _context.SystemSettings
                    .FirstOrDefaultAsync(s => s.Key == "system_wallpaper");

                if (setting == null)
                {
                    setting = new SystemSetting { Key = "system_wallpaper", Value = url };
                    _context.SystemSettings.Add(setting);
                }
                else
                {
                    setting.Value = url;
                }

                await _context.SaveChangesAsync();
                return Ok(ApiResponse<object>.Ok(new { url }, "Wallpaper uploaded and applied successfully"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse.Fail(ex.Message));
            }
        }

        // ── DELETE /api/SystemSettings/wallpaper ───────────────────────────────
        [HttpDelete("wallpaper")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteWallpaper()
        {
            try
            {
                var setting = await _context.SystemSettings
                    .FirstOrDefaultAsync(s => s.Key == "system_wallpaper");

                if (setting != null)
                {
                    setting.Value = null;
                    await _context.SaveChangesAsync();
                }

                return Ok(ApiResponse.Ok("Wallpaper deleted and reverted to system default"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse.Fail(ex.Message));
            }
        }

        // ── GET /api/SystemSettings/store ──────────────────────────────────────
        [HttpGet("store")]
        [AllowAnonymous]
        public async Task<IActionResult> GetStoreSettings()
        {
            var keys = new[] { "store_address", "store_phone", "store_email", "store_hours" };
            var settings = await _context.SystemSettings
                .Where(s => keys.Contains(s.Key))
                .ToListAsync();

            var data = new
            {
                address = settings.FirstOrDefault(s => s.Key == "store_address")?.Value ?? "123 Auto Parts Blvd, Motor City, MI 48201",
                phone = settings.FirstOrDefault(s => s.Key == "store_phone")?.Value ?? "+1 (555) 123-4567",
                email = settings.FirstOrDefault(s => s.Key == "store_email")?.Value ?? "contact@6ix7even.com",
                businessHours = settings.FirstOrDefault(s => s.Key == "store_hours")?.Value ?? "Monday - Friday: 8AM - 6PM\\nSaturday: 9AM - 4PM"
            };

            return Ok(ApiResponse<object>.Ok(data, "Store settings fetched successfully"));
        }

        // ── POST /api/SystemSettings/store ─────────────────────────────────────
        [HttpPost("store")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStoreSettings([FromBody] StoreSettingsDto dto)
        {
            try
            {
                var keys = new[] { "store_address", "store_phone", "store_email", "store_hours" };
                var settings = await _context.SystemSettings
                    .Where(s => keys.Contains(s.Key))
                    .ToDictionaryAsync(s => s.Key);

                void UpdateOrAddSetting(string key, string value)
                {
                    if (settings.TryGetValue(key, out var setting))
                    {
                        setting.Value = value;
                    }
                    else
                    {
                        _context.SystemSettings.Add(new SystemSetting { Key = key, Value = value });
                    }
                }

                UpdateOrAddSetting("store_address", dto.Address);
                UpdateOrAddSetting("store_phone", dto.Phone);
                UpdateOrAddSetting("store_email", dto.Email);
                UpdateOrAddSetting("store_hours", dto.BusinessHours);

                await _context.SaveChangesAsync();
                return Ok(ApiResponse.Ok("Store settings updated successfully"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse.Fail(ex.Message));
            }
        }
    }
}

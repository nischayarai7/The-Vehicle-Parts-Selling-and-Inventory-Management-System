using backend.Common;
using backend.DTOs.Part;
using backend.Services.Interfaces;
using backend.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    /// <summary>
    /// REST endpoints for managing and browsing vehicle parts.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PartsController : ControllerBase
    {
        private readonly IPartService _partService;

        public PartsController(IPartService partService)
        {
            _partService = partService;
        }

        // ── GET /api/parts ───────────────────────────────────────────────────────
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var parts = await _partService.GetAllPartsAsync();
            return Ok(ApiResponse<IEnumerable<PartResponseDto>>.Ok(parts));
        }

        // ── GET /api/parts/{id} ──────────────────────────────────────────────────
        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            var part = await _partService.GetPartByIdAsync(id);
            return Ok(ApiResponse<PartResponseDto>.Ok(part));
        }

        // ── GET /api/parts/by-number/{partNumber} ────────────────────────────────
        [HttpGet("by-number/{partNumber}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByPartNumber(string partNumber)
        {
            var part = await _partService.GetPartByNumberAsync(partNumber);
            return Ok(ApiResponse<PartResponseDto>.Ok(part));
        }

        // ── GET /api/parts/by-category/{categoryId} ──────────────────────────────
        [HttpGet("by-category/{categoryId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var parts = await _partService.GetPartsByCategoryAsync(categoryId);
            return Ok(ApiResponse<IEnumerable<PartResponseDto>>.Ok(parts));
        }

        // ── GET /api/parts/search?keyword=brake ──────────────────────────────────
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> Search([FromQuery] string keyword)
        {
            var parts = await _partService.SearchPartsAsync(keyword);
            return Ok(ApiResponse<IEnumerable<PartResponseDto>>.Ok(parts));
        }

        // ── GET /api/parts/compatible/{vehicleId} ────────────────────────────────
        [HttpGet("compatible/{vehicleId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCompatible(int vehicleId)
        {
            var parts = await _partService.GetCompatiblePartsAsync(vehicleId);
            return Ok(ApiResponse<IEnumerable<PartResponseDto>>.Ok(parts));
        }

        // ── GET /api/parts/low-stock ─────────────────────────────────────────────
        /// <summary>Admin view: parts at or below their reorder level.</summary>
        [HttpGet("low-stock")]
        [HasPermission("parts.view")]
        public async Task<IActionResult> GetLowStock()
        {
            var parts = await _partService.GetLowStockPartsAsync();
            return Ok(ApiResponse<IEnumerable<PartResponseDto>>.Ok(parts));
        }

        // ── POST /api/parts ──────────────────────────────────────────────────────
        [HttpPost]
        [HasPermission("parts.create")]
        public async Task<IActionResult> Create([FromBody] CreatePartDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.Fail("Validation failed",
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));

            var created = await _partService.CreatePartAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id },
                ApiResponse<PartResponseDto>.Ok(created, "Part created successfully."));
        }

        // ── PUT /api/parts/{id} ──────────────────────────────────────────────────
        [HttpPut("{id:int}")]
        [HasPermission("parts.edit")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePartDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.Fail("Validation failed",
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));

            var updated = await _partService.UpdatePartAsync(id, dto);
            return Ok(ApiResponse<PartResponseDto>.Ok(updated, "Part updated successfully."));
        }

        // ── PATCH /api/parts/{id}/stock ──────────────────────────────────────────
        /// <summary>Updates only the stock quantity of a part.</summary>
        [HttpPatch("{id:int}/stock")]
        [HasPermission("parts.edit")]
        public async Task<IActionResult> UpdateStock(int id, [FromBody] int quantity)
        {
            var updated = await _partService.UpdateStockAsync(id, quantity);
            return Ok(ApiResponse<PartResponseDto>.Ok(updated, "Stock updated successfully."));
        }

        // ── DELETE /api/parts/{id} ───────────────────────────────────────────────
        [HttpDelete("{id:int}")]
        [HasPermission("parts.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            await _partService.DeletePartAsync(id);
            return Ok(ApiResponse.Ok("Part deleted successfully."));
        }
    }
}

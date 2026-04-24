using backend.Common;
using backend.DTOs.Category;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    /// <summary>
    /// REST endpoints for managing part categories.
    /// GET endpoints are public; POST/PUT/DELETE require authentication.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        // ── GET /api/categories ──────────────────────────────────────────────────
        /// <summary>Returns all categories (admin view — includes inactive).</summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _categoryService.GetAllCategoriesAsync();
            return Ok(ApiResponse<IEnumerable<CategoryResponseDto>>.Ok(categories));
        }

        // ── GET /api/categories/active ───────────────────────────────────────────
        /// <summary>Returns only active categories (for the storefront).</summary>
        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActive()
        {
            var categories = await _categoryService.GetActiveCategoriesAsync();
            return Ok(ApiResponse<IEnumerable<CategoryResponseDto>>.Ok(categories));
        }

        // ── GET /api/categories/{id} ─────────────────────────────────────────────
        /// <summary>Returns a single category by ID.</summary>
        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            // KeyNotFoundException thrown by service → caught by ExceptionMiddleware → 404
            var category = await _categoryService.GetCategoryByIdAsync(id);
            return Ok(ApiResponse<CategoryResponseDto>.Ok(category));
        }

        // ── POST /api/categories ─────────────────────────────────────────────────
        /// <summary>Creates a new category. Requires authentication.</summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.Fail("Validation failed",
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));

            var created = await _categoryService.CreateCategoryAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id },
                ApiResponse<CategoryResponseDto>.Ok(created, "Category created successfully."));
        }

        // ── PUT /api/categories/{id} ─────────────────────────────────────────────
        /// <summary>Updates an existing category. Requires authentication.</summary>
        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.Fail("Validation failed",
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));

            var updated = await _categoryService.UpdateCategoryAsync(id, dto);
            return Ok(ApiResponse<CategoryResponseDto>.Ok(updated, "Category updated successfully."));
        }

        // ── DELETE /api/categories/{id} ──────────────────────────────────────────
        /// <summary>Deletes a category. Requires authentication.</summary>
        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            await _categoryService.DeleteCategoryAsync(id);
            return Ok(ApiResponse.Ok("Category deleted successfully."));
        }
    }
}

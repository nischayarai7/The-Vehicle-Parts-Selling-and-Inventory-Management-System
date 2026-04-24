using backend.DTOs.Category;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;

namespace backend.Services
{
    /// <summary>
    /// Implements all business logic for Categories.
    /// Throws domain exceptions (KeyNotFoundException, InvalidOperationException)
    /// which the global ExceptionMiddleware catches and maps to HTTP responses.
    /// </summary>
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly ILogger<CategoryService> _logger;

        public CategoryService(ICategoryRepository categoryRepository, ILogger<CategoryService> logger)
        {
            _categoryRepository = categoryRepository;
            _logger = logger;
        }

        // ── Read operations ──────────────────────────────────────────────────────

        public async Task<IEnumerable<CategoryResponseDto>> GetAllCategoriesAsync()
        {
            var categories = await _categoryRepository.GetAllAsync();
            return categories.Select(MapToDto);
        }

        public async Task<IEnumerable<CategoryResponseDto>> GetActiveCategoriesAsync()
        {
            var categories = await _categoryRepository.GetActiveAsync();
            return categories.Select(MapToDto);
        }

        public async Task<CategoryResponseDto> GetCategoryByIdAsync(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Category with ID {id} was not found.");

            return MapToDto(category);
        }

        // ── Write operations ─────────────────────────────────────────────────────

        public async Task<CategoryResponseDto> CreateCategoryAsync(CreateCategoryDto dto)
        {
            // Business rule: category names must be unique
            if (await _categoryRepository.IsNameTakenAsync(dto.Name))
                throw new InvalidOperationException($"A category named '{dto.Name}' already exists.");

            var category = new Category
            {
                Name        = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                ImageUrl    = dto.ImageUrl?.Trim(),
                IsActive    = true
            };

            var created = await _categoryRepository.AddAsync(category);
            _logger.LogInformation("Category created: {Name} (ID: {Id})", created.Name, created.Id);

            return MapToDto(created);
        }

        public async Task<CategoryResponseDto> UpdateCategoryAsync(int id, UpdateCategoryDto dto)
        {
            var category = await _categoryRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Category with ID {id} was not found.");

            // Ensure the new name isn't taken by a DIFFERENT category
            if (await _categoryRepository.IsNameTakenAsync(dto.Name, excludeId: id))
                throw new InvalidOperationException($"A category named '{dto.Name}' already exists.");

            category.Name        = dto.Name.Trim();
            category.Description = dto.Description?.Trim();
            category.ImageUrl    = dto.ImageUrl?.Trim();
            category.IsActive    = dto.IsActive;

            await _categoryRepository.UpdateAsync(category);
            _logger.LogInformation("Category updated: {Name} (ID: {Id})", category.Name, category.Id);

            return MapToDto(category);
        }

        public async Task DeleteCategoryAsync(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Category with ID {id} was not found.");

            await _categoryRepository.DeleteAsync(category);
            _logger.LogInformation("Category deleted: {Name} (ID: {Id})", category.Name, category.Id);
        }

        // ── Mapping helper ───────────────────────────────────────────────────────

        private static CategoryResponseDto MapToDto(Category c) => new()
        {
            Id          = c.Id,
            Name        = c.Name,
            Description = c.Description,
            ImageUrl    = c.ImageUrl,
            IsActive    = c.IsActive,
            CreatedAt   = c.CreatedAt
        };
    }
}

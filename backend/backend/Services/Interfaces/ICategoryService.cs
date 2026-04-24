using backend.DTOs.Category;

namespace backend.Services.Interfaces
{
    /// <summary>
    /// Business logic contract for Categories.
    /// </summary>
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryResponseDto>> GetAllCategoriesAsync();
        Task<IEnumerable<CategoryResponseDto>> GetActiveCategoriesAsync();
        Task<CategoryResponseDto> GetCategoryByIdAsync(int id);
        Task<CategoryResponseDto> CreateCategoryAsync(CreateCategoryDto dto);
        Task<CategoryResponseDto> UpdateCategoryAsync(int id, UpdateCategoryDto dto);
        Task DeleteCategoryAsync(int id);
    }
}

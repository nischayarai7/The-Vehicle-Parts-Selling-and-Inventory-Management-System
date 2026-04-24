using backend.DTOs.Part;

namespace backend.Services.Interfaces
{
    /// <summary>
    /// Business logic contract for Parts.
    /// Controllers only call these methods — they never touch the repository directly.
    /// </summary>
    public interface IPartService
    {
        Task<IEnumerable<PartResponseDto>> GetAllPartsAsync();
        Task<PartResponseDto> GetPartByIdAsync(int id);
        Task<PartResponseDto> GetPartByNumberAsync(string partNumber);
        Task<IEnumerable<PartResponseDto>> GetPartsByCategoryAsync(int categoryId);
        Task<IEnumerable<PartResponseDto>> SearchPartsAsync(string keyword);
        Task<IEnumerable<PartResponseDto>> GetCompatiblePartsAsync(int vehicleId);
        Task<IEnumerable<PartResponseDto>> GetLowStockPartsAsync();
        Task<PartResponseDto> CreatePartAsync(CreatePartDto dto);
        Task<PartResponseDto> UpdatePartAsync(int id, UpdatePartDto dto);
        Task DeletePartAsync(int id);
        Task<PartResponseDto> UpdateStockAsync(int id, int quantity);
    }
}

using backend.Models;

namespace backend.Repositories.Interfaces
{
    /// <summary>
    /// Part-specific repository — extends the generic interface with
    /// domain-specific queries (e.g., searching by part number, category, vehicle).
    /// </summary>
    public interface IPartRepository : IRepository<Part>
    {
        Task<Part?> GetByPartNumberAsync(string partNumber);
        Task<IEnumerable<Part>> GetByCategoryAsync(int categoryId);
        Task<IEnumerable<Part>> GetLowStockPartsAsync();
        Task<IEnumerable<Part>> SearchAsync(string keyword);
        Task<IEnumerable<Part>> GetCompatiblePartsAsync(int vehicleId);
        Task<bool> IsPartNumberTakenAsync(string partNumber, int? excludeId = null);
    }
}

using backend.Models;

namespace backend.Repositories.Interfaces
{
    /// <summary>
    /// Category-specific repository — extends generic CRUD with name-based lookups.
    /// </summary>
    public interface ICategoryRepository : IRepository<Category>
    {
        Task<Category?> GetByNameAsync(string name);
        Task<IEnumerable<Category>> GetActiveAsync();
        Task<bool> IsNameTakenAsync(string name, int? excludeId = null);
    }
}

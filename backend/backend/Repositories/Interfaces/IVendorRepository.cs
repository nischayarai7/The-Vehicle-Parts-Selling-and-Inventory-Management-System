using backend.Models;

namespace backend.Repositories.Interfaces
{
    public interface IVendorRepository
    {
        Task<IEnumerable<Vendor>> GetAllAsync();
        Task<Vendor?> GetByIdAsync(int id);
        Task<Vendor> CreateAsync(Vendor vendor);
        Task UpdateAsync(Vendor vendor);
        Task DeleteAsync(int id);
    }
}

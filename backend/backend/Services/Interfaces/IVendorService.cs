using backend.DTOs.Vendor;

namespace backend.Services.Interfaces
{
    public interface IVendorService
    {
        Task<IEnumerable<VendorDto>> GetAllVendorsAsync();
        Task<VendorDto> GetVendorByIdAsync(int id);
        Task<VendorDto> CreateVendorAsync(CreateVendorDto dto);
        Task<VendorDto> UpdateVendorAsync(int id, UpdateVendorDto dto);
        Task DeleteVendorAsync(int id);
    }
}

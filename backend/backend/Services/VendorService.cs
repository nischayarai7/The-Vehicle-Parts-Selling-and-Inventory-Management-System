using backend.DTOs.Vendor;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;

namespace backend.Services
{
    public class VendorService : IVendorService
    {
        private readonly IVendorRepository _vendorRepository;
        private readonly ILogger<VendorService> _logger;

        public VendorService(IVendorRepository vendorRepository, ILogger<VendorService> logger)
        {
            _vendorRepository = vendorRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<VendorDto>> GetAllVendorsAsync()
        {
            var vendors = await _vendorRepository.GetAllAsync();
            return vendors.Select(MapToDto);
        }

        public async Task<VendorDto> GetVendorByIdAsync(int id)
        {
            var vendor = await _vendorRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Vendor with ID {id} was not found.");
            return MapToDto(vendor);
        }

        public async Task<VendorDto> CreateVendorAsync(CreateVendorDto dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.Email) && await _vendorRepository.ExistsByEmailAsync(dto.Email.Trim()))
                throw new InvalidOperationException("A vendor with this email already exists.");

            if (!string.IsNullOrWhiteSpace(dto.Phone) && await _vendorRepository.ExistsByPhoneAsync(dto.Phone.Trim()))
                throw new InvalidOperationException("A vendor with this phone number already exists.");

            var vendor = new Vendor
            {
                Name = dto.Name.Trim(),
                ContactPerson = dto.ContactPerson?.Trim(),
                Email = dto.Email?.Trim(),
                Phone = dto.Phone?.Trim(),
                Address = dto.Address?.Trim(),
                Description = dto.Description?.Trim(),
                IsActive = dto.IsActive
            };

            var created = await _vendorRepository.CreateAsync(vendor);
            _logger.LogInformation("Vendor created: {Name} (ID: {Id})", created.Name, created.Id);
            return MapToDto(created);
        }

        public async Task<VendorDto> UpdateVendorAsync(int id, UpdateVendorDto dto)
        {
            var vendor = await _vendorRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Vendor with ID {id} was not found.");

            if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email.Trim() != vendor.Email && await _vendorRepository.ExistsByEmailAsync(dto.Email.Trim()))
                throw new InvalidOperationException("A vendor with this email already exists.");

            if (!string.IsNullOrWhiteSpace(dto.Phone) && dto.Phone.Trim() != vendor.Phone && await _vendorRepository.ExistsByPhoneAsync(dto.Phone.Trim()))
                throw new InvalidOperationException("A vendor with this phone number already exists.");

            vendor.Name = dto.Name.Trim();
            vendor.ContactPerson = dto.ContactPerson?.Trim();
            vendor.Email = dto.Email?.Trim();
            vendor.Phone = dto.Phone?.Trim();
            vendor.Address = dto.Address?.Trim();
            vendor.Description = dto.Description?.Trim();
            vendor.IsActive = dto.IsActive;

            await _vendorRepository.UpdateAsync(vendor);
            _logger.LogInformation("Vendor updated: {Name} (ID: {Id})", vendor.Name, vendor.Id);
            return MapToDto(vendor);
        }

        public async Task DeleteVendorAsync(int id)
        {
            var vendor = await _vendorRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Vendor with ID {id} was not found.");

            await _vendorRepository.DeleteAsync(id);
            _logger.LogInformation("Vendor deleted: {Name} (ID: {Id})", vendor.Name, id);
        }

        private static VendorDto MapToDto(Vendor v) => new()
        {
            Id = v.Id,
            Name = v.Name,
            ContactPerson = v.ContactPerson,
            Email = v.Email,
            Phone = v.Phone,
            Address = v.Address,
            Description = v.Description,
            IsActive = v.IsActive,
            CreatedAt = v.CreatedAt,
            UpdatedAt = v.UpdatedAt
        };
    }
}

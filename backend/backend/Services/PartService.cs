using backend.DTOs.Part;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;

namespace backend.Services
{
    /// <summary>
    /// Implements all business logic for Parts — including stock management,
    /// search, and compatibility queries.
    /// </summary>
    public class PartService : IPartService
    {
        private readonly IPartRepository _partRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly ILogger<PartService> _logger;

        public PartService(
            IPartRepository partRepository,
            ICategoryRepository categoryRepository,
            ILogger<PartService> logger)
        {
            _partRepository     = partRepository;
            _categoryRepository = categoryRepository;
            _logger             = logger;
        }

        // ── Read operations ──────────────────────────────────────────────────────

        public async Task<IEnumerable<PartResponseDto>> GetAllPartsAsync()
        {
            var parts = await _partRepository.GetAllAsync();
            return parts.Select(MapToDto);
        }

        public async Task<PartResponseDto> GetPartByIdAsync(int id)
        {
            var part = await _partRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Part with ID {id} was not found.");

            return MapToDto(part);
        }

        public async Task<PartResponseDto> GetPartByNumberAsync(string partNumber)
        {
            var part = await _partRepository.GetByPartNumberAsync(partNumber)
                ?? throw new KeyNotFoundException($"Part number '{partNumber}' was not found.");

            return MapToDto(part);
        }

        public async Task<IEnumerable<PartResponseDto>> GetPartsByCategoryAsync(int categoryId)
        {
            // Validate category exists before querying parts
            var categoryExists = await _categoryRepository.ExistsAsync(c => c.Id == categoryId);
            if (!categoryExists)
                throw new KeyNotFoundException($"Category with ID {categoryId} was not found.");

            var parts = await _partRepository.GetByCategoryAsync(categoryId);
            return parts.Select(MapToDto);
        }

        public async Task<IEnumerable<PartResponseDto>> SearchPartsAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                throw new ArgumentException("Search keyword cannot be empty.");

            var parts = await _partRepository.SearchAsync(keyword.Trim());
            return parts.Select(MapToDto);
        }

        public async Task<IEnumerable<PartResponseDto>> GetCompatiblePartsAsync(int vehicleId)
        {
            var parts = await _partRepository.GetCompatiblePartsAsync(vehicleId);
            return parts.Select(MapToDto);
        }

        public async Task<IEnumerable<PartResponseDto>> GetLowStockPartsAsync()
        {
            var parts = await _partRepository.GetLowStockPartsAsync();
            return parts.Select(MapToDto);
        }

        // ── Write operations ─────────────────────────────────────────────────────

        public async Task<PartResponseDto> CreatePartAsync(CreatePartDto dto)
        {
            // Validate part number uniqueness
            if (await _partRepository.IsPartNumberTakenAsync(dto.PartNumber))
                throw new InvalidOperationException($"Part number '{dto.PartNumber}' is already in use.");

            // Validate the category exists
            var categoryExists = await _categoryRepository.ExistsAsync(c => c.Id == dto.CategoryId);
            if (!categoryExists)
                throw new KeyNotFoundException($"Category with ID {dto.CategoryId} was not found.");

            var part = new Part
            {
                PartNumber    = dto.PartNumber.Trim().ToUpper(),
                Name          = dto.Name.Trim(),
                Description   = dto.Description?.Trim(),
                ImageUrl      = dto.ImageUrl?.Trim(),
                Price         = dto.Price,
                StockQuantity = dto.StockQuantity,
                ReorderLevel  = dto.ReorderLevel,
                Condition     = dto.Condition,
                Brand         = dto.Brand?.Trim(),
                CategoryId    = dto.CategoryId,
                IsActive      = true
            };

            var created = await _partRepository.AddAsync(part);
            _logger.LogInformation("Part created: {PartNumber} — {Name} (ID: {Id})",
                created.PartNumber, created.Name, created.Id);

            // Reload with navigation properties for the response
            return MapToDto((await _partRepository.GetByIdAsync(created.Id))!);
        }

        public async Task<PartResponseDto> UpdatePartAsync(int id, UpdatePartDto dto)
        {
            var part = await _partRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Part with ID {id} was not found.");

            // Validate part number uniqueness excluding current record
            if (await _partRepository.IsPartNumberTakenAsync(dto.PartNumber, excludeId: id))
                throw new InvalidOperationException($"Part number '{dto.PartNumber}' is already in use.");

            // Validate the category exists
            var categoryExists = await _categoryRepository.ExistsAsync(c => c.Id == dto.CategoryId);
            if (!categoryExists)
                throw new KeyNotFoundException($"Category with ID {dto.CategoryId} was not found.");

            part.PartNumber    = dto.PartNumber.Trim().ToUpper();
            part.Name          = dto.Name.Trim();
            part.Description   = dto.Description?.Trim();
            part.ImageUrl      = dto.ImageUrl?.Trim();
            part.Price         = dto.Price;
            part.StockQuantity = dto.StockQuantity;
            part.ReorderLevel  = dto.ReorderLevel;
            part.Condition     = dto.Condition;
            part.Brand         = dto.Brand?.Trim();
            part.CategoryId    = dto.CategoryId;
            part.IsActive      = dto.IsActive;

            await _partRepository.UpdateAsync(part);
            _logger.LogInformation("Part updated: {PartNumber} (ID: {Id})", part.PartNumber, part.Id);

            return MapToDto(part);
        }

        public async Task DeletePartAsync(int id)
        {
            var part = await _partRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Part with ID {id} was not found.");

            await _partRepository.DeleteAsync(part);
            _logger.LogInformation("Part deleted: {PartNumber} (ID: {Id})", part.PartNumber, part.Id);
        }

        public async Task<PartResponseDto> UpdateStockAsync(int id, int quantity)
        {
            if (quantity < 0)
                throw new ArgumentException("Stock quantity cannot be negative.");

            var part = await _partRepository.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Part with ID {id} was not found.");

            part.StockQuantity = quantity;
            await _partRepository.UpdateAsync(part);

            _logger.LogInformation("Stock updated for Part {PartNumber}: {Quantity} units", part.PartNumber, quantity);

            if (part.StockQuantity <= part.ReorderLevel)
                _logger.LogWarning("LOW STOCK ALERT: Part {PartNumber} has only {Qty} units (reorder level: {Level})",
                    part.PartNumber, part.StockQuantity, part.ReorderLevel);

            return MapToDto(part);
        }

        // ── Mapping helper ───────────────────────────────────────────────────────

        private static PartResponseDto MapToDto(Part p) => new()
        {
            Id            = p.Id,
            PartNumber    = p.PartNumber,
            Name          = p.Name,
            Description   = p.Description,
            ImageUrl      = p.ImageUrl,
            Price         = p.Price,
            StockQuantity = p.StockQuantity,
            ReorderLevel  = p.ReorderLevel,
            Condition     = p.Condition,
            Brand         = p.Brand,
            IsActive      = p.IsActive,
            CategoryId    = p.CategoryId,
            CategoryName  = p.Category?.Name ?? string.Empty,
            CreatedAt     = p.CreatedAt,
            UpdatedAt     = p.UpdatedAt
        };
    }
}

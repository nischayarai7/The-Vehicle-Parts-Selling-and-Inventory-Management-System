using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    /// <summary>
    /// Concrete implementation of IPartRepository.
    /// All database access for Parts is isolated here — no other layer touches the DbContext directly.
    /// </summary>
    public class PartRepository : IPartRepository
    {
        private readonly AppDbContext _context;

        public PartRepository(AppDbContext context)
        {
            _context = context;
        }

        // ── IRepository<Part> implementation ────────────────────────────────────

        public async Task<Part?> GetByIdAsync(int id) =>
            await _context.Parts
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id);

        public async Task<IEnumerable<Part>> GetAllAsync() =>
            await _context.Parts
                .Include(p => p.Category)
                .OrderBy(p => p.Name)
                .ToListAsync();

        public async Task<IEnumerable<Part>> FindAsync(
            System.Linq.Expressions.Expression<Func<Part, bool>> predicate) =>
            await _context.Parts.Where(predicate).ToListAsync();

        public async Task<Part> AddAsync(Part entity)
        {
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            _context.Parts.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task UpdateAsync(Part entity)
        {
            entity.UpdatedAt = DateTime.UtcNow;
            _context.Parts.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Part entity)
        {
            _context.Parts.Remove(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistsAsync(
            System.Linq.Expressions.Expression<Func<Part, bool>> predicate) =>
            await _context.Parts.AnyAsync(predicate);

        // ── IPartRepository domain queries ───────────────────────────────────────

        public async Task<Part?> GetByPartNumberAsync(string partNumber) =>
            await _context.Parts
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.PartNumber == partNumber);

        public async Task<IEnumerable<Part>> GetByCategoryAsync(int categoryId) =>
            await _context.Parts
                .Include(p => p.Category)
                .Where(p => p.CategoryId == categoryId && p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();

        public async Task<IEnumerable<Part>> GetLowStockPartsAsync() =>
            await _context.Parts
                .Include(p => p.Category)
                .Where(p => p.StockQuantity <= p.ReorderLevel && p.IsActive)
                .OrderBy(p => p.StockQuantity)
                .ToListAsync();

        public async Task<IEnumerable<Part>> SearchAsync(string keyword)
        {
            var lower = keyword.ToLower();
            return await _context.Parts
                .Include(p => p.Category)
                .Where(p => p.IsActive && (
                    p.Name.ToLower().Contains(lower) ||
                    p.PartNumber.ToLower().Contains(lower) ||
                    (p.Brand != null && p.Brand.ToLower().Contains(lower))
                ))
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<Part>> GetCompatiblePartsAsync(int vehicleId) =>
            await _context.PartCompatibilities
                .Where(pc => pc.VehicleId == vehicleId)
                .Include(pc => pc.Part).ThenInclude(p => p.Category)
                .Select(pc => pc.Part)
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();

        public async Task<bool> IsPartNumberTakenAsync(string partNumber, int? excludeId = null) =>
            await _context.Parts.AnyAsync(p =>
                p.PartNumber == partNumber && (!excludeId.HasValue || p.Id != excludeId.Value));
    }
}

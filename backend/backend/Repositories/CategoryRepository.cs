using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    /// <summary>
    /// Concrete implementation of ICategoryRepository.
    /// </summary>
    public class CategoryRepository : ICategoryRepository
    {
        private readonly AppDbContext _context;

        public CategoryRepository(AppDbContext context)
        {
            _context = context;
        }

        // ── IRepository<Category> implementation ─────────────────────────────────

        public async Task<Category?> GetByIdAsync(int id) =>
            await _context.Categories.FindAsync(id);

        public async Task<IEnumerable<Category>> GetAllAsync() =>
            await _context.Categories.OrderBy(c => c.Name).ToListAsync();

        public async Task<IEnumerable<Category>> FindAsync(
            System.Linq.Expressions.Expression<Func<Category, bool>> predicate) =>
            await _context.Categories.Where(predicate).ToListAsync();

        public async Task<Category> AddAsync(Category entity)
        {
            entity.CreatedAt = DateTime.UtcNow;
            _context.Categories.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task UpdateAsync(Category entity)
        {
            _context.Categories.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Category entity)
        {
            _context.Categories.Remove(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistsAsync(
            System.Linq.Expressions.Expression<Func<Category, bool>> predicate) =>
            await _context.Categories.AnyAsync(predicate);

        // ── ICategoryRepository domain queries ───────────────────────────────────

        public async Task<Category?> GetByNameAsync(string name) =>
            await _context.Categories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());

        public async Task<IEnumerable<Category>> GetActiveAsync() =>
            await _context.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync();

        public async Task<bool> IsNameTakenAsync(string name, int? excludeId = null) =>
            await _context.Categories.AnyAsync(c =>
                c.Name.ToLower() == name.ToLower() &&
                (!excludeId.HasValue || c.Id != excludeId.Value));
    }
}

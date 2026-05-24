using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    /// <summary>
    /// The single EF Core database context for the application.
    /// All entity configurations are loaded automatically from the
    /// Data/Configurations/ folder via ApplyConfigurationsFromAssembly.
    /// </summary>
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // ── DbSets (one per table) ───────────────────────────────────────────────
        public DbSet<User> Users { get; set; }
        public DbSet<AppRole> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Part> Parts { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<PartCompatibility> PartCompatibilities { get; set; }
        public DbSet<CustomerVehicle> CustomerVehicles { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<PendingCredit> PendingCredits { get; set; }
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<PurchaseInvoice> PurchaseInvoices { get; set; }
        public DbSet<PurchaseInvoiceItem> PurchaseInvoiceItems { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<PartRequest> PartRequests { get; set; }
        public DbSet<ServiceReview> ServiceReviews { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<PartReview> PartReviews { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Automatically discovers and applies every IEntityTypeConfiguration<T>
            // class found in this assembly — keeps this file clean as the schema grows.
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            // Seed default system settings
            modelBuilder.Entity<SystemSetting>().HasData(
                new SystemSetting { Key = "system_wallpaper", Value = null }
            );
        }
    }
}

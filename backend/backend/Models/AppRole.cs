using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    /// <summary>
    /// Represents a named role (e.g., "Admin", "Staff", "InventoryManager").
    /// Roles aggregate a set of Permissions.
    /// </summary>
    public class AppRole
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(250)]
        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}

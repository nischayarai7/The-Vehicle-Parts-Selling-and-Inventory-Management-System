using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    /// <summary>
    /// Represents a granular action allowed in the system.
    /// Uses a "resource.action" naming convention: e.g., "parts.create", "users.manage".
    /// </summary>
    public class Permission
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;      // e.g., "parts.create"

        [MaxLength(200)]
        public string Description { get; set; } = string.Empty; // e.g., "Can add new parts to inventory"

        [Required]
        [MaxLength(50)]
        public string Group { get; set; } = string.Empty;     // e.g., "Parts", "Users", "Orders"

        // Navigation
        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
}

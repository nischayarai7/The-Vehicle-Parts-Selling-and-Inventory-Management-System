namespace backend.Models
{
    /// <summary>
    /// Join table: links a Role to one or more Permissions (many-to-many).
    /// </summary>
    public class RolePermission
    {
        public int RoleId { get; set; }
        public AppRole Role { get; set; } = null!;

        public int PermissionId { get; set; }
        public Permission Permission { get; set; } = null!;
    }
}

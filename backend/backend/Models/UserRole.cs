namespace backend.Models
{
    /// <summary>
    /// Join table: links a User to one or more Roles (many-to-many).
    /// </summary>
    public class UserRole
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int RoleId { get; set; }
        public AppRole Role { get; set; } = null!;

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    }
}

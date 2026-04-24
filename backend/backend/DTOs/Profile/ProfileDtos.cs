namespace backend.DTOs.Profile
{
    public class UpdateProfileDto
    {
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
    }

    public class ChangePasswordDto
    {
        public string OldPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}

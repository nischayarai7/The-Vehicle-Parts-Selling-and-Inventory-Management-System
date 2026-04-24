namespace backend.DTOs.Auth
{
    /// <summary>Response returned after a successful login or registration.</summary>
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
    }
}

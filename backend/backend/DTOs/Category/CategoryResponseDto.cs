namespace backend.DTOs.Category
{
    /// <summary>
    /// Read-only response shape returned to the client.
    /// Never exposes the raw entity — only the fields the frontend needs.
    /// </summary>
    public class CategoryResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

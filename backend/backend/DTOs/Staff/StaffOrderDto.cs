using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Staff
{
    public class CreateStaffOrderDto
    {
        [Required]
        public int CustomerId { get; set; }

        public string? Notes { get; set; }

        [Required]
        [MinLength(1)]
        public List<CreateStaffOrderItemDto> Items { get; set; } = new();
    }

    public class CreateStaffOrderItemDto
    {
        [Required]
        public int PartId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }
    }
}

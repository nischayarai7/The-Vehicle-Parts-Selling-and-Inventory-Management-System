using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    /// <summary>
    /// Represents a specific part and quantity within a purchase invoice.
    /// </summary>
    public class PurchaseInvoiceItem
    {
        public int Id { get; set; }

        [Required]
        public int PurchaseInvoiceId { get; set; }

        [Required]
        public int PartId { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        public decimal UnitPrice { get; set; }

        public decimal Subtotal { get; set; }

        // Navigation
        public PurchaseInvoice PurchaseInvoice { get; set; } = null!;
        public Part Part { get; set; } = null!;
    }
}

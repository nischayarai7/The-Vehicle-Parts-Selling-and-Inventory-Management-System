using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    /// <summary>
    /// Represents an invoice for parts purchased from a vendor.
    /// Creating one should update the stock of the included parts.
    /// </summary>
    public class PurchaseInvoice
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        public int VendorId { get; set; }

        public decimal TotalAmount { get; set; }

        public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Vendor Vendor { get; set; } = null!;
        public ICollection<PurchaseInvoiceItem> Items { get; set; } = new List<PurchaseInvoiceItem>();
    }
}

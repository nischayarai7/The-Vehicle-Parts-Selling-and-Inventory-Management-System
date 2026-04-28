using System;
using System.Collections.Generic;

namespace backend.DTOs.PurchaseInvoice
{
    public class CreatePurchaseInvoiceDto
    {
        public string InvoiceNumber { get; set; } = string.Empty;
        public int VendorId { get; set; }
        public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; }
        public List<CreatePurchaseInvoiceItemDto> Items { get; set; } = new();
    }

    public class CreatePurchaseInvoiceItemDto
    {
        public int PartId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class PurchaseInvoiceResponseDto
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public int VendorId { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime InvoiceDate { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<PurchaseInvoiceItemResponseDto> Items { get; set; } = new();
    }

    public class PurchaseInvoiceItemResponseDto
    {
        public int Id { get; set; }
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Subtotal { get; set; }
    }
}

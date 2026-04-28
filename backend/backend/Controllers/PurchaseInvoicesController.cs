using backend.Data;
using backend.DTOs.PurchaseInvoice;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class PurchaseInvoicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseInvoicesController(AppDbContext context)
        {
            _context = context;
        }

        // ── GET /api/PurchaseInvoices ──────────────────────────────────────────
        [HttpGet]
        public async Task<ActionResult> GetAll()
        {
            var invoices = await _context.PurchaseInvoices
                .Include(i => i.Vendor)
                .OrderByDescending(i => i.InvoiceDate)
                .Select(i => new PurchaseInvoiceResponseDto
                {
                    Id = i.Id,
                    InvoiceNumber = i.InvoiceNumber,
                    VendorId = i.VendorId,
                    VendorName = i.Vendor.Name,
                    TotalAmount = i.TotalAmount,
                    InvoiceDate = i.InvoiceDate,
                    Notes = i.Notes,
                    CreatedAt = i.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = invoices });
        }

        // ── GET /api/PurchaseInvoices/{id} ──────────────────────────────────────
        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(int id)
        {
            var invoice = await _context.PurchaseInvoices
                .Include(i => i.Vendor)
                .Include(i => i.Items)
                    .ThenInclude(item => item.Part)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
                return NotFound(new { success = false, message = "Purchase invoice not found." });

            var response = new PurchaseInvoiceResponseDto
            {
                Id = invoice.Id,
                InvoiceNumber = invoice.InvoiceNumber,
                VendorId = invoice.VendorId,
                VendorName = invoice.Vendor.Name,
                TotalAmount = invoice.TotalAmount,
                InvoiceDate = invoice.InvoiceDate,
                Notes = invoice.Notes,
                CreatedAt = invoice.CreatedAt,
                Items = invoice.Items.Select(item => new PurchaseInvoiceItemResponseDto
                {
                    Id = item.Id,
                    PartId = item.PartId,
                    PartName = item.Part.Name,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    Subtotal = item.Subtotal
                }).ToList()
            };

            return Ok(new { success = true, data = response });
        }

        // ── POST /api/PurchaseInvoices ─────────────────────────────────────────
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] CreatePurchaseInvoiceDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Invalid data." });

            var vendor = await _context.Vendors.FindAsync(dto.VendorId);
            if (vendor == null)
                return NotFound(new { success = false, message = "Vendor not found." });

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var invoice = new PurchaseInvoice
                {
                    InvoiceNumber = dto.InvoiceNumber,
                    VendorId = dto.VendorId,
                    InvoiceDate = dto.InvoiceDate,
                    Notes = dto.Notes,
                    CreatedAt = DateTime.UtcNow,
                    TotalAmount = 0 // Calculated below
                };

                foreach (var itemDto in dto.Items)
                {
                    var part = await _context.Parts.FindAsync(itemDto.PartId);
                    if (part == null)
                    {
                        return BadRequest(new { success = false, message = $"Part with ID {itemDto.PartId} not found." });
                    }

                    var item = new PurchaseInvoiceItem
                    {
                        PartId = itemDto.PartId,
                        Quantity = itemDto.Quantity,
                        UnitPrice = itemDto.UnitPrice,
                        Subtotal = itemDto.Quantity * itemDto.UnitPrice
                    };

                    invoice.TotalAmount += item.Subtotal;
                    invoice.Items.Add(item);

                    // UPDATE STOCK: Increment the part's stock quantity
                    part.StockQuantity += itemDto.Quantity;
                    _context.Parts.Update(part);
                }

                await _context.PurchaseInvoices.AddAsync(invoice);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, data = new { invoice.Id, invoice.InvoiceNumber, Message = "Purchase invoice created and stock updated." } });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }
    }
}

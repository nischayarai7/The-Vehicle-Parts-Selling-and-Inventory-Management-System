using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public OrdersController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) throw new UnauthorizedAccessException("User identity not found in token context.");
            return int.Parse(userIdClaim.Value);
        }

        [HttpGet("loyalty-settings")]
        [AllowAnonymous]
        public ActionResult GetLoyaltySettings()
        {
            try
            {
                var threshold = _configuration.GetValue<decimal>("LoyaltySettings:ThresholdAmount", 5000.00m);
                var rate = _configuration.GetValue<decimal>("LoyaltySettings:DiscountRate", 0.10m);
                return Ok(new 
                { 
                    success = true, 
                    data = new 
                    { 
                        thresholdAmount = threshold, 
                        discountRate = rate 
                    } 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("my")]
        public async Task<ActionResult> GetMyOrders()
        {
            try
            {
                var userId = GetCurrentUserId();
                var orders = await _context.Orders
                    .Where(o => o.UserId == userId)
                    .OrderByDescending(o => o.CreatedAt)
                    .Select(o => new
                    {
                        o.Id,
                        o.OrderNumber,
                        o.Status,
                        o.TotalAmount,
                        o.CreatedAt,
                        ItemCount = o.Items.Sum(i => i.Quantity),
                        ProductNames = o.Items.Select(i => i.Part != null ? i.Part.Name : "").ToList()
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = orders });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetOrderDetails(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var order = await _context.Orders
                    .Include(o => o.Items)
                        .ThenInclude(i => i.Part)
                    .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);

                if (order == null)
                {
                    return NotFound(new { success = false, message = "Order not found." });
                }

                return Ok(new { success = true, data = new
                {
                    order.Id,
                    order.OrderNumber,
                    order.Status,
                    order.TotalAmount,
                    order.OriginalAmount,
                    order.DiscountAmount,
                    order.ShippingAddress,
                    order.Notes,
                    order.CreatedAt,
                    Items = order.Items.Select(i => new
                    {
                        i.Id,
                        PartName = i.Part != null ? i.Part.Name : "Unknown Component",
                        PartImage = i.Part != null ? i.Part.ImageUrl : null,
                        i.Quantity,
                        i.UnitPrice,
                        Subtotal = i.Quantity * i.UnitPrice
                    })
                }});
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult> CreateStorefrontOrder([FromBody] CreateStorefrontOrderDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var userId = GetCurrentUserId();

                var newOrder = new Order
                {
                    OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                    UserId = userId,
                    CreatedById = null, // Customers place storefront checkout orders themselves
                    Status = "Pending",
                    ShippingAddress = dto.ShippingAddress,
                    Notes = dto.Notes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    TotalAmount = 0
                };

                foreach (var itemDto in dto.Items)
                {
                    var part = await _context.Parts.FindAsync(itemDto.PartId);
                    if (part == null || !part.IsActive)
                    {
                        return BadRequest(new { success = false, message = $"Component search mismatch. Product ID {itemDto.PartId} is inactive or invalid." });
                    }

                    if (part.StockQuantity < itemDto.Quantity)
                    {
                        return BadRequest(new { success = false, message = $"Insufficient warehouse stock for '{part.Name}'. Available: {part.StockQuantity}" });
                    }

                    // Deduct stock quantity safely
                    part.StockQuantity -= itemDto.Quantity;
                    _context.Parts.Update(part);

                    var orderItem = new OrderItem
                    {
                        PartId = part.Id,
                        Quantity = itemDto.Quantity,
                        UnitPrice = part.Price
                    };

                    newOrder.TotalAmount += (orderItem.Quantity * orderItem.UnitPrice);
                    newOrder.Items.Add(orderItem);
                }

                var originalAmount = newOrder.TotalAmount;
                var threshold = _configuration.GetValue<decimal>("LoyaltySettings:ThresholdAmount", 5000.00m);
                var rate = _configuration.GetValue<decimal>("LoyaltySettings:DiscountRate", 0.10m);

                decimal discountAmount = 0m;
                if (originalAmount > threshold)
                {
                    discountAmount = originalAmount * rate;
                }

                newOrder.OriginalAmount = originalAmount;
                newOrder.DiscountAmount = discountAmount;
                newOrder.TotalAmount = originalAmount - discountAmount;

                await _context.Orders.AddAsync(newOrder);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, data = new { Message = "Order placed successfully.", OrderNumber = newOrder.OrderNumber, OrderId = newOrder.Id } });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }

    public class CreateStorefrontOrderDto
    {
        [Required]
        public string ShippingAddress { get; set; } = string.Empty;

        public string? Notes { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Checkout cart must contain at least 1 item.")]
        public List<CreateStorefrontOrderItemDto> Items { get; set; } = new();
    }

    public class CreateStorefrontOrderItemDto
    {
        [Required]
        public int PartId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Item checkout count must be 1 or higher.")]
        public int Quantity { get; set; }
    }
}

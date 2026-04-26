using backend.Data;
using backend.DTOs.Staff;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff")]
    public class StaffOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StaffOrdersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult> GetAllOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    o.Id,
                    o.OrderNumber,
                    CustomerName = o.User.FullName,
                    o.Status,
                    o.TotalAmount,
                    o.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = orders });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetOrderDetails(int id)
        {
            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Part)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound(new { success = false, message = "Order not found." });

            return Ok(new { success = true, data = new
            {
                order.Id,
                order.OrderNumber,
                CustomerName = order.User.FullName,
                CustomerEmail = order.User.Email,
                order.Status,
                order.TotalAmount,
                order.Notes,
                order.CreatedAt,
                Items = order.Items.Select(i => new
                {
                    i.Id,
                    PartName = i.Part.Name,
                    i.Quantity,
                    i.UnitPrice,
                    Subtotal = i.Quantity * i.UnitPrice
                })
            }});
        }

        [HttpPost]
        public async Task<ActionResult> CreateOrder([FromBody] CreateStaffOrderDto dto)
        {
            var customer = await _context.Users.FindAsync(dto.CustomerId);
            if (customer == null) return NotFound(new { success = false, message = "Customer not found." });

            var newOrder = new Order
            {
                OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                UserId = dto.CustomerId,
                Status = "Completed", // Staff POS orders are usually completed immediately
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                TotalAmount = 0 // Will calculate below
            };

            foreach (var itemDto in dto.Items)
            {
                var part = await _context.Parts.FindAsync(itemDto.PartId);
                if (part == null || !part.IsActive) return BadRequest(new { success = false, message = $"Part with ID {itemDto.PartId} not found or inactive." });

                if (part.StockQuantity < itemDto.Quantity)
                {
                    return BadRequest(new { success = false, message = $"Insufficient stock for {part.Name}. Available: {part.StockQuantity}" });
                }

                // Deduct stock
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

            await _context.Orders.AddAsync(newOrder);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = new { Message = "Order created successfully.", OrderId = newOrder.Id } });
        }
    }
}

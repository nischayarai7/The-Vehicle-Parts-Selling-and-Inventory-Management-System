using backend.Data;
using backend.DTOs.Staff;
using backend.Models;
using backend.Services.Interfaces;
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
        private readonly IEmailService _emailService;

        public StaffOrdersController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
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

        [HttpPost("{id}/send-invoice")]
        public async Task<ActionResult> SendInvoice(int id)
        {
            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Part)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound(new { success = false, message = "Order not found." });

            try
            {
                var body = $@"
                    <h2>Invoice for Order {order.OrderNumber}</h2>
                    <p>Hello {order.User.FullName},</p>
                    <p>Thank you for your purchase. Here are your order details:</p>
                    <table border='1' cellpadding='10' style='border-collapse: collapse;'>
                        <thead>
                            <tr>
                                <th>Part Name</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {string.Join("", order.Items.Select(i => $@"
                                <tr>
                                    <td>{i.Part.Name}</td>
                                    <td>{i.Quantity}</td>
                                    <td>${i.UnitPrice:F2}</td>
                                    <td>${(i.Quantity * i.UnitPrice):F2}</td>
                                </tr>
                            "))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan='3' align='right'><strong>Total Amount:</strong></td>
                                <td><strong>${order.TotalAmount:F2}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    <p>Status: {order.Status}</p>
                    <p>Date: {order.CreatedAt:yyyy-MM-dd HH:mm}</p>
                    <p>Best regards,<br/>6ix7even Auto Parts Team</p>";

                await _emailService.SendEmailAsync(order.User.Email, $"Invoice: {order.OrderNumber}", body);

                return Ok(new { success = true, message = "Invoice sent successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Failed to send email: {ex.Message}" });
            }
        }
    }
}

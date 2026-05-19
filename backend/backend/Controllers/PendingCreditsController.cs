using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PendingCreditsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public PendingCreditsController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult> GetAllPendingCredits()
        {
            var credits = await _context.PendingCredits
                .Include(pc => pc.User)
                .OrderByDescending(pc => pc.CreatedAt)
                .Select(pc => new PendingCreditDto
                {
                    Id = pc.Id,
                    UserId = pc.UserId,
                    UserFullName = pc.User.FullName,
                    Amount = pc.Amount,
                    Description = pc.Description,
                    Status = pc.Status,
                    CreatedAt = pc.CreatedAt,
                    UpdatedAt = pc.UpdatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = credits });
        }

        [HttpGet("my")]
        [Authorize]
        public async Task<ActionResult> GetMyCredits()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            int userId = int.Parse(userIdClaim.Value);

            var credits = await _context.PendingCredits
                .Where(pc => pc.UserId == userId)
                .OrderByDescending(pc => pc.CreatedAt)
                .Select(pc => new PendingCreditDto
                {
                    Id = pc.Id,
                    UserId = pc.UserId,
                    UserFullName = pc.User.FullName,
                    Amount = pc.Amount,
                    Description = pc.Description,
                    Status = pc.Status,
                    CreatedAt = pc.CreatedAt,
                    UpdatedAt = pc.UpdatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = credits });
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult> CreatePendingCredit([FromBody] CreatePendingCreditDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return NotFound(new { success = false, message = "User not found." });

            var pendingCredit = new PendingCredit
            {
                UserId = dto.UserId,
                Amount = dto.Amount,
                Description = dto.Description,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.PendingCredits.AddAsync(pendingCredit);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Pending credit created successfully." });
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult> UpdateCreditStatus(int id, [FromBody] UpdatePendingCreditStatusDto dto)
        {
            var credit = await _context.PendingCredits.FindAsync(id);
            if (credit == null) return NotFound(new { success = false, message = "Credit record not found." });

            if (credit.Status != "Pending")
            {
                return BadRequest(new { success = false, message = "Only pending credits can have their status updated." });
            }

            credit.Status = dto.Status;
            credit.UpdatedAt = DateTime.UtcNow;

            _context.PendingCredits.Update(credit);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = $"Credit {dto.Status.ToLower()} successfully." });
        }

        [HttpPost("{id}/send-reminder")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult> SendOverdueReminder(int id)
        {
            var credit = await _context.PendingCredits
                .Include(pc => pc.User)
                .FirstOrDefaultAsync(pc => pc.Id == id);

            if (credit == null) return NotFound(new { success = false, message = "Credit record not found." });

            if (credit.Status != "Pending")
            {
                return BadRequest(new { success = false, message = "Reminders can only be sent for pending credits." });
            }

            var daysElapsed = (DateTime.UtcNow - credit.CreatedAt).Days;
            
            string subject = $"URGENT: Outstanding Balance Reminder - 6ix7even Auto Parts";
            
            string emailBody = $@"
                <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;'>
                    <h2 style='color: #e04f5f; border-bottom: 2px solid #e04f5f; padding-bottom: 10px; margin-top: 0;'>Outstanding Balance Notice</h2>
                    <p>Dear <strong>{credit.User.FullName}</strong>,</p>
                    <p>This is a friendly reminder that you have an outstanding credit balance of <strong>Rs. {credit.Amount:N2}</strong> recorded under your account since <strong>{credit.CreatedAt:MMM dd, yyyy}</strong> ({daysElapsed} days ago).</p>
                    <div style='background-color: #f9f9f9; padding: 15px; border-left: 4px solid #e04f5f; margin: 20px 0;'>
                        <p style='margin: 0;'><strong>Reference Description:</strong> {credit.Description}</p>
                        <p style='margin: 5px 0 0 0;'><strong>Amount Due:</strong> Rs. {credit.Amount:N2}</p>
                        <p style='margin: 5px 0 0 0;'><strong>Overdue Period:</strong> {daysElapsed} Days</p>
                    </div>
                    <p>Please arrange for immediate settlement. You can settle this balance at our store or contact administrative staff for online settlement details.</p>
                    <p style='margin-top: 30px; font-size: 12px; color: #777;'>Thank you,<br/><strong>Administrative Auditing Team</strong><br/>6ix7even Auto Parts</p>
                </div>";

            try
            {
                await _emailService.SendEmailAsync(credit.User.Email, subject, emailBody, true);
                return Ok(new { success = true, message = $"Overdue email reminder successfully dispatched to {credit.User.Email}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Failed to dispatch reminder email: {ex.Message}" });
            }
        }

        [HttpPost("user/{userId}/send-all-reminders")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult> SendAllUserReminders(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound(new { success = false, message = "Customer account not found." });

            var userCredits = await _context.PendingCredits
                .Where(pc => pc.UserId == userId && pc.Status == "Pending")
                .ToListAsync();

            if (!userCredits.Any())
            {
                return BadRequest(new { success = false, message = "No pending credits found for this customer." });
            }

            var totalOverdue = userCredits.Sum(c => c.Amount);
            string subject = $"URGENT: Outstanding Balance Statement - 6ix7even Auto Parts";
            
            var creditLinesHtml = "";
            foreach (var c in userCredits)
            {
                var days = (DateTime.UtcNow - c.CreatedAt).Days;
                creditLinesHtml += $@"
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #eee;'>{c.CreatedAt:MMM dd, yyyy}</td>
                        <td style='padding: 10px; border-bottom: 1px solid #eee;'>{c.Description}</td>
                        <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>{days} days</td>
                        <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;'>Rs. {c.Amount:N2}</td>
                    </tr>";
            }

            string emailBody = $@"
                <div style='font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 8px;'>
                    <h2 style='color: #e04f5f; border-bottom: 2px solid #e04f5f; padding-bottom: 10px; margin-top: 0;'>Account Balance Statement Notice</h2>
                    <p>Dear <strong>{user.FullName}</strong>,</p>
                    <p>This is a formal outstanding statement notification of outstanding credit lines recorded on your account.</p>
                    
                    <h4 style='color: #333; margin-bottom: 10px;'>Active Statements Breakdown:</h4>
                    <table style='width: 100%; border-collapse: collapse; font-size: 13px;'>
                        <thead>
                            <tr style='background-color: #f5f5f5;'>
                                <th style='padding: 10px; text-align: left;'>Date Issued</th>
                                <th style='padding: 10px; text-align: left;'>Description</th>
                                <th style='padding: 10px; text-align: right;'>Age</th>
                                <th style='padding: 10px; text-align: right;'>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {creditLinesHtml}
                        </tbody>
                        <tfoot>
                            <tr style='background-color: #fafafa; font-size: 14px;'>
                                <td colspan='3' style='padding: 12px 10px; text-align: right; font-weight: bold;'>Total Balance Due:</td>
                                <td style='padding: 12px 10px; text-align: right; font-weight: bold; color: #e04f5f;'>Rs. {totalOverdue:N2}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <p style='margin-top: 20px;'>Please arrange for immediate settlement. Settle in person at our showroom or coordinate with administrative auditing to process online confirmation.</p>
                    <p style='margin-top: 30px; font-size: 12px; color: #777;'>Thank you,<br/><strong>Administrative Auditing Team</strong><br/>6ix7even Auto Parts</p>
                </div>";

            try
            {
                await _emailService.SendEmailAsync(user.Email, subject, emailBody, true);
                return Ok(new { success = true, message = $"Account statement successfully compiled and sent to {user.Email}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Failed to send account statement: {ex.Message}" });
            }
        }

        [HttpPost("send-all-overdue-reminders")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult> SendAllOverdueReminders()
        {
            var overdueDate = DateTime.UtcNow.AddDays(-30);
            
            var overdueCredits = await _context.PendingCredits
                .Include(pc => pc.User)
                .Where(pc => pc.Status == "Pending" && pc.CreatedAt <= overdueDate)
                .ToListAsync();

            if (!overdueCredits.Any())
            {
                return Ok(new { success = true, message = "No customer accounts have credit outstanding for more than a month.", count = 0 });
            }

            var groupedCredits = overdueCredits.GroupBy(c => c.User);
            int successCount = 0;

            foreach (var group in groupedCredits)
            {
                var user = group.Key;
                var userCredits = group.ToList();
                var totalOverdue = userCredits.Sum(c => c.Amount);
                
                string subject = $"URGENT: Overdue Account Balance Statement - 6ix7even Auto Parts";
                
                var creditLinesHtml = "";
                foreach (var c in userCredits)
                {
                    var days = (DateTime.UtcNow - c.CreatedAt).Days;
                    creditLinesHtml += $@"
                        <tr>
                            <td style='padding: 10px; border-bottom: 1px solid #eee;'>{c.CreatedAt:MMM dd, yyyy}</td>
                            <td style='padding: 10px; border-bottom: 1px solid #eee;'>{c.Description}</td>
                            <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>{days} days</td>
                            <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;'>Rs. {c.Amount:N2}</td>
                        </tr>";
                }

                string emailBody = $@"
                    <div style='font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 8px;'>
                        <h2 style='color: #e04f5f; border-bottom: 2px solid #e04f5f; padding-bottom: 10px; margin-top: 0;'>Overdue Balance Statement Notice</h2>
                        <p>Dear <strong>{user.FullName}</strong>,</p>
                        <p>This is a formal notification that your account has one or more credit lines that have been overdue for <strong>more than a month (30+ days)</strong>.</p>
                        
                        <h4 style='color: #333; margin-bottom: 10px;'>Statement Breakdown:</h4>
                        <table style='width: 100%; border-collapse: collapse; font-size: 13px;'>
                            <thead>
                                <tr style='background-color: #f5f5f5;'>
                                    <th style='padding: 10px; text-align: left;'>Date Issued</th>
                                    <th style='padding: 10px; text-align: left;'>Description</th>
                                    <th style='padding: 10px; text-align: right;'>Overdue Period</th>
                                    <th style='padding: 10px; text-align: right;'>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {creditLinesHtml}
                            </tbody>
                            <tfoot>
                                <tr style='background-color: #fafafa; font-size: 14px;'>
                                    <td colspan='3' style='padding: 12px 10px; text-align: right; font-weight: bold;'>Total Balance Due:</td>
                                    <td style='padding: 12px 10px; text-align: right; font-weight: bold; color: #e04f5f;'>Rs. {totalOverdue:N2}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <p style='margin-top: 20px;'>Please arrange for immediate payment of the total balance due to settle your account status. Contact store administrators to confirm payment methods or receipt details.</p>
                        <p style='margin-top: 30px; font-size: 12px; color: #777;'>Thank you,<br/><strong>Administrative Auditing Team</strong><br/>6ix7even Auto Parts</p>
                    </div>";

                try
                {
                    await _emailService.SendEmailAsync(user.Email, subject, emailBody, true);
                    successCount++;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send overdue email statement to {user.Email}: {ex.Message}");
                }
            }

            return Ok(new { success = true, message = $"{successCount} accounts notified successfully.", count = successCount });
        }
    }
}

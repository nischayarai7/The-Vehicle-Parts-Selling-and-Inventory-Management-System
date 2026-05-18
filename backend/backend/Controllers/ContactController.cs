using backend.Common;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    /// <summary>
    /// REST endpoints for submitting contact support forms and dispatching emails.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public ContactController(IEmailService emailService, IConfiguration configuration)
        {
            _emailService = emailService;
            _configuration = configuration;
        }

        // ── POST /api/contact ──────────────────────────────────────────────────
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> SubmitContactForm([FromBody] ContactSubmissionDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                return BadRequest(ApiResponse.Fail("Validation failed", errors));
            }

            try
            {
                // Fetch dynamic admin support email from configurations to avoid hardcoding
                var adminEmail = _configuration["EmailSettings:SmtpUser"] ?? "nischayachamlingraii@gmail.com";
                var storeName = _configuration["EmailSettings:SenderName"] ?? "6ix7even Auto Parts";

                // 1. Dispatch support request alert email to system administrators / staff
                var staffEmailSubject = $"[Contact Support Inquiry] Message from {dto.FullName}";
                var staffEmailBody = $@"
                    <div style='font-family: Arial, sans-serif; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;'>
                        <div style='background-color: #222; color: #fff; padding: 20px; text-align: center;'>
                            <h2 style='margin: 0; color: #e33b3b;'>New Contact Form Submission</h2>
                            <p style='margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;'>Received from storefront client portal</p>
                        </div>
                        <div style='padding: 24px; line-height: 1.6;'>
                            <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>
                                <tr>
                                    <td style='padding: 8px 0; font-weight: bold; width: 120px; color: #666;'>Client Name:</td>
                                    <td style='padding: 8px 0; color: #111;'>{dto.FullName}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px 0; font-weight: bold; color: #666;'>Email Address:</td>
                                    <td style='padding: 8px 0;'><a href='mailto:{dto.Email}' style='color: #e33b3b; text-decoration: none;'>{dto.Email}</a></td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px 0; font-weight: bold; color: #666;'>Submitted At:</td>
                                    <td style='padding: 8px 0; color: #555;'>{DateTime.Now.ToString("f")}</td>
                                </tr>
                            </table>
                            <div style='border-top: 1px solid #eee; padding-top: 20px;'>
                                <h4 style='margin: 0 0 10px 0; color: #222;'>Detailed Message Inquiry:</h4>
                                <div style='background-color: #f7f7f7; padding: 15px; border-radius: 6px; border-left: 4px solid #e33b3b; font-style: italic; color: #444; white-space: pre-wrap;'>
                                    {dto.Message}
                                </div>
                            </div>
                        </div>
                        <div style='background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 11px; color: #888;'>
                            This request was routed dynamically via the 6ix7even Auto Parts System gateway.
                        </div>
                    </div>";

                await _emailService.SendEmailAsync(adminEmail, staffEmailSubject, staffEmailBody, true);

                // 2. Dispatch a beautiful, responsive confirmation auto-receipt to the customer
                var customerEmailSubject = $"We've received your support request! - {storeName}";
                var customerEmailBody = $@"
                    <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);'>
                        <div style='background-color: #e33b3b; color: #fff; padding: 25px; text-align: center;'>
                            <h2 style='margin: 0; font-size: 22px;'>Support Request Logged</h2>
                            <p style='margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;'>Thank you for reaching out to {storeName}</p>
                        </div>
                        <div style='padding: 24px; line-height: 1.6;'>
                            <p>Dear <strong>{dto.FullName}</strong>,</p>
                            <p>We are writing to confirm that we have successfully received the support inquiry you submitted via our storefront contact form.</p>
                            <p>Our dedicated parts technicians and customer support representatives are already reviewing your details. We strive to provide a comprehensive response within <strong>24 business hours</strong>.</p>
                            
                            <div style='background-color: #fafafa; padding: 15px; border-radius: 6px; border: 1px dashed #ddd; margin: 20px 0;'>
                                <h4 style='margin: 0 0 8px 0; color: #555; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;'>Copy of your submitted inquiry:</h4>
                                <p style='margin: 0; font-style: italic; color: #666; white-space: pre-wrap;'>""{dto.Message}""</p>
                            </div>
                            
                            <p>If you have any further documents, specific vehicle vin numbers, or compatibility specifications to add, simply reply directly to this email, and it will be appended to your support ticket.</p>
                            
                            <p style='margin-top: 30px;'>Best regards,<br/><strong>The Customer Care Team</strong><br/>{storeName}</p>
                        </div>
                        <div style='background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee;'>
                            This is an automated confirmation email. Please keep it for your reference.
                        </div>
                    </div>";

                await _emailService.SendEmailAsync(dto.Email, customerEmailSubject, customerEmailBody, true);

                return Ok(ApiResponse.Ok("Your support ticket has been sent. A confirmation receipt has also been dispatched to your email."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Fail($"Failed to send inquiry: {ex.Message}"));
            }
        }
    }

    /// <summary>
    /// Data Transfer Object for validating contact form submissions.
    /// </summary>
    public class ContactSubmissionDto
    {
        [Required(ErrorMessage = "Full Name is required.")]
        [StringLength(100, ErrorMessage = "Full Name cannot exceed 100 characters.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email Address is required.")]
        [EmailAddress(ErrorMessage = "Please provide a valid email address.")]
        [StringLength(150, ErrorMessage = "Email Address cannot exceed 150 characters.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Message content is required.")]
        [MinLength(10, ErrorMessage = "Message must be at least 10 characters long.")]
        [MaxLength(2000, ErrorMessage = "Message cannot exceed 2000 characters.")]
        public string Message { get; set; } = string.Empty;
    }
}

using backend.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

namespace backend.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            var smtpHost = _configuration["EmailSettings:SmtpHost"];
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
            var smtpUser = _configuration["EmailSettings:SmtpUser"];
            var smtpPass = _configuration["EmailSettings:SmtpPass"];
            var senderName = _configuration["EmailSettings:SenderName"];
            var senderEmail = _configuration["EmailSettings:SenderEmail"];

            Console.WriteLine($"[SMTP-DIAGNOSTIC] Initializing SMTP Client. Host={smtpHost}:{smtpPort}, User={smtpUser}");
            Console.WriteLine($"[SMTP-DIAGNOSTIC] Attempting to deliver email statement to recipient='{to}'");

            if (string.IsNullOrWhiteSpace(to))
            {
                throw new ArgumentException("Recipient email address cannot be null or empty.");
            }

            try
            {
                using (var client = new SmtpClient(smtpHost, smtpPort))
                {
                    client.Credentials = new NetworkCredential(smtpUser, smtpPass);
                    client.EnableSsl = true;

                    var fromEmail = smtpHost.Contains("gmail.com") ? smtpUser : senderEmail;
                    Console.WriteLine($"[SMTP-DIAGNOSTIC] From Email resolved as: '{fromEmail}' based on security policy.");

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(fromEmail!, senderName),
                        Subject = subject,
                        Body = body,
                        IsBodyHtml = isHtml
                    };

                    mailMessage.To.Add(to);

                    await client.SendMailAsync(mailMessage);
                    Console.WriteLine($"[SMTP-DIAGNOSTIC] SUCCESS! Statement successfully delivered to SMTP server relay for: '{to}'");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SMTP-DIAGNOSTIC] [CRITICAL ERROR] Failed to send email to '{to}': {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[SMTP-DIAGNOSTIC] Inner Exception: {ex.InnerException.Message}");
                }
                throw;
            }
        }
    }
}

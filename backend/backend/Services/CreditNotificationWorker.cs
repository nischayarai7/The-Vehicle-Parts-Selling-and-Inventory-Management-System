using backend.Data;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace backend.Services
{
    public class CreditNotificationWorker : BackgroundService
    {
        private readonly ILogger<CreditNotificationWorker> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        
        // Timer interval: 24 hours (can be changed for testing)
        private readonly TimeSpan _period = TimeSpan.FromHours(24);

        public CreditNotificationWorker(ILogger<CreditNotificationWorker> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[CreditNotificationWorker] Service is starting.");

            using var timer = new PeriodicTimer(_period);
            
            // Run immediately on startup, then every 24 hours
            do
            {
                if (stoppingToken.IsCancellationRequested)
                    break;
                    
                await ProcessDueCreditsAsync(stoppingToken);
                
            } while (await timer.WaitForNextTickAsync(stoppingToken));

            _logger.LogInformation("[CreditNotificationWorker] Service is stopping.");
        }

        private async Task ProcessDueCreditsAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[CreditNotificationWorker] Starting daily check for overdue credits...");

            try
            {
                // Create a scoped service container because AppDbContext and EmailService are scoped
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                // 30 days threshold
                var thresholdDate = DateTime.UtcNow.AddDays(-30);
                
                // Get credits that are 'Approved' and older than 30 days, 
                // AND haven't received a notification in the last 7 days.
                var dueCredits = await dbContext.PendingCredits
                    .Include(c => c.User)
                    .Where(c => c.Status == "Approved" 
                             && c.CreatedAt <= thresholdDate
                             && (c.LastNotificationSentAt == null || c.LastNotificationSentAt <= DateTime.UtcNow.AddDays(-7)))
                    .ToListAsync(stoppingToken);

                if (!dueCredits.Any())
                {
                    _logger.LogInformation("[CreditNotificationWorker] No overdue credits requiring notifications today.");
                    return;
                }

                _logger.LogInformation($"[CreditNotificationWorker] Found {dueCredits.Count} overdue credits. Processing notifications...");

                int successCount = 0;

                foreach (var credit in dueCredits)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    try
                    {
                        var subject = "Action Required: Overdue Credit Balance - 6IX7EVEN Auto Parts";
                        var body = $@"
                            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                                <h2 style='color: #e33b3b;'>Credit Balance Reminder</h2>
                                <p>Dear {credit.User.FullName},</p>
                                <p>This is a friendly reminder that you have an outstanding approved credit balance that is now over 30 days old.</p>
                                
                                <div style='background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                                    <p style='margin: 5px 0;'><strong>Amount Due:</strong> Rs. {credit.Amount:N2}</p>
                                    <p style='margin: 5px 0;'><strong>Description:</strong> {credit.Description}</p>
                                    <p style='margin: 5px 0;'><strong>Approved On:</strong> {credit.CreatedAt.ToLocalTime():yyyy-MM-dd}</p>
                                </div>
                                
                                <p>Please make arrangements to clear this balance at your earliest convenience to maintain your account in good standing.</p>
                                <p>If you have already settled this balance, please disregard this email or contact our support team.</p>
                                
                                <p style='margin-top: 30px; font-size: 0.9em; color: #666;'>
                                    Best regards,<br/>
                                    <strong>6IX7EVEN Auto Parts Team</strong>
                                </p>
                            </div>
                        ";

                        await emailService.SendEmailAsync(credit.User.Email, subject, body, true);
                        
                        // Update the last notification timestamp
                        credit.LastNotificationSentAt = DateTime.UtcNow;
                        successCount++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"[CreditNotificationWorker] Failed to send email for credit ID {credit.Id} to {credit.User.Email}");
                    }
                }

                // Save timestamp updates back to the database
                if (successCount > 0)
                {
                    await dbContext.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation($"[CreditNotificationWorker] Successfully processed and sent {successCount} notifications.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[CreditNotificationWorker] An error occurred while processing due credits.");
            }
        }
    }
}

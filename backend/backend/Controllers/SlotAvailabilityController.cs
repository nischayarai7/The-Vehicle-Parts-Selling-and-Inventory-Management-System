using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SlotAvailabilityController : ControllerBase
    {
        private readonly AppDbContext _context;

        // Config constants (keep in sync with frontend)
        private const int MaxPerSlot = 5;
        private const int BusinessStartHour = 9;   // 9 AM
        private const int BusinessEndHour = 18;    // 6 PM
        private const int DaysAhead = 5;
        private const int MinHoursAdvance = 24;

        public SlotAvailabilityController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/slotavailability
        // Returns all slots for next DaysAhead days with available capacity
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetSlots()
        {
            try
            {
                var localNow = DateTime.Now;
                var localEarliest = localNow.AddHours(MinHoursAdvance);

                var slots = new List<object>();

                for (int day = 0; day < DaysAhead; day++)
                {
                    var baseDate = localEarliest.AddDays(day).Date; // Local date

                    for (int hour = BusinessStartHour; hour < BusinessEndHour; hour++)
                    {
                        var localSlotTime = baseDate.AddHours(hour); // Local slot time

                        if (localSlotTime < localEarliest) continue;

                        var slotStartUtc = localSlotTime.ToUniversalTime(); // Convert to UTC for DB
                        var slotEndUtc = slotStartUtc.AddHours(1);

                        var booked = await _context.Appointments
                            .CountAsync(a =>
                                a.AppointmentDate >= slotStartUtc &&
                                a.AppointmentDate < slotEndUtc &&
                                a.Status != "Cancelled");

                        var available = MaxPerSlot - booked;

                        if (available > 0)
                        {
                            slots.Add(new
                            {
                                dateTime = slotStartUtc,
                                available = available,
                                total = MaxPerSlot
                            });
                        }
                    }
                }

                return Ok(new { success = true, data = slots });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}

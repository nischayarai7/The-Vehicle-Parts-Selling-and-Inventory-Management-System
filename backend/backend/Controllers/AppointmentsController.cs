using backend.Data;
using backend.DTOs.Appointment;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AppointmentsController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) throw new UnauthorizedAccessException("User not found in token");
            return int.Parse(userIdClaim.Value);
        }

        // GET: api/appointments/slots (Get available time slots)
        [HttpGet("slots")]
        [Authorize]
        public async Task<IActionResult> GetAvailableSlots()
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Rule: Same user cannot book multiple booking
                var hasActiveBooking = await _context.Appointments
                    .AnyAsync(a => a.UserId == userId && (a.Status == "Pending" || a.Status == "Confirmed"));
                
                if (hasActiveBooking)
                {
                    return Ok(new { success = true, data = new List<object>(), message = "You already have an active booking." });
                }

                // Generate slots
                var slots = new List<object>();
                var startDate = DateTime.UtcNow.AddHours(24); // 24 hours earlier rule
                
                // Generate for next 5 days
                for (int day = 0; day < 5; day++)
                {
                    var currentDate = startDate.AddDays(day).Date;
                    
                    // Business hours: 8 AM to 6 PM
                    for (int hour = 8; hour < 18; hour++)
                    {
                        var slotTime = currentDate.AddHours(hour);
                        
                        if (slotTime < startDate) continue;

                        var nextHour = slotTime.AddHours(1);
                        var bookingCount = await _context.Appointments
                            .CountAsync(a => a.AppointmentDate >= slotTime && a.AppointmentDate < nextHour && a.Status != "Cancelled");

                        if (bookingCount < 5) // Upto 5 times rule
                        {
                            slots.Add(new {
                                dateTime = slotTime,
                                display = slotTime.ToString("yyyy-MM-dd HH:mm"),
                                available = 5 - bookingCount
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

        // POST: api/appointments (Customer books appointment)
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();

                // Rule: Same user cannot book multiple booking
                var hasActiveBooking = await _context.Appointments
                    .AnyAsync(a => a.UserId == userId && (a.Status == "Pending" || a.Status == "Confirmed"));
                
                if (hasActiveBooking)
                {
                    return BadRequest(new { success = false, message = "You already have an active booking. Please complete or cancel it before booking again." });
                }

                // Rule: Booking should be done 24hrs earlier
                if (dto.AppointmentDate < DateTime.UtcNow.AddHours(24))
                {
                    return BadRequest(new { success = false, message = "Booking must be made at least 24 hours in advance." });
                }

                // Rule: Upto 5 times of each slot
                var slotStart = new DateTime(dto.AppointmentDate.Year, dto.AppointmentDate.Month, dto.AppointmentDate.Day, dto.AppointmentDate.Hour, 0, 0, DateTimeKind.Utc);
                var slotEnd = slotStart.AddHours(1);
                
                var bookingCount = await _context.Appointments
                    .CountAsync(a => a.AppointmentDate >= slotStart && a.AppointmentDate < slotEnd && a.Status != "Cancelled");

                if (bookingCount >= 5)
                {
                    return BadRequest(new { success = false, message = "This time slot is full." });
                }

                var appointment = new Appointment
                {
                    UserId = userId,
                    VehicleId = dto.VehicleId,
                    ServiceType = dto.ServiceType,
                    AppointmentDate = slotStart, // Snap to hour
                    Notes = dto.Notes,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Appointment booked successfully", appointmentId = appointment.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/appointments/my (Customer gets their appointments)
        [HttpGet("my")]
        [Authorize]
        public async Task<IActionResult> GetMyAppointments()
        {
            try
            {
                var userId = GetCurrentUserId();

                var appointments = await _context.Appointments
                    .Include(a => a.Vehicle)
                        .ThenInclude(v => v!.Vehicle)
                    .Where(a => a.UserId == userId)
                    .OrderByDescending(a => a.AppointmentDate)
                    .Select(a => new AppointmentDto
                    {
                        Id = a.Id,
                        UserId = a.UserId,
                        CustomerName = a.User!.FullName,
                        VehicleId = a.VehicleId,
                        VehicleName = a.Vehicle != null ? $"{a.Vehicle.Vehicle.Make} {a.Vehicle.Vehicle.Model} ({a.Vehicle.Vehicle.Year})" : null,
                        ServiceType = a.ServiceType,
                        AppointmentDate = a.AppointmentDate,
                        Status = a.Status,
                        Notes = a.Notes,
                        CreatedAt = a.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = appointments });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // DELETE: api/appointments/{id} (Customer removes their appointment)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var appointment = await _context.Appointments.FindAsync(id);

                if (appointment == null)
                {
                    return NotFound(new { success = false, message = "Appointment not found" });
                }

                if (appointment.UserId != userId)
                {
                    return Forbid();
                }

                if (appointment.Status == "Completed")
                {
                    return BadRequest(new { success = false, message = "Cannot remove a completed appointment." });
                }

                _context.Appointments.Remove(appointment);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Appointment removed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/appointments (Staff/Admin gets all appointments)
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAllAppointments()
        {
            try
            {
                var appointments = await _context.Appointments
                    .Include(a => a.User)
                    .Include(a => a.Vehicle)
                        .ThenInclude(v => v!.Vehicle)
                    .OrderByDescending(a => a.AppointmentDate)
                    .Select(a => new AppointmentDto
                    {
                        Id = a.Id,
                        UserId = a.UserId,
                        CustomerName = a.User!.FullName,
                        VehicleId = a.VehicleId,
                        VehicleName = a.Vehicle != null ? $"{a.Vehicle.Vehicle.Make} {a.Vehicle.Vehicle.Model} ({a.Vehicle.Vehicle.Year})" : null,
                        ServiceType = a.ServiceType,
                        AppointmentDate = a.AppointmentDate,
                        Status = a.Status,
                        Notes = a.Notes,
                        CreatedAt = a.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = appointments });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // PUT: api/appointments/{id}/status (Staff/Admin updates status)
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAppointmentStatusDto dto)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(id);
                if (appointment == null) return NotFound(new { success = false, message = "Appointment not found" });

                appointment.Status = dto.Status;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Status updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}

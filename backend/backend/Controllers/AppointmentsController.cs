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

        // POST: api/appointments (Customer books appointment)
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();

                var appointment = new Appointment
                {
                    UserId = userId,
                    VehicleId = dto.VehicleId,
                    ServiceType = dto.ServiceType,
                    AppointmentDate = dto.AppointmentDate,
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

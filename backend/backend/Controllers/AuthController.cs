using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Linq;
using backend.Common;
using backend.Data;
using backend.DTOs.Auth;
using backend.Models;
using backend.Services.Interfaces;
using Google.Apis.Auth;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthController(AppDbContext context, IConfiguration configuration, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());
            if (existingUser != null)
                return BadRequest(new { message = "Email is already registered" });

            // Create user with hashed password
            var verificationToken = new Random().Next(100000, 999999).ToString();
            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                CreatedAt = DateTime.UtcNow,
                IsEmailVerified = false,
                EmailVerificationToken = verificationToken,
                EmailVerificationTokenExpiry = DateTime.UtcNow.AddMinutes(1).AddSeconds(30)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Assign default Customer role
            var customerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Customer");
            if (customerRole != null)
            {
                _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = customerRole.Id });
                await _context.SaveChangesAsync();
            }

            // Send verification email
            try
            {
                await _emailService.SendEmailAsync(
                    user.Email,
                    "Verify Your Email - 6ix7even Auto Parts",
                    $"<h1>Welcome to 6ix7even Auto Parts</h1><p>Your verification code is: <strong>{verificationToken}</strong></p><p>This code will expire in 1 minute and 30 seconds.</p>"
                );
            }
            catch (Exception ex)
            {
                // Log error but don't fail registration
                Console.WriteLine($"Failed to send email: {ex.Message}");
            }

            return Ok(ApiResponse.Ok("Registration successful. Please check your email for the verification code."));
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());
            
            if (user == null)
                return NotFound(ApiResponse.Fail("User not found."));

            if (user.IsEmailVerified)
                return BadRequest(ApiResponse.Fail("Email is already verified."));

            if (user.EmailVerificationToken != dto.Token || user.EmailVerificationTokenExpiry < DateTime.UtcNow)
                return BadRequest(ApiResponse.Fail("Invalid or expired verification token."));

            user.IsEmailVerified = true;
            user.EmailVerificationToken = null;
            user.EmailVerificationTokenExpiry = null;
            
            await _context.SaveChangesAsync();

            return Ok(ApiResponse.Ok("Email verified successfully. You can now login."));
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification([FromBody] ResendEmailDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());

            if (user == null)
                return NotFound(ApiResponse.Fail("User not found."));

            if (user.IsEmailVerified)
                return BadRequest(ApiResponse.Fail("Email is already verified."));

            // Generate new token
            var verificationToken = new Random().Next(100000, 999999).ToString();
            user.EmailVerificationToken = verificationToken;
            user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddMinutes(1).AddSeconds(30);

            await _context.SaveChangesAsync();

            // Send new email
            try
            {
                await _emailService.SendEmailAsync(
                    user.Email,
                    "New Verification Code - 6ix7even Auto Parts",
                    $"<h1>New Verification Code</h1><p>Your new verification code is: <strong>{verificationToken}</strong></p><p>This code will expire in 1 minute and 30 seconds.</p>"
                );
                return Ok(ApiResponse.Ok("New verification code sent."));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse.Fail($"Failed to send email: {ex.Message}"));
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Find user by email and include roles/permissions
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());

            if (user == null)
                return Unauthorized(ApiResponse.Fail("Invalid email or password."));

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized(ApiResponse.Fail("Invalid email or password."));

            // Check if email is verified
            if (!user.IsEmailVerified)
                return BadRequest(ApiResponse.Fail("Please verify your email before logging in."));

            // Generate JWT token
            var token = GenerateJwtToken(user);

            // For the response, just send the first role name or "Customer"
            var primaryRole = user.UserRoles.FirstOrDefault()?.Role?.Name ?? "Customer";

            return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                FullName = user.FullName,
                Role = primaryRole,
                AvatarUrl = user.AvatarUrl
            }, "Login successful."));
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new List<string>() { _configuration["Authentication:Google:ClientId"]! }
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);

                var user = await _context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                    .FirstOrDefaultAsync(u => u.Email == payload.Email.ToLower());

                if (user == null)
                {
                    // Create new user if they don't exist
                    user = new User
                    {
                        FullName = payload.Name,
                        Email = payload.Email.ToLower(),
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // Random password
                        AvatarUrl = payload.Picture,
                        IsEmailVerified = true, // Google emails are already verified
                        AuthProvider = "Google",
                        GoogleId = payload.Subject,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();

                    var customerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Customer");
                    if (customerRole != null)
                    {
                        _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = customerRole.Id });
                        await _context.SaveChangesAsync();
                    }

                    // Reload with roles
                    user = await _context.Users
                        .Include(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
                        .FirstAsync(u => u.Id == user.Id);
                }

                var token = GenerateJwtToken(user);
                var primaryRole = user.UserRoles.FirstOrDefault()?.Role?.Name ?? "Customer";

                return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
                {
                    Token = token,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = primaryRole,
                    AvatarUrl = user.AvatarUrl
                }, "Google login successful."));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse.Fail($"Google authentication failed: {ex.Message}"));
            }
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["Secret"]!;
            var issuer = jwtSettings["Issuer"]!;
            var audience = jwtSettings["Audience"]!;
            var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"]!);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // Add Role claims
            var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct();
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // Add Permission claims
            var permissions = user.UserRoles
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.Name)
                .Distinct();

            foreach (var permission in permissions)
            {
                claims.Add(new Claim("permission", permission));
            }

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

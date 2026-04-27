using backend.Common;
using backend.DTOs.Vendor;
using backend.Services.Interfaces;
using backend.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VendorsController : ControllerBase
    {
        private readonly IVendorService _vendorService;

        public VendorsController(IVendorService vendorService)
        {
            _vendorService = vendorService;
        }

        [HttpGet]
        [HasPermission("vendors.view")]
        public async Task<IActionResult> GetAll()
        {
            var vendors = await _vendorService.GetAllVendorsAsync();
            return Ok(ApiResponse<IEnumerable<VendorDto>>.Ok(vendors));
        }

        [HttpGet("{id:int}")]
        [HasPermission("vendors.view")]
        public async Task<IActionResult> GetById(int id)
        {
            var vendor = await _vendorService.GetVendorByIdAsync(id);
            return Ok(ApiResponse<VendorDto>.Ok(vendor));
        }

        [HttpPost]
        [HasPermission("vendors.manage")]
        public async Task<IActionResult> Create([FromBody] CreateVendorDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.Fail("Validation failed", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));

            var vendor = await _vendorService.CreateVendorAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = vendor.Id }, ApiResponse<VendorDto>.Ok(vendor, "Vendor created successfully"));
        }

        [HttpPut("{id:int}")]
        [HasPermission("vendors.manage")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateVendorDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.Fail("Validation failed", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));

            var vendor = await _vendorService.UpdateVendorAsync(id, dto);
            return Ok(ApiResponse<VendorDto>.Ok(vendor, "Vendor updated successfully"));
        }

        [HttpDelete("{id:int}")]
        [HasPermission("vendors.manage")]
        public async Task<IActionResult> Delete(int id)
        {
            await _vendorService.DeleteVendorAsync(id);
            return Ok(ApiResponse.Ok("Vendor deleted successfully"));
        }
    }
}

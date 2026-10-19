using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Extenstions;
using Microsoft.AspNetCore.Mvc;

namespace MedMonitor.Controllers
{
    public class AdmissionRequestController : BaseController
    {
        private readonly IAdmissionRequestService _service;

        public AdmissionRequestController(IAdmissionRequestService service)
        {
            _service = service;
        }

        [HttpPost("Create")]
        public async Task<IActionResult> Create(AdmissionRequestDto dto)
        {
            var doctorId = CurrentUserId;
            if (string.IsNullOrWhiteSpace(doctorId))
                return Unauthorized();

            dto.DoctorId = doctorId;
            return await _service.Create(dto, doctorId).ToActionResult();
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update(AdmissionRequestDto dto)
            => await _service.Update(dto).ToActionResult();

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(int id)
            => await _service.Delete(id).ToActionResult();

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
            => Ok(await _service.GetAll());

        [HttpGet("GetById")]
        public async Task<IActionResult> GetById(int id)
            => Ok(await _service.GetById(id));

        [HttpGet("GetPending")]
        public async Task<IActionResult> GetPending()
            => Ok(await _service.GetPending());

        [HttpPost("Approve")]
        // ✅ UPDATED: Accept bedId parameter for specific bed selection
        public async Task<IActionResult> Approve(int id, int bedId)
            => await _service.Approve(id, bedId).ToActionResult();

        [HttpPost("Reject")]
        public async Task<IActionResult> Reject(int id)
            => await _service.Reject(id).ToActionResult();
    }
}

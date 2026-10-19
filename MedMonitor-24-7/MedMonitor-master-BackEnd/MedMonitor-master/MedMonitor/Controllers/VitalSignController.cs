using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MedMonitor.Controllers
{
    public class VitalSignController : BaseController
    {
        private readonly IVitalSignService _service;

        public VitalSignController(IVitalSignService service)
        {
            _service = service;
        }

        [HttpPost("Add")]
        public async Task<IActionResult> Add(VitalSignDto dto)
            => Ok(await _service.Add(dto));

        [HttpGet("GetByPatient")]
        public async Task<IActionResult> GetByPatient(string patientId)
            => Ok(await _service.GetByPatient(patientId));

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(int id)
            => Ok(await _service.Delete(id));
    }
}


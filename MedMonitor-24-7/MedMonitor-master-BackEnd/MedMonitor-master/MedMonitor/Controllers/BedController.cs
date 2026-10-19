using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MedMonitor.Controllers
{
    public class BedController : BaseController
    {
        private readonly IBedService _service;

        public BedController(IBedService service)
        {
            _service = service;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
            => Ok(await _service.GetAll());

        [HttpGet("GetById")]
        public async Task<IActionResult> GetById(int id)
            => Ok(await _service.GetById(id));

        [HttpPost("Create")]
        public async Task<IActionResult> Create(BedDto dto)
            => Ok(await _service.Create(dto));

        [HttpPut("Update")]
        public async Task<IActionResult> Update(BedDto dto)
            => Ok(await _service.Update(dto));

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(int id)
            => Ok(await _service.Delete(id));

        [HttpPost("AssignPatient")]
        public async Task<IActionResult> AssignPatient(int bedId, string patientId)
            => Ok(await _service.AssignPatient(bedId, patientId));

        [HttpPost("RemovePatient")]
        public async Task<IActionResult> RemovePatient(int bedId)
            => Ok(await _service.RemovePatient(bedId));
    }
}

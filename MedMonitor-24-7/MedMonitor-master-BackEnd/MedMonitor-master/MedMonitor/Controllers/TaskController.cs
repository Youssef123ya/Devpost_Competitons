using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Shared.Enum;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace MedMonitor.Controllers
{
    public class TaskController : BaseController
    {
        private readonly ITaskService _service;
        private readonly ILogger<TaskController> _logger;

        public TaskController(ITaskService service, ILogger<TaskController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
            => Ok(await _service.GetAll());

        [HttpGet("GetById")]
        public async Task<IActionResult> GetById(int id)
            => Ok(await _service.GetById(id));

        [HttpPost("Create")]
        public async Task<IActionResult> Create(TaskDto dto)
        {
            try
            {
                _logger.LogInformation("📤 TaskController.Create() received request");
                _logger.LogInformation("Request body: {@TaskDto}", dto);
                var result = await _service.Create(dto);
                _logger.LogInformation("✅ Task created successfully");
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogError("❌ Validation error: {Error}", ex.Message);
                return BadRequest(new { message = ex.Message, code = "VALIDATION_ERROR" });
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error creating task: {Error}", ex.Message);
                return BadRequest(new { message = $"Failed to create task: {ex.Message}", code = "CREATE_ERROR" });
            }
        }

        [HttpPut("Update")]
        public async Task<IActionResult> Update(TaskDto dto)
            => Ok(await _service.Update(dto));

        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(int id)
            => Ok(await _service.Delete(id));

        [HttpPost("ChangeStatus")]
        public async Task<IActionResult> ChangeStatus(int id, TaskStatusEnum status)
            => Ok(await _service.ChangeStatus(id, status));
    }
}

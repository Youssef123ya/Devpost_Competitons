using MedMonitor.Core.Dto;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedMonitor.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class ChatController : BaseController
    {
        private readonly AppDbContext _db;

        public ChatController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("GetMessages")]
        public async Task<IActionResult> GetMessages(string patientId)
        {
            if (string.IsNullOrWhiteSpace(patientId))
                return BadRequest("patientId required");

            var msgs = await _db.ChatMessages
                .Where(m => m.PatientId == patientId)
                .OrderBy(m => m.SentAt)
                .ToListAsync();

            var dtos = msgs.Select(m => new ChatMessageDto
            {
                Id = m.Id,
                PatientId = m.PatientId,
                SenderId = m.SenderId,
                SenderName = m.SenderName,
                SenderRole = m.SenderRole,
                ReceiverId = m.ReceiverId,
                Message = m.Message,
                SentAt = m.SentAt,
                IsRead = m.IsRead
            }).ToList();

            return Ok(dtos);
        }

        [HttpPost("SendMessage")]
        public async Task<IActionResult> SendMessage([FromBody] ChatMessageDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.PatientId))
                return BadRequest("Invalid message");

            var entity = new ChatMessage
            {
                PatientId = dto.PatientId,
                SenderId = dto.SenderId,
                SenderName = dto.SenderName,
                SenderRole = dto.SenderRole,
                ReceiverId = dto.ReceiverId,
                Message = dto.Message,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _db.ChatMessages.Add(entity);
            await _db.SaveChangesAsync();

            dto.Id = entity.Id;
            dto.SentAt = entity.SentAt;

            return Ok(dto);
        }

        [HttpPut("MarkAsRead")]
        public async Task<IActionResult> MarkAsRead(string patientId, string userId)
        {
            if (string.IsNullOrWhiteSpace(patientId) || string.IsNullOrWhiteSpace(userId))
                return BadRequest();

            var msgs = await _db.ChatMessages
                .Where(m => m.PatientId == patientId && m.ReceiverId == userId && !m.IsRead)
                .ToListAsync();

            if (!msgs.Any()) return Ok(true);

            msgs.ForEach(m => m.IsRead = true);
            await _db.SaveChangesAsync();

            return Ok(true);
        }
    }
}

using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Extenstions;
using Microsoft.AspNetCore.Mvc;

namespace MedMonitor.Controllers
{
    public class AttachmentsController : BaseController
    {
        private readonly IAttachmentsService _attachmentsService;
        private readonly ILogger<AttachmentsController> _logger;

        public AttachmentsController(IAttachmentsService attachmentsService, ILogger<AttachmentsController> logger)
        {
            _attachmentsService = attachmentsService;
            _logger = logger;
        }

        private string GetBaseUrl()
        {
            var request = HttpContext?.Request;
            if (request == null)
                return string.Empty;

            return $"{request.Scheme}://{request.Host}";
        }

        private void NormalizeAttachmentUrls(RowsWithPaginationInfo<AttachmentDto> result)
        {
            if (result?.Rows == null)
                return;

            var baseUrl = GetBaseUrl();
            foreach (var item in result.Rows)
            {
                if (item == null || string.IsNullOrWhiteSpace(item.AttachUrl))
                    continue;

                item.AttachUrl = NormalizeAttachmentUrl(item.AttachUrl, baseUrl);
            }

            _logger.LogInformation("📤 [AttachmentsController] Normalized {Count} attachment URLs using baseUrl={BaseUrl}", result.Rows.Count, baseUrl);
        }

        private string NormalizeAttachmentUrl(string rawUrl, string baseUrl)
        {
            if (string.IsNullOrWhiteSpace(rawUrl) || string.IsNullOrWhiteSpace(baseUrl))
                return rawUrl ?? string.Empty;

            var attachmentUrl = rawUrl.Trim().Replace("\\", "/");
            if (attachmentUrl.StartsWith("/"))
            {
                attachmentUrl = $"{baseUrl}{attachmentUrl}";
            }
            else if (!attachmentUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
                     !attachmentUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                attachmentUrl = $"{baseUrl}/{attachmentUrl}";
            }

            try
            {
                if (Uri.TryCreate(attachmentUrl, UriKind.Absolute, out var uri))
                {
                    return uri.ToString();
                }

                return Uri.EscapeUriString(attachmentUrl);
            }
            catch
            {
                _logger.LogWarning("⚠️ [AttachmentsController] Failed to normalize attachment URL '{RawUrl}'. Returning raw URL.", rawUrl);
                return attachmentUrl;
            }
        }

        [HttpPost("ManageAsync")]
        public async Task<IActionResult> ManageAsync([FromForm] AttachmentWriterDto attachmentDto)
        {
            try
            {
                _logger.LogInformation("📤 [AttachmentsController] ManageAsync called. UserId={UserId}", attachmentDto.UserId);
                var result = await _attachmentsService.ManageAttachment(attachmentDto);
                _logger.LogInformation("✅ [AttachmentsController] ManageAsync completed successfully");
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("⚠️ [AttachmentsController] Validation error: {Message}", ex.Message);
                return BadRequest(new { error = ex.Message, code = "VALIDATION_ERROR" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [AttachmentsController] Error in ManageAsync: {Message}\n{StackTrace}", ex.Message, ex.StackTrace);
                return StatusCode(500, new { error = ex.Message, code = "INTERNAL_SERVER_ERROR", details = ex.StackTrace });
            }
        }

        [HttpPost("GetAttachmentByUserId")]
        public async Task<IActionResult> GetAttachmentByUserId([FromQuery] string UserId)
        {
            var result = await _attachmentsService.GetAttachmentByUserId(UserId);
            NormalizeAttachmentUrls(result);
            return Ok(result);
        }

        [HttpPost("GetAttachmentWithoutAudioByUserId")]
        public async Task<IActionResult> GetAttachmentWithoutAudioByUserId([FromQuery] string UserId)
        {
            var result = await _attachmentsService.GetAttachmentWithoutAudioByUserId(UserId);
            NormalizeAttachmentUrls(result);
            return Ok(result);
        }

        [HttpPost("GetAttachmentForFlutter")]
        public async Task<IActionResult> GetAttachmentForFlutter(string userName, string attachmentName)
        {
            var result = await _attachmentsService.GetAttachmentForFlutter(userName, attachmentName);
            if (result.IsSuccess && result.Data != null && !string.IsNullOrWhiteSpace(result.Data.FileUrl))
            {
                result.Data.FileUrl = NormalizeAttachmentUrl(result.Data.FileUrl, GetBaseUrl());
            }
            return Ok(result);
        }

        [HttpDelete("RemoveAttachment")]
        public async Task<IActionResult> RemoveAttachment(int attachmentId)
          => await _attachmentsService.RemoveAttachment(attachmentId).ToActionResult();

        [HttpGet]
        public async Task<IActionResult> ListAsync()
         => Ok(await _attachmentsService.ListAsync());
    }
}

using Akeel.Utilities.EF.Extensions.Models;
using Akeel.Utilities.ValidateResult;
using MedMonitor.Core.Dto;
using Microsoft.AspNetCore.Mvc;

namespace MedMonitor.Core.Interfaces
{
    public interface IAttachmentsService
    {

        Task<ActionResult<List<AttachmentResult>>> ManageAttachment(AttachmentWriterDto attachmentDto);
        Task<RowsWithPaginationInfo<AttachmentDto>> GetAttachmentByUserId(string UserId);
        Task<ValidateResult<bool>> RemoveAttachment(int attachmentId);
        Task<ValidateResult<AttachmentResult>> GetAttachmentForFlutter(string userName, string attachmentName);
        Task<RowsWithPaginationInfo<AttachmentDto>> ListAsync();
        Task<RowsWithPaginationInfo<AttachmentDto>> GetAttachmentWithoutAudioByUserId(string UserId);
    }
}

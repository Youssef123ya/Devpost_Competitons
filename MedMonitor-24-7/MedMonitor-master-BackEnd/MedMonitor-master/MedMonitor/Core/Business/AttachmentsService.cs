using Akeel.Utilities.EF.Extensions.Models;
using Akeel.Utilities.ValidateResult;
using AutoMapper;
using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Shared.Dtos;
using MedMonitor.Shared.Enum;
using Microsoft.AspNetCore.Mvc;

namespace MedMonitor.Core.Business
{
    public class AttachmentsService : IAttachmentsService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IUserAgoraService _userAgoraService;
        private readonly IAgoraManagementService _agoraManagementService;
        private readonly ILogger<AttachmentsService> _logger;

        public AttachmentsService(IUnitOfWork unitOfWork, IMapper mapper, IUserAgoraService userAgoraService,
            IAgoraManagementService agoraManagementService, ILogger<AttachmentsService> logger)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _userAgoraService = userAgoraService;
            _agoraManagementService = agoraManagementService;
            _logger = logger;
        }

        public async Task<RowsWithPaginationInfo<AttachmentDto>> GetAttachmentByUserId(string UserId)
        {
            if (string.IsNullOrWhiteSpace(UserId))
            {
                return new RowsWithPaginationInfo<AttachmentDto>();
            }

            var resolvedUserId = await ResolveActualUserId(UserId);
            var critria = new ListCriteriaDto<Attachment>();
            critria.AddNewInclude(RelatedObjectEnum.User);
            var Attachment = await _unitOfWork.Attachment.ListAttchmentAsync(critria, resolvedUserId ?? UserId);

            return _mapper.Map<RowsWithPaginationInfo<AttachmentDto>>(Attachment);
        }

        public async Task<RowsWithPaginationInfo<AttachmentDto>> GetAttachmentWithoutAudioByUserId(string UserId)
        {
            if (string.IsNullOrWhiteSpace(UserId))
            {
                return new RowsWithPaginationInfo<AttachmentDto>();
            }

            var resolvedUserId = await ResolveActualUserId(UserId);
            var critria = new ListCriteriaDto<Attachment>();
            critria.AddNewInclude(RelatedObjectEnum.User);
            var Attachment = await _unitOfWork.Attachment.ListAttchmentWithoutAudioAsync(critria, resolvedUserId ?? UserId);

            return _mapper.Map<RowsWithPaginationInfo<AttachmentDto>>(Attachment);
        }

        public async Task<RowsWithPaginationInfo<AttachmentDto>> ListAsync()
        {
            var criteria = new ListCriteriaDto<Attachment>();
            criteria.AddNewInclude(RelatedObjectEnum.User);
            var Attachment = await _unitOfWork.Attachment.ListAsync(criteria);
            return _mapper.Map<RowsWithPaginationInfo<AttachmentDto>>(Attachment);
        }

        public async Task<ActionResult<List<AttachmentResult>>> ManageAttachment(AttachmentWriterDto AttachmentDto)
        {
            return await AddAttachments(AttachmentDto);
        }

        public async Task<ValidateResult<AttachmentResult>> GetAttachmentForFlutter(string userName, string attachmentName)
        {
            var User = await _unitOfWork.User.FindAsync(s => s.UserName == userName);
            if (User is null)
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);

            var attach = await _unitOfWork.Attachment.FindAsync(a =>
                a.UserId == User.Id && a.AttachUrl.Contains(attachmentName));

            if (attach is null)
                return ErrorDto.Factory(ErrorCodesEnum.AttachmentIsNotFound);

            return new AttachmentResult
            {
                FileUrl = attach.AttachUrl,
                Type = attach.Type.ToString()
            };
        }

        public async Task<ValidateResult<bool>> RemoveAttachment(int AttachmentId)
        {
            var attachment = await _unitOfWork.Attachment.FindAsync(s => s.Id == AttachmentId);
            if (attachment is null)
                return ErrorDto.Factory(ErrorCodesEnum.AttachmentIsNotFound);

            var User = await _unitOfWork.User.FindAsync(s => s.Id == attachment.UserId);
            if (User is null)
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);

            var username = User?.UserName;
            if (string.IsNullOrEmpty(username))
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", attachment.AttachUrl.TrimStart('/'));

            if (File.Exists(filePath))
            {
                try
                {
                    File.Delete(filePath);
                }
                catch
                {
                    return ErrorDto.Factory(ErrorCodesEnum.FileDeletionFailed);
                }
            }

            _unitOfWork.Attachment.Remove(attachment);
            await _unitOfWork.SaveAsync();

            return true;
        }

        async Task<ActionResult<List<AttachmentResult>>> AddAttachments(AttachmentWriterDto attachmentDto)
        {
            try
            {
                _logger.LogInformation("📤 [AttachmentsService] Starting AddAttachments. Input UserId={UserId}", attachmentDto.UserId);

                // Validate UserId input
                if (string.IsNullOrWhiteSpace(attachmentDto.UserId))
                {
                    _logger.LogError("❌ [AttachmentsService] UserId is null or empty");
                    throw new ArgumentException("UserId is required.");
                }

                string actualUserId = attachmentDto.UserId;

                // Try to find user directly (in case it's a valid UserId/GUID)
                var User = await _unitOfWork.User.FindAsync(c => c.Id == actualUserId);

                // If not found by ID, try to treat it as a PatientId and look up the nurse
                if (User is null)
                {
                    _logger.LogInformation("📤 [AttachmentsService] UserId not found as user ID, treating as PatientId. Attempting nurse lookup...");
                    
                    // Try to find the admission for this patient
                    var admission = await _unitOfWork.AdmissionRequest.FindAsync(a => 
                        a.PatientId == actualUserId);
                    
                    if (admission != null && !string.IsNullOrWhiteSpace(admission.NurseName))
                    {
                        _logger.LogInformation("📤 [AttachmentsService] Found admission. NurseName={NurseName}, looking up user...", admission.NurseName);
                        
                        // Find the nurse user
                        var nurseUser = await _unitOfWork.User.FindAsync(u => u.UserName == admission.NurseName);
                        
                        if (nurseUser != null)
                        {
                            User = nurseUser;
                            actualUserId = nurseUser.Id;
                            _logger.LogInformation("✅ [AttachmentsService] Resolved PatientId {PatientId} to NurseUserId {NurseId}", 
                                attachmentDto.UserId, actualUserId);
                        }
                        else
                        {
                            _logger.LogError("❌ [AttachmentsService] Nurse user not found. NurseName={NurseName}", admission.NurseName);
                            throw new Exception($"Nurse user '{admission.NurseName}' not found for patient {attachmentDto.UserId}.");
                        }
                    }
                    else
                    {
                        _logger.LogError("❌ [AttachmentsService] Neither user ID nor patient admission found for {Input}", actualUserId);
                        throw new Exception($"User not found for ID: {attachmentDto.UserId}");
                    }
                }
                else
                {
                    _logger.LogInformation("✅ [AttachmentsService] Found user directly. UserName={UserName}", User.UserName);
                }

                if (User is null)
                {
                    _logger.LogError("❌ [AttachmentsService] User resolution failed");
                    throw new Exception("User not found.");
                }

                var username = User.UserName;
                if (string.IsNullOrWhiteSpace(username))
                {
                    _logger.LogError("❌ [AttachmentsService] User has no UserName for UserId={UserId}", actualUserId);
                    throw new Exception("User has no UserName.");
                }

                _logger.LogInformation("📤 [AttachmentsService] Using UserName={UserName} for file storage", username);

                // Validate attachments
                if (attachmentDto.Attachments == null || !attachmentDto.Attachments.Any())
                {
                    _logger.LogWarning("⚠️ [AttachmentsService] No attachments provided for user {UserName}", username);
                    return new List<AttachmentResult>();
                }

                // Validate file names list exists
                if (attachmentDto.FileName == null || !attachmentDto.FileName.Any())
                {
                    _logger.LogError("❌ [AttachmentsService] FileName list is null or empty for user {UserName}", username);
                    throw new ArgumentException("FileName list is required and must contain file names.");
                }

                // Validate counts match
                if (attachmentDto.FileName.Count != attachmentDto.Attachments.Count)
                {
                    _logger.LogError("❌ [AttachmentsService] Mismatch: {FileNameCount} file names but {AttachmentCount} attachments for user {UserName}", 
                        attachmentDto.FileName.Count, attachmentDto.Attachments.Count, username);
                    throw new ArgumentException("File names count must match attachments count.");
                }

                // Create user folder under uploads so static files can be served from /uploads
                string baseUploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                string UserFolderPath = Path.Combine(baseUploadsPath, username);

                _logger.LogInformation("📁 [AttachmentsService] Base path={BasePath}, User folder path={UserFolderPath}", baseUploadsPath, UserFolderPath);

                try
                {
                    if (!Directory.Exists(UserFolderPath))
                    {
                        Directory.CreateDirectory(UserFolderPath);
                        _logger.LogInformation("📁 [AttachmentsService] Created directory: {UserFolderPath}", UserFolderPath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ [AttachmentsService] Failed to create directory {UserFolderPath}", UserFolderPath);
                    throw new Exception($"Failed to create folder for user: {ex.Message}", ex);
                }

                var savedAttachments = new List<AttachmentResult>();

                // Process each file
                for (int i = 0; i < attachmentDto.Attachments.Count; i++)
                {
                    try
                    {
                        var file = attachmentDto.Attachments[i];
                        var fileName = Path.GetFileName(attachmentDto.FileName[i]);

                        if (string.IsNullOrWhiteSpace(fileName))
                        {
                            _logger.LogError("❌ [AttachmentsService] Invalid file name at index {Index}", i);
                            throw new ArgumentException($"Invalid file name at index {i}.");
                        }

                        // Sanitize file name and generate a safe filename to avoid spaces/illegal chars in URL
                        fileName = Path.GetFileName(fileName);
                        var extension = Path.GetExtension(fileName);
                        var safeFileName = $"{Guid.NewGuid()}{extension}";
                        var filePath = Path.Combine(UserFolderPath, safeFileName);

                        _logger.LogInformation("💾 [AttachmentsService] Saving file {Index}: {OriginalFileName} as {SafeFileName} to {FilePath}", i, fileName, safeFileName, filePath);

                        // Save file to disk
                        try
                        {
                            using (var stream = new FileStream(filePath, FileMode.Create))
                            {
                                await file.CopyToAsync(stream);
                                _logger.LogInformation("✅ [AttachmentsService] File saved: {SafeFileName}", safeFileName);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "❌ [AttachmentsService] Failed to save file {SafeFileName}", safeFileName);
                            throw new Exception($"Failed to save file {safeFileName}: {ex.Message}", ex);
                        }

                        var fileUrl = $"/uploads/{username}/{Uri.EscapeDataString(safeFileName)}";

                        // Create database record using the resolved actual user ID
                        var newAttachment = new Attachment
                        {
                            UserId = actualUserId,
                            UploadedDate = DateTime.UtcNow,
                            AttachUrl = fileUrl,
                            AddBy = attachmentDto.AddBy ?? username,
                            Type = attachmentDto.Type
                        };

                        _unitOfWork.Attachment.Add(newAttachment);

                        savedAttachments.Add(new AttachmentResult
                        {
                            Id = newAttachment.Id,
                            FileUrl = fileUrl,
                            Type = newAttachment.Type.ToString()
                        });

                        _logger.LogInformation("📝 [AttachmentsService] Added attachment record for {FileName} with AttachUrl={AttachUrl}", fileName, fileUrl);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ [AttachmentsService] Error processing file at index {Index}: {Message}", i, ex.Message);
                        throw;
                    }
                }

                // Save all records to database
                try
                {
                    await _unitOfWork.SaveAsync();
                    _logger.LogInformation("✅ [AttachmentsService] Successfully saved {Count} attachments. UserId={UserId}, Username={Username}", 
                        savedAttachments.Count, actualUserId, username);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ [AttachmentsService] Failed to save attachments to database for user {UserName}", username);
                    throw new Exception($"Failed to save attachments to database: {ex.Message}", ex);
                }

                return savedAttachments;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [AttachmentsService] Unexpected error in AddAttachments: {Message}\n{StackTrace}", ex.Message, ex.StackTrace);
                throw;
            }
        }

        private async Task<string?> ResolveActualUserId(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return null;

            // If the ID is already a valid user ID, return it.
            var user = await _unitOfWork.User.FindAsync(u => u.Id == userId);
            if (user != null)
                return user.Id;

            // If this appears to be a patient identifier, resolve the nurse user.
            var admission = await _unitOfWork.AdmissionRequest.FindAsync(a => a.PatientId == userId);
            if (admission != null && !string.IsNullOrWhiteSpace(admission.NurseName))
            {
                var nurseUser = await _unitOfWork.User.FindAsync(u => u.UserName == admission.NurseName);
                if (nurseUser != null)
                    return nurseUser.Id;
            }

            // Fallback to the original value if no resolution is possible.
            return null;
        }
    }
}

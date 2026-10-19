using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Shared.Enum;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MedMonitor.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _dbContext;
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(AppDbContext dbContext, ILogger<ChatHub> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userIdClaim = Context.User?.FindFirst("UserId")?.Value ?? "null";
            var nameIdClaim = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "null";
            var path = Context.GetHttpContext()?.Request.Path;
            var query = Context.GetHttpContext()?.Request.QueryString.Value;

            _logger.LogInformation("[E2E:Backend][ChatHub] Connected. ConnectionId={ConnectionId}, UserIdentifier={UserIdentifier}, UserIdClaim={UserIdClaim}, NameIdClaim={NameIdClaim}, Path={Path}, Query={Query}",
                Context.ConnectionId,
                Context.UserIdentifier ?? "null",
                userIdClaim,
                nameIdClaim,
                path,
                query);

            _logger.LogInformation("[E2E:Backend][ChatHub] SignalR client connected and authenticated for user {UserIdentifier}", Context.UserIdentifier ?? "null");
            try
            {
                var userIdentifier = Context.UserIdentifier;
                if (!string.IsNullOrWhiteSpace(userIdentifier))
                {
                    var userGroup = $"user-{userIdentifier}";
                    await Groups.AddToGroupAsync(Context.ConnectionId, userGroup);
                    _logger.LogInformation("[E2E:Backend][ChatHub] Added connection {ConnectionId} to group {Group}", Context.ConnectionId, userGroup);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[E2E:Backend][ChatHub] Failed adding connection to user group: {Message}", ex.Message);
            }

            await base.OnConnectedAsync();
            return;
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            _logger.LogInformation("[E2E:Backend][ChatHub] Disconnected. ConnectionId={ConnectionId}, UserIdentifier={UserIdentifier}, Exception={Exception}",
                Context.ConnectionId,
                Context.UserIdentifier ?? "null",
                exception?.Message ?? "none");
            try
            {
                var userIdentifier = Context.UserIdentifier;
                if (!string.IsNullOrWhiteSpace(userIdentifier))
                {
                    var userGroup = $"user-{userIdentifier}";
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, userGroup);
                    _logger.LogInformation("[E2E:Backend][ChatHub] Removed connection {ConnectionId} from group {Group}", Context.ConnectionId, userGroup);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[E2E:Backend][ChatHub] Failed removing connection from user group: {Message}", ex.Message);
            }

            await base.OnDisconnectedAsync(exception);
            return;
        }

        private static string GetGroupName(string patientId) => $"patient-{patientId}";

        public async Task JoinPatientChat(string patientId)
        {
            var userId = Context.User?.FindFirst("UserId")?.Value;
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new HubException("Unauthorized");
            }

            var user = await _dbContext.Users.FindAsync(userId);
            if (user is null)
            {
                throw new HubException("User not found");
            }

            var admission = await _dbContext.AdmissionRequests.FirstOrDefaultAsync(a => a.PatientId == patientId);
            if (admission is null)
            {
                throw new HubException("Patient admission record not found");
            }

            if (!IsUserAuthorized(user, admission, patientId))
            {
                throw new HubException("Access denied for this patient chat");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(patientId));
        }

        public async Task LeavePatientChat(string patientId)
        {
            if (string.IsNullOrWhiteSpace(patientId))
                return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGroupName(patientId));
        }

        public async Task SendMessageToPatient(string patientId, object messageObj)
        {
            var userId = Context.User?.FindFirst("UserId")?.Value;
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new HubException("Unauthorized");
            }

            var user = await _dbContext.Users.FindAsync(userId);
            if (user is null)
            {
                throw new HubException("User not found");
            }

            var admission = await _dbContext.AdmissionRequests.FirstOrDefaultAsync(a => a.PatientId == patientId);
            if (admission is null)
            {
                throw new HubException("Patient admission record not found");
            }

            if (!IsUserAuthorized(user, admission, patientId))
            {
                throw new HubException("Access denied for this patient chat");
            }

            // messageObj may be a raw string (legacy client) or a JSON-like object with sender/receiver/message
            string senderId = user.Id;
            string senderName = user.UserName;
            string senderRole = user.Role.ToString();
            string receiverId = string.Empty;
            string messageText = string.Empty;

            if (messageObj is string s)
            {
                messageText = s;
            }
            else if (messageObj is IDictionary<string, object> dict)
            {
                senderId = dict.ContainsKey("senderId") ? dict["senderId"]?.ToString() ?? senderId : senderId;
                senderName = dict.ContainsKey("senderName") ? dict["senderName"]?.ToString() ?? senderName : senderName;
                senderRole = dict.ContainsKey("senderRole") ? dict["senderRole"]?.ToString() ?? senderRole : senderRole;
                receiverId = dict.ContainsKey("receiverId") ? dict["receiverId"]?.ToString() ?? string.Empty : string.Empty;
                messageText = dict.ContainsKey("message") ? dict["message"]?.ToString() ?? string.Empty : (dict.ContainsKey("messageText") ? dict["messageText"]?.ToString() ?? string.Empty : string.Empty);
            }
            else
            {
                // attempt to stringify other types
                messageText = messageObj?.ToString() ?? string.Empty;
            }

            var chat = new ChatMessage
            {
                PatientId = patientId,
                SenderId = senderId,
                SenderName = senderName,
                SenderRole = senderRole,
                ReceiverId = receiverId,
                Message = messageText,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _dbContext.ChatMessages.Add(chat);
            await _dbContext.SaveChangesAsync();

            var payload = new
            {
                id = chat.Id,
                senderId = chat.SenderId,
                senderName = chat.SenderName,
                patientId = chat.PatientId,
                receiverId = chat.ReceiverId,
                message = chat.Message,
                messageText = chat.Message,
                sentAt = chat.SentAt.ToString("o"),
                isRead = chat.IsRead
            };

            await Clients.Group(GetGroupName(patientId)).SendAsync("ReceiveMessage", payload);
        }

        private bool IsUserAuthorized(User user, AdmissionRequest admission, string patientId)
        {
            if (user.Id == patientId)
                return true;

            if (user.Role == UserRoleEnum.Doctor)
                return true;

            if (user.Role == UserRoleEnum.Nurse &&
                !string.IsNullOrWhiteSpace(admission.NurseName) &&
                admission.NurseName.Equals(user.UserName, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        }
    }
}

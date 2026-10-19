using System.ComponentModel.DataAnnotations;

namespace MedMonitor.Core.Dto
{
    public class WebRequestUserAgoraDto
    {
        public string? path { get; set; }
        public string? uri { get; set; }
        public Int64? timestamp { get; set; }
        public string? organization { get; set; }
        public string? application { get; set; }
        public List<UserAgoraDto>? entities { get; set; }
    }
    public class UserAgoraDto
    {
        public string? uuid { get; set; }
        public string? type { get; set; }
        public Int64 created { get; set; }
        public Int64 modified { get; set; }
        public string? username { get; set; }
        public bool? activated { get; set; }
    }

    public class UserAgoraLogin
    {
        [Required] public string UserName { get; set; } = null!;
        [Required] public string Password { get; set; } = null!;
        [Required] public string AgoraToken { get; set; } = null!;
    }

    public class UserAgoraDeleteDto
    {
        [Required] public string UserName { get; set; } = null!;
        [Required] public string AgoraToken { get; set; } = null!;
    }

    public class UserAgoraChatTokenDto
    {
        public string? UserName { get; set; } = null!;
        public string? ChannelName { get; set; } = null!;
        public string UserToken { get; set; } = null!;
    }
}

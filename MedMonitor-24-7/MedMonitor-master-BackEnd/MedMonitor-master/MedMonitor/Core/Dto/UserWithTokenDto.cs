namespace MedMonitor.Core.Dto
{
    public class UserWithTokenDto : UserWriterDto
    {
        public string? Token { get; set; }
        public string? TockenAgora { get; set; }
        public string? TockenUserAgoraChat { get; set; }
        public string? UserName { get; set; }
    }
}

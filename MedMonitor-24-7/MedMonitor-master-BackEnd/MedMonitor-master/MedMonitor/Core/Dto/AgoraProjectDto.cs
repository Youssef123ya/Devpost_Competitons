using System.ComponentModel.DataAnnotations;

namespace MedMonitor.Core.Dto
{
    public class AgoraProjectDto
    {
        public string? id { get; set; }
        [Required] public string name { get; set; } = null!;
        public int status { get; set; }
        public string? sign_key { get; set; }
        public string? vendor_key { get; set; } = null!;
        public string? recording_server { get; set; }
        public int? created { get; set; }
    }

    public class AgoraDto
    {
        public bool success { get; set; }
        public List<AgoraProjectDto>? projects { get; set; }
    }

    public class AgoraProjectWithTokenDto
    {
        public string? id { get; set; }
        public string name { get; set; } = null!;
        public int status { get; set; }
        public string? sign_key { get; set; }
        public string? vendor_key { get; set; } = null!;
        public string? recording_server { get; set; }
        public int? created { get; set; }
        public string? Token { get; set; }
    }
}

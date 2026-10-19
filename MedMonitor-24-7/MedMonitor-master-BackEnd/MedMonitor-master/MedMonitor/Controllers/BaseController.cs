using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace MedMonitor.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class BaseController : ControllerBase
    {
        public string CurrentUserId => User.FindFirstValue("UserId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    }
}

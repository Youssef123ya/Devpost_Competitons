using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Extenstions;
using Microsoft.AspNetCore.Mvc;

namespace MedMonitor.Controllers
{
    public class UsersController : BaseController
    {
        private readonly IUsersService _UsersService;

        public UsersController(IUsersService UsersService)
        {
            _UsersService = UsersService;
        }

        [HttpPost("ManageAsync")]
        public async Task<IActionResult> ManageAsync(UserWriterDto UserDto)
            => await _UsersService.ManageUser(UserDto).ToActionResult();

        [HttpPost("GetUserById")]
        public async Task<IActionResult> GetUserById(string UserId)
            => await _UsersService.GetUserById(UserId).ToActionResult();

        [HttpDelete("RemoveUser")]
        public async Task<IActionResult> RemoveUser(string UserId)
           => await _UsersService.RemoveUser(UserId).ToActionResult();

        [HttpGet]
        public async Task<IActionResult> ListAsync()
         => Ok(await _UsersService.ListAsync());
    }
}

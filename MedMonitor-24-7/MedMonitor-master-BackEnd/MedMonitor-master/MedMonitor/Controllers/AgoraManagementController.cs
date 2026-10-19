using MedMonitor.Core.Interfaces;
using MedMonitor.Extenstions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MedMonitor.Controllers
{
    public class AgoraManagementController : BaseController
    {
        private readonly IAgoraManagementService _agoraManagementService;

        public AgoraManagementController(IAgoraManagementService agoraManagementService)
        {
            _agoraManagementService = agoraManagementService;
        }

        [HttpGet]
        public async Task<IActionResult> ListProjectsAgora()
        {
            var result = await _agoraManagementService.ListAsync();
            return Ok(result);
        }


        [HttpGet("GetProjectsAgoraById")]
        public async Task<IActionResult> GetProjectsAgoraById()
        {
            string id = "G72nmjX2M";
            string name = "My New Project";
            return await _agoraManagementService.GetAgoraProjectById(id, name).ToActionResult();
        }

        [HttpGet("GetAgoraProjectWithToken")]
        public async Task<IActionResult> GetAgoraProjectWithToken()
        {
            string id = "G72nmjX2M";
            string name = "My New Project";
            return await _agoraManagementService.GetAgoraProjectWithToken(id, name).ToActionResult();
        }


    }
}

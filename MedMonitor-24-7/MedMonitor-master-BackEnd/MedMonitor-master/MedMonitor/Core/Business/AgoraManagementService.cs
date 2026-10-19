using Akeel.Utilities.ValidateResult;
using AutoMapper;
using MedMonitor.Core.Agora;
using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Extenstions;
using MedMonitor.Shared.Enum;
using System.Net;
using System.Text.Json;

namespace MedMonitor.Core.Business
{
    public class AgoraManagementService : IAgoraManagementService
    {
        private readonly IMapper _mapper;

        public AgoraManagementService(IMapper mapper)
        {
            _mapper = mapper;
        }

        public Task<ValidateResult<AgoraProjectDto>> AddAsync(AgoraProjectDto agoraProjectDto)
        {
            throw new NotImplementedException();
        }

        public async Task<ValidateResult<AgoraProjectDto>> GetAgoraProjectById(string agoraProjectId, string agoraProjectName)
        {
            string action = "/project?id=" + agoraProjectId + "&name=" + agoraProjectName;
            var result = await GetAgoraProject(action);
            if (result.success == false)
                return ErrorDto.Factory(ErrorCodesEnum.ProjectAgoraIsNotFound);
            return result.projects[0];
        }

        public async Task<ValidateResult<AgoraProjectWithTokenDto>> GetAgoraProjectWithToken(string agoraProjectId, string agoraProjectName)
        {
            string action = "/project?id=" + agoraProjectId + "&name=" + agoraProjectName;
            var result = await GetAgoraProject(action);
            if (result.success == false)
                return ErrorDto.Factory(ErrorCodesEnum.ProjectAgoraIsNotFound);
            if (result.projects == null || result.projects.Count <= 0)
                return ErrorDto.Factory(ErrorCodesEnum.ProjectsNotFound);

            var agoraProjectWithTokenDto = await GenerateTokenAgora(result.projects[0]);
            return agoraProjectWithTokenDto;
        }

        public async Task<List<AgoraProjectDto>> ListAsync()
        {
            var result = await GetAgoraProject("/projects");
            return result.projects;
        }

        public Task<ValidateResult<bool>> RemoveAgoraProject(string agoraProjectId)
        {
            throw new NotImplementedException();
        }

        private async Task<AgoraDto> GetAgoraProject(string url)
        {
            WebRequest request = WebRequest.Create(BaseUrl.UrlAgoraProjects + url);
            request.Method = "GET";
            request.Headers.Add(AgoraHelper.GenerateAuthorization());
            request.ContentType = "application/json";
            WebResponse response = await request.GetResponseAsync();
            Console.WriteLine(((HttpWebResponse)response).StatusDescription);
            AgoraDto agoraDto = new AgoraDto();
            using (Stream dataStream = response.GetResponseStream())
            {
                StreamReader reader = new StreamReader(dataStream);
                string responseFromServer = reader.ReadToEnd();

                agoraDto = JsonSerializer.Deserialize<AgoraDto>(responseFromServer);
            }
            response.Close();
            return agoraDto;
        }

        private async Task<AgoraProjectWithTokenDto> GenerateTokenAgora(AgoraProjectDto agoraProjectDto)
        {
            string token = ChatTokenBuilder.buildAppToken(agoraProjectDto.vendor_key, agoraProjectDto.sign_key, 360000);

            var result = _mapper.Map<AgoraProjectWithTokenDto>(agoraProjectDto);
            result.Token = token;

            return result;
        }
    }
}

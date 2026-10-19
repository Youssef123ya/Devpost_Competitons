using Akeel.Utilities.EF.Extensions.Models;
using Akeel.Utilities.ValidateResult;
using AutoMapper;
using MedMonitor.Core.Agora;
using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Extenstions;
using MedMonitor.Shared.Enum;
using System.Net;
using System.Text;
using System.Text.Json;

namespace MedMonitor.Core.Business
{
  
    public class UserAgoraService : IUserAgoraService
    {
        private readonly IAgoraManagementService _agoraManagementService;
        private readonly IMapper _mapper;

        public UserAgoraService(IAgoraManagementService agoraManagementService, IMapper mapper)
        {
            _agoraManagementService = agoraManagementService;
            _mapper = mapper;
        }

        public async Task<ValidateResult<UserAgoraDto>> AddAsync(UserAgoraLogin userAgoraLogin)
        {
            WebRequest request = WebRequest.Create(BaseUrl.UrlAgoraChat + "/411234915/1426204/users");
            request.Method = "POST";
            request.Headers.Add(HttpRequestHeader.Authorization, "Bearer " + userAgoraLogin.AgoraToken);
            var data = Encoding.ASCII.GetBytes
                ("{\"username\":\"" + userAgoraLogin.UserName + "\",\"password\":\"" + userAgoraLogin.Password + "\"}");
            request.Method = "POST";
            request.ContentType = "application/json";
            request.ContentLength = data.Length;

            WebRequestUserAgoraDto webRequestUserAgoraDto = new WebRequestUserAgoraDto();
            using (var stream = request.GetRequestStream())
                stream.Write(data, 0, data.Length);

            var response = (HttpWebResponse)await request.GetResponseAsync();


            Stream dataStream = response.GetResponseStream();
            StreamReader reader = new StreamReader(dataStream);
            string responseFromServer = reader.ReadToEnd();

            webRequestUserAgoraDto = JsonSerializer.Deserialize<WebRequestUserAgoraDto>(responseFromServer);
            response.Close();
            return webRequestUserAgoraDto.entities[0];
        }

        public Task<ValidateResult<UserAgoraDto>> GetUserAgoraDtoById(int userId)
        {
            throw new NotImplementedException();
        }

        public Task<RowsWithPaginationInfo<UserAgoraDto>> ListAsync()
        {
            throw new NotImplementedException();
        }

        public async Task<ValidateResult<bool>> RemoveUserAgora(UserAgoraDeleteDto userAgoraDeleteDto)
        {
            WebRequest request = WebRequest.Create(BaseUrl.UrlAgoraChat + "/411234915/1426204/users/" + userAgoraDeleteDto.UserName);
            request.Method = "DELETE";
            request.Headers.Add(HttpRequestHeader.Authorization, "Bearer " + userAgoraDeleteDto.AgoraToken);
            request.Headers.Add(HttpRequestHeader.Accept, "application/json");

            var response = (HttpWebResponse)await request.GetResponseAsync();

            response.Close();
            if (response.StatusCode == HttpStatusCode.OK)
                return true;

            return false;
        }

        public async Task<ValidateResult<UserAgoraChatTokenDto>> GenerateTokenForUserCall(
            UserCallDto userCallDto, string agoraProjectId, string agoraProjectName)
        {
            var agoraProjectDto = await _agoraManagementService.GetAgoraProjectById(agoraProjectId, agoraProjectName);
            if (agoraProjectDto == null)
                return ErrorDto.Factory(ErrorCodesEnum.ProjectAgoraIsNotFound);

            if (agoraProjectDto.IsFailure)
                return ErrorDto.Factory(ErrorCodesEnum.IsFailure);

            string token = RtcTokenBuilder.buildTokenWithRtm(
                agoraProjectDto.Data.vendor_key, agoraProjectDto.Data.sign_key, userCallDto.ChannelName, userCallDto.Account, userCallDto.Role, 3600, 1800);

            return new UserAgoraChatTokenDto
            {
                ChannelName = userCallDto.ChannelName,
                UserToken = token,
            };
        }

        public async Task<ValidateResult<UserAgoraChatTokenDto>> GenerateTokenForUserChat(string userName, string agoraProjectId, string agoraProjectName)
        {

            //check in db and agora
            var agoraProjectDto = await _agoraManagementService.GetAgoraProjectById(agoraProjectId, agoraProjectName);
            if (agoraProjectDto == null)
                return ErrorDto.Factory(ErrorCodesEnum.ProjectAgoraIsNotFound);

            if (agoraProjectDto.IsFailure)
                return ErrorDto.Factory(ErrorCodesEnum.IsFailure);

            string token = ChatTokenBuilder.buildUserToken(agoraProjectDto.Data.vendor_key, agoraProjectDto.Data.sign_key, userName, 360000);

            return new UserAgoraChatTokenDto
            {
                UserName = userName,
                UserToken = token,
            };
        }
    }
}

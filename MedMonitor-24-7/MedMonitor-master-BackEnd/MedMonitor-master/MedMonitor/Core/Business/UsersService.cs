using Akeel.Utilities.EF.Extensions.Models;
using Akeel.Utilities.ValidateResult;
using AutoMapper;
using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Infrastructure.Repositories.QueryHelpers;
using MedMonitor.Shared.Dtos;
using MedMonitor.Shared.Enum;

namespace MedMonitor.Core.Business
{
    public class UsersService : IUsersService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IUserAgoraService _userAgoraService;
        private readonly IAgoraManagementService _agoraManagementService;

        public UsersService(IUnitOfWork unitOfWork, IMapper mapper, IUserAgoraService userAgoraService,
 IAgoraManagementService agoraManagementService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _userAgoraService = userAgoraService;
            _agoraManagementService = agoraManagementService;
        }

        public async Task<ValidateResult<UserWriterDto>> GetUserById(string UserId)
        {
            var User =
                await _unitOfWork.User.FindAsNotTrackingAsync(s =>
                s.Id == UserId,
                UserQueryHelper.Instance,
                GetCriteriaDto.Default.AddNewInclude(RelatedObjectEnum.Attachments));
            if (User is null)
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);

            return _mapper.Map<UserWriterDto>(User);
        }

        public async Task<RowsWithPaginationInfo<UserWriterDto>> ListAsync()
        {
            var criteria = new ListCriteriaDto<MedMonitor.Infrastructure.Models.User>();
            var User = await _unitOfWork.User.ListAsync(criteria);
            return _mapper.Map<RowsWithPaginationInfo<UserWriterDto>>(User);
        }

        public async Task<ValidateResult<UserWriterDto>> ManageUser(UserWriterDto UserDto)
        {
            var checks = await DatabaseChecks(UserDto);
            if (checks.IsFailure)
                return checks.Error;

            return UserDto.Id == string.Empty
                ? await AddUser(UserDto)
                : await EditUser(UserDto);
        }

        public async Task<ValidateResult<bool>> RemoveUser(string UserId)
        {
            var User = await _unitOfWork.User.FindAsync(s => s.Id == UserId);
            if (User is null)
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);

          

            if ((bool)await _unitOfWork.Attachment.AnyAsync(s => s.UserId == UserId))
                return ErrorDto.Factory(ErrorCodesEnum.UserIsRelatedToAttachment);

            
            string imagesBasePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Images");
            string UserFolderPath = Path.Combine(imagesBasePath, User.UserName);

            if (Directory.Exists(UserFolderPath))
            {
                Directory.Delete(UserFolderPath, true);
            }
            _unitOfWork.User.Remove(User);
            await _unitOfWork.SaveAsync();
            return true;
        }

        #region Private Method

        async Task<ValidateResult<UserWriterDto>> AddUser(UserWriterDto UserDto)
        {
            var User = _mapper.Map<MedMonitor.Infrastructure.Models.User>(UserDto);
            _unitOfWork.User.Add(User);

            await _unitOfWork.SaveAsync();
            return _mapper.Map<UserWriterDto>(User);
        }
        async Task<ValidateResult<UserWriterDto>> EditUser(UserWriterDto UserDto)
        {
            var User = await _unitOfWork.User.FindAsync(s => s.Id == UserDto.Id);
            if (User is null)
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);

            User.Email = UserDto.Email;
            User.PhoneNumber = UserDto.PhoneNumber;

            User.UserName = UserDto.UserName;
            User.Gender = UserDto.Gender;
            User.DateOfBirth = UserDto.DateOfBirth;
            if (UserDto.Role.HasValue)
            {
                User.Role = UserDto.Role.Value;
            }
            User.Specialization = UserDto.Specialization;

            string id = "G72nmjX2M";
            string name = "My New Project";
            var agora = await _agoraManagementService.GetAgoraProjectWithToken(id, name);
            User.TockenAgora = agora.Data.Token;

            var TockenUserAgoraChat = await _userAgoraService.GenerateTokenForUserChat(User.UserName, id, name);
            if (TockenUserAgoraChat != null)
                User.TockenUserAgoraChat = TockenUserAgoraChat.Data.UserToken;

            string imagesBasePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Images");
            string UserFolderPath = Path.Combine(imagesBasePath, User.UserName);
            List<string> validExtensions = new List<string> { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp" };

            if (!Directory.Exists(UserFolderPath))
            {
                Directory.CreateDirectory(UserFolderPath);
            }

            if (UserDto.Image == null)
            {
                var existingImages = Directory.GetFiles(UserFolderPath, "*.*", SearchOption.TopDirectoryOnly)
                    .Where(f => validExtensions.Any(ext => f.ToLower().EndsWith(ext)))
                    .ToList();

                if (existingImages.Any())
                {
                    string existingImage = existingImages.First();
                    string imageUrl = "/Images/" + User.UserName + "/" + Path.GetFileName(existingImage);
                    User.ImageUrl = imageUrl;
                    UserDto.ImageUrl = imageUrl;
                }
                else
                {
                    string defaultImageUrl = "/Images/User/UserProfile.jpg";
                    User.ImageUrl = defaultImageUrl;
                    UserDto.ImageUrl = defaultImageUrl;
                }
            }
            else
            {
                string fileExtension = Path.GetExtension(UserDto.Image.FileName).ToLower();
                if (!validExtensions.Contains(fileExtension))
                {
                    return ErrorDto.Factory(ErrorCodesEnum.InvalidImageFormat);
                }

                var existingImages = Directory.GetFiles(UserFolderPath, "*.*", SearchOption.TopDirectoryOnly)
                    .Where(f => validExtensions.Any(ext => f.ToLower().EndsWith(ext)))
                    .ToList();

                foreach (var existingImage in existingImages)
                {
                    File.Delete(existingImage);
                }
                string newImageName = User.UserName + "Profile" + fileExtension;
                string newImagePath = Path.Combine(UserFolderPath, newImageName);

                using (var fileStream = new FileStream(newImagePath, FileMode.Create))
                {
                    await UserDto.Image.CopyToAsync(fileStream);
                }

                string imageUrl = "/Images/" + User.UserName + "/" + newImageName;
                User.ImageUrl = imageUrl;
                UserDto.ImageUrl = imageUrl;
            }

            _unitOfWork.User.Update(User);
            await _unitOfWork.SaveAsync();
            return _mapper.Map<UserWriterDto>(User);
        }

        async Task<ValidateResult<bool>> DatabaseChecks(UserWriterDto UserDto)
        {
            if ((bool)await _unitOfWork.User.AnyAsync(s =>
                    s.Id != UserDto.Id &&
                    s.Email.ToLower().Trim() == UserDto.Email.ToLower().Trim()))
                return ErrorDto.Factory(ErrorCodesEnum.DuplicateEntryEmail);

            if (!string.IsNullOrWhiteSpace(UserDto.UserName))
                if ((bool)await _unitOfWork.User.AnyAsync(s =>
                        s.Id != UserDto.Id &&
                        s.UserName.ToLower().Trim() == UserDto.UserName.ToLower().Trim()))
                    return ErrorDto.Factory(ErrorCodesEnum.UserNameIsAlreadyExists);

            if ((bool)await _unitOfWork.User.AnyAsync(s =>
                   s.Id != UserDto.Id &&
                   s.PhoneNumber.ToLower().Trim() == UserDto.PhoneNumber.ToLower().Trim()))
                return ErrorDto.Factory(ErrorCodesEnum.PhoneNumberIsAlreadyExists);

            return true;
        }
        #endregion
    }
}

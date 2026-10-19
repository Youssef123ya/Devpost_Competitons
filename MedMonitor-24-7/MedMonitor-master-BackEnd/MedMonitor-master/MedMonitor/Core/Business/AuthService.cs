using Akeel.Utilities.EF.Extensions.Models;
using Akeel.Utilities.ValidateResult;
using AutoMapper;
using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Infrastructure.Repositories.QueryHelpers;
using MedMonitor.Shared.Dtos;
using MedMonitor.Shared.Enum;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace MedMonitor.Core.Business
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly AppDbContext _context;
        private readonly SignInManager<User> _signUserInManager;
        private readonly UserManager<User> _userManager;
        private readonly string _jwtKey;
        private readonly string _jwtIssuer;
        private readonly string _jwtAud;
        private readonly IMapper _mapper;
        private readonly IEmailSender _emailSender;
        private readonly IUserAgoraService _userAgoraService;
        private readonly IAgoraManagementService _agoraManagementService;

        public AuthService(
            IUnitOfWork unitOfWork,
            IConfiguration configuration,
            IMapper mapper,
            SignInManager<User> signUserInManager,
            UserManager<User> userManager,
            AppDbContext context,
            IEmailSender emailSender,
            IUserAgoraService userAgoraService,
            IAgoraManagementService agoraManagementService)
        {
            _unitOfWork = unitOfWork;
            _jwtKey = configuration.GetSection("Jwt:Key").Value;
            _jwtIssuer = configuration.GetSection("Jwt:Issuer").Value;
            _jwtAud = configuration.GetSection("Jwt:Audience").Value;
            _mapper = mapper;
            _signUserInManager = signUserInManager;
            _userManager = userManager;
            _context = context;
            _emailSender = emailSender;
            _userAgoraService = userAgoraService;
            _agoraManagementService = agoraManagementService;
        }

        public async Task<ValidateResult<UserWithTokenDto>> Login(LoginDto loginDto)
        {
            var user = await _unitOfWork.User.FindAsNotTrackingAsync(
                u => u.UserName.ToLower() == loginDto.UserName.ToLower(),
                UserQueryHelper.Instance,
                GetCriteriaDto.Default.AddNewIncludes(RelatedObjectEnum.Attachments));

            if (user is null)
                return ErrorDto.Factory(ErrorCodesEnum.IncorrectUserNameOrPassword);

            var userActive = await _unitOfWork.User.FindAsNotTrackingAsync(
                u => u.UserName.ToLower() == loginDto.UserName.ToLower() && u.IsActive == false,
                UserQueryHelper.Instance,
                GetCriteriaDto.Default.AddNewIncludes(RelatedObjectEnum.Attachments));

            if (userActive != null)
                return ErrorDto.Factory(ErrorCodesEnum.IncorrectUserNameOrPassword);

            var result = await _signUserInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
            if (!result.Succeeded)
                return ErrorDto.Factory(ErrorCodesEnum.IncorrectUserNameOrPassword);

            string id = "G72nmjX2M";
            string name = "My New Project";

            var agora = await _agoraManagementService.GetAgoraProjectWithToken(id, name);
            if (agora?.Data?.Token != null)
            {
                user.TockenAgora = agora.Data.Token;
            }
            var tokenUserAgoraChat = await _userAgoraService.GenerateTokenForUserChat(user.UserName, id, name);
            if (tokenUserAgoraChat?.Data?.UserToken != null)
            {
                user.TockenUserAgoraChat = tokenUserAgoraChat.Data.UserToken;
            }
            _unitOfWork.User.Update(user);
            await _unitOfWork.SaveAsync();

            var userDto = _mapper.Map<UserDto>(user);
            return GenerateToken(userDto);
        }
        public async Task<ValidateResult<bool>> ChangePasswordUser(ChangePasswordNotTokenDto changePasswordDto)
        {
            Console.WriteLine($"[DEBUG ChangePasswordUser] email={changePasswordDto.Email}, userId={changePasswordDto.UserId}, otp={changePasswordDto.Otp}");
            if (string.IsNullOrWhiteSpace(changePasswordDto.Email) || string.IsNullOrWhiteSpace(changePasswordDto.Otp))
                return ErrorDto.Factory(ErrorCodesEnum.InvalidOtp);

            var user = await _userManager.FindByEmailAsync(changePasswordDto.Email);
            if (user is null)
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);

            Console.WriteLine($"[DEBUG ChangePasswordUser] DB userId={user.Id}, ResetOtp={user.ResetOtp}, OtpExpiry={user.OtpExpiry}");
            var storedOtp = user.ResetOtp?.Trim();
            var providedOtp = changePasswordDto.Otp.Trim();

            if (user.Id != changePasswordDto.UserId ||
                string.IsNullOrEmpty(storedOtp) ||
                storedOtp != providedOtp)
            {
                Console.WriteLine($"[DEBUG ChangePasswordUser] otp mismatch or expired for email={changePasswordDto.Email}");
                Console.WriteLine($"[DEBUG ChangePasswordUser] DB OTP: '{user.ResetOtp}'");
                Console.WriteLine($"[DEBUG ChangePasswordUser] Sent OTP: '{changePasswordDto.Otp}'");
                Console.WriteLine($"[DEBUG ChangePasswordUser] Expiry: {user.OtpExpiry}");
                Console.WriteLine($"[DEBUG ChangePasswordUser] Current UTC: {DateTime.UtcNow}");
                return ErrorDto.Factory(ErrorCodesEnum.InvalidOtp);
            }

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await _userManager.ResetPasswordAsync(user, resetToken, changePasswordDto.NewPassword);

            if (!resetResult.Succeeded)
                return ErrorDto.Factory(ErrorCodesEnum.NotChange, new Exception(resetResult.Errors.First().Code));

            user.ResetOtp = null;
            user.OtpExpiry = null;
            await _userManager.UpdateAsync(user);
            return true;
        }
        public async Task<ValidateResult<bool>> ChangePassword(ChangePasswordDto changePasswordDto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(a => a.Id == changePasswordDto.UserId);
            if (user is null)
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);

            var result =
                await _userManager.ChangePasswordAsync(user, changePasswordDto.OldPassword, changePasswordDto.NewPassword);

            if (!result.Succeeded)
                return ErrorDto.Factory(ErrorCodesEnum.OldPasswordIsIncorrect);

            return true;
        }

     
        public async Task<ValidateResult<bool>> ChangePasswordUser(ChangePasswordDto changePasswordDto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(a => a.Id == changePasswordDto.UserId);
            if (user is null)
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);

            var result =
                await _userManager.ChangePasswordAsync(user, changePasswordDto.OldPassword, changePasswordDto.NewPassword);

            if (!result.Succeeded)
                return ErrorDto.Factory(ErrorCodesEnum.OldPasswordIsIncorrect);

            return true;
        }

        public async Task<ValidateResult<UserWithTokenDto>> RegisterUser(UserRegisterDto UserRegisterDto)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (await _context.Users.AnyAsync(c => c.UserName == UserRegisterDto.UserName))
                    return ErrorDto.Factory(ErrorCodesEnum.DuplicateEntryUserName);

                if (await _context.Users.AnyAsync(c => c.Email == UserRegisterDto.Email))
                    return ErrorDto.Factory(ErrorCodesEnum.DuplicateEntryEmail);

                if (await _context.Users.AnyAsync(c => c.PhoneNumber == UserRegisterDto.PhoneNumber))
                    return ErrorDto.Factory(ErrorCodesEnum.DuplicateEntryPhoneNumber);

                string id = "G72nmjX2M";
                string name = "My New Project";

                var User = _mapper.Map<User>(UserRegisterDto);
                User.Id = Guid.NewGuid().ToString();
                User.EmailConfirmed = true;
           
                await _userManager.CreateAsync(User, UserRegisterDto.Password);

                var agora = await _agoraManagementService.GetAgoraProjectWithToken(id, name);
                //var UserDto = _mapper.Map<UserDto>(User);
                // await _userAgoraService.RemoveUserAgora(UserRegisterDto.UserName, "/users", agora.Data.Token);
                await _userAgoraService.AddAsync(
                    new UserAgoraLogin
                    {
                        UserName = UserRegisterDto.UserName,
                        Password = UserRegisterDto.Password,
                        AgoraToken = agora.Data.Token
                    });

                User.TockenAgora = agora.Data.Token;

                var TockenUserAgoraChat = await _userAgoraService.GenerateTokenForUserChat(User.UserName, id, name);
                if (TockenUserAgoraChat != null)
                {
                    User.TockenUserAgoraChat = TockenUserAgoraChat.Data.UserToken;
                }

                await transaction.CommitAsync();

                string imagesBasePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Images");
                string UserFolderPath = Path.Combine(imagesBasePath, User.UserName);

                if (!Directory.Exists(imagesBasePath))
                {
                    Directory.CreateDirectory(imagesBasePath);
                }

                if (!Directory.Exists(UserFolderPath))
                {
                    Directory.CreateDirectory(UserFolderPath);
                }

                string defaultImageUrl = "/Images/User/UserProfile.jpg";
                User.ImageUrl = defaultImageUrl;

                var UserDto = _mapper.Map<UserDto>(User);
                UserDto.ImageUrl = defaultImageUrl;


                _context.Users.Update(User);
                await _context.SaveChangesAsync();
                return GenerateToken(UserDto);
            }
            catch (Exception e)
            {
                await transaction.RollbackAsync();
                return ErrorDto.Factory(ErrorCodesEnum.NotWorking, e);
            }
        }


        public async Task<ValidateResult<ForgetPasswordEmailDto>> ForgetPasswordUserByEmail(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user is null)
                return ErrorDto.Factory(ErrorCodesEnum.IncorrectEmail);

            var otp = await _emailSender.SendEmail(email, "Forget Password");
            otp = otp.Trim();
            if (otp.Length < 6)
                otp = otp.PadLeft(6, '0');

            user.ResetOtp = otp;
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
            await _userManager.UpdateAsync(user);

            var forgetPasswordDto = new ForgetPasswordEmailDto
            {
                Email = email,
                UserId = user.Id,
                Otp = otp
            };

            return forgetPasswordDto;
        }

        public async Task<ValidateResult<bool>> VerifyOtp(string email, string otp)
        {
            Console.WriteLine($"[DEBUG VerifyOtp] email={email}, otp={otp}");
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(otp))
                return ErrorDto.Factory(ErrorCodesEnum.InvalidOtp);

            var user = await _userManager.FindByEmailAsync(email);
            if (user is null)
            {
                Console.WriteLine($"[DEBUG VerifyOtp] user not found for email={email}");
                return ErrorDto.Factory(ErrorCodesEnum.InvalidOtp);
            }

            Console.WriteLine($"[DEBUG VerifyOtp] DB ResetOtp={user.ResetOtp}, OtpExpiry={user.OtpExpiry}");
            if (user.ResetOtp == null || user.ResetOtp.Trim() != otp.Trim() || user.OtpExpiry == null || user.OtpExpiry < DateTime.UtcNow)
            {
                Console.WriteLine($"[DEBUG VerifyOtp] otp mismatch or expired for email={email}");
                return ErrorDto.Factory(ErrorCodesEnum.InvalidOtp);
            }

            // Keep the OTP stored until password reset is completed.
            // VerifyOtp is only a check step; ChangePasswordNotToken will clear it after successful password change.
            Console.WriteLine($"[DEBUG VerifyOtp] OTP verified for email={email}");
            return true;
        }

        public async Task<ValidateResult<bool>> OtpByEmail(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user is null)
                return ErrorDto.Factory(ErrorCodesEnum.IncorrectEmail);

            var otp = await _emailSender.SendEmail(email, "Confirm Otp");
            user.ResetOtp = otp.Trim();
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
            await _userManager.UpdateAsync(user);
            return true;
        }

        public async Task<ValidateResult<ForgetPasswordPhoneNumberDto>> ForgetPasswordUserByPhoneNmber(string phoneNumber)
        {
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber.ToLower() == phoneNumber.ToLower());

            if (user is null)
                return ErrorDto.Factory(ErrorCodesEnum.IncorrectPhoneNumber);

            var otpValue = await _emailSender.SendPhoneNumber(phoneNumber);
            var otpString = otpValue.ToString().Trim();
            if (otpString.Length < 6)
                otpString = otpString.PadLeft(6, '0');

            user.ResetOtp = otpString;
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
            await _userManager.UpdateAsync(user);
            var forgetPasswordDto = new ForgetPasswordPhoneNumberDto
            {
                PhoneNumber = phoneNumber,
                Otp = otpString,
                UserId = user.Id
            };

            return forgetPasswordDto;
        }

        public async Task<ValidateResult<bool>> RemoveAccount(string UserId)
        {
            // Fetch the User
            var User = await _unitOfWork.User.FindAsync(c => c.Id == UserId);
            if (User is null)
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);

          

            var attachments = await _unitOfWork.Attachment.ListAsync(a => a.UserId == UserId);
            if (attachments.Any())
                _unitOfWork.Attachment.RemoveRange(attachments);

           

            string id = "G72nmjX2M";
            string name = "My New Project";
            var agora = await _agoraManagementService.GetAgoraProjectWithToken(id, name);
            var userAgoraDelete = new UserAgoraDeleteDto
            {
                AgoraToken = agora.Data.Token,
                UserName = User.UserName
            };
            var deleteAgora = _userAgoraService.RemoveUserAgora(userAgoraDelete);
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

        #region Helper Method
        private UserWithTokenDto GenerateToken(UserDto userDto)
        {
            var claims = GenerateClaim(userDto);
            var token = GenerateToken(claims, _jwtKey, DateTime.Now.AddYears(1));

            var mapperDto = _mapper.Map<UserWithTokenDto>(userDto);
            mapperDto.Token = token;
            return mapperDto;

        }
        private List<Claim> GenerateClaim(UserDto userDto)
        {
            var claims = new List<Claim>
                        {
                            new Claim(ClaimTypes.Name, userDto.UserName ?? string.Empty),
                            new Claim(ClaimTypes.NameIdentifier, userDto.Id ?? string.Empty),
                            new Claim("UserId", userDto.Id ?? string.Empty),
                            new Claim("Email", userDto.Email ?? string.Empty),
                            new Claim("FullName", userDto.FullName ?? string.Empty),
                            new Claim("PhoneNumber", userDto.PhoneNumber ?? string.Empty),
                            new Claim("IsActive", userDto.IsActive?.ToString() ?? "false"),
                            new Claim(ClaimTypes.Role, userDto.Role?.ToString() ?? string.Empty),
                        };

            return claims;
        }
        private string GenerateToken(IEnumerable<Claim> claims, string securityKey, DateTime expirationDate)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(securityKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                SigningCredentials = credentials,
                Expires = expirationDate,
                Audience = _jwtAud,
                Issuer = _jwtIssuer,
            };
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
        #endregion
        public async Task<RowsWithPaginationInfo<UserDto>> ListAsync()
        {
            //var criteria = new ListCriteriaDto<User>();
            //var user = await _unitOfWork.User.ListAsync(criteria);
            //return _mapper.Map<RowsWithPaginationInfo<UserDto>>(user);

            throw new NotImplementedException();
        }

        public async Task<ValidateResult<UserWriterDto>> GetUserById(string userId)
        {
            var User =
                await _unitOfWork.User.FindAsNotTrackingAsync(s =>
                s.Id == userId,
                UserQueryHelper.Instance,
                GetCriteriaDto.Default.AddNewInclude(RelatedObjectEnum.Attachments));
            if (User is null)
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);

            return _mapper.Map<UserWriterDto>(User);
        }
        public async Task<ValidateResult<UserWriterDto>> ManageUser(UserWriterDto userDto)
        {
            var checks = await DatabaseChecks(userDto);
            if (checks.IsFailure)
                return checks.Error;

            return userDto.Id == string.Empty
                ? await AddUser(userDto)
                : await EditUser(userDto);
        }

        public async Task<ValidateResult<bool>> RemoveUser(string UserId)
        {
            var User = await _unitOfWork.User.FindAsync(s => s.Id == UserId);
            if (User is null)
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);


            _unitOfWork.User.Remove(User);
            await _unitOfWork.SaveAsync();
            return true;
        }

        #region Private Method

        async Task<ValidateResult<UserWriterDto>> AddUser(UserWriterDto userDto)
        {
            userDto.Id = Guid.NewGuid().ToString();
            var user = _mapper.Map<User>(userDto);
            _unitOfWork.User.Add(user);

            await _unitOfWork.SaveAsync();
            return _mapper.Map<UserWriterDto>(user);
        }

        async Task<ValidateResult<UserWriterDto>> EditUser(UserWriterDto UserDto)
        {
            var User = await _unitOfWork.User.FindAsync(s => s.Id == UserDto.Id);
            if (User is null)
                return ErrorDto.Factory(ErrorCodesEnum.UserIsNotFound);

            _mapper.Map(UserDto, User);
            _unitOfWork.User.Update(User);
            await _unitOfWork.SaveAsync();
            return _mapper.Map<UserWriterDto>(User);
        }

        async Task<ValidateResult<bool>> DatabaseChecks(UserWriterDto UserDto)
        {
            if ((bool)await _unitOfWork.User.AnyAsync(s =>
                    s.Id != UserDto.Id &&
                    s.UserName.ToLower().Trim() == UserDto.UserName.ToLower().Trim()))
                return ErrorDto.Factory(ErrorCodesEnum.NumberOfCardIsAlreadyExists);

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

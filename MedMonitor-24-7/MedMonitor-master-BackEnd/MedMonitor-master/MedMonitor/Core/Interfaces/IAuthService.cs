using Akeel.Utilities.ValidateResult;
using MedMonitor.Core.Dto;

namespace MedMonitor.Core.Interfaces
{
    public interface IAuthService
    {

        #region Users
        Task<ValidateResult<UserWithTokenDto>> Login(LoginDto loginDto);
        //Task<ValidateResult<ForgetPawwordDto>> ForgetPasswordUser(string email);
        Task<ValidateResult<ForgetPasswordEmailDto>> ForgetPasswordUserByEmail(string email);
        Task<ValidateResult<ForgetPasswordPhoneNumberDto>> ForgetPasswordUserByPhoneNmber(string phoneNumber);
        Task<ValidateResult<bool>> ChangePasswordUser(ChangePasswordDto changePasswordDto);
        Task<ValidateResult<bool>> ChangePasswordUser(ChangePasswordNotTokenDto changePasswordDto);
        Task<ValidateResult<bool>> VerifyOtp(string email, string otp);
        Task<ValidateResult<bool>> OtpByEmail(string email);
        Task<ValidateResult<UserWithTokenDto>> RegisterUser(UserRegisterDto UserDto);
        Task<ValidateResult<bool>> RemoveAccount(string UserId);
        #endregion
    }
}

using MedMonitor.Core.Dto;
using MedMonitor.Core.Interfaces;
using MedMonitor.Extenstions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedMonitor.Controllers
{
    public class LoginContoller : BaseController
    {
        private readonly IAuthService _authService;

        public LoginContoller(IAuthService authService)
        {
            _authService = authService;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto login)
           => await _authService.Login(login).ToActionResult();

        [AllowAnonymous]
        [HttpPost("loginUser")]
        public async Task<IActionResult> LoginUser(LoginDto login)
        {
            //string token = ApaasTokenBuilder.buildAppToken(appId, appCertificate, expire);
            return await _authService.Login(login).ToActionResult();
        }

        [AllowAnonymous]
        [HttpPost("Register")]
        public async Task<IActionResult> Register(UserRegisterDto UserDto)
           => await _authService.RegisterUser(UserDto).ToActionResult();

        [AllowAnonymous]
        [HttpPost("OtpByEmail")]
        public async Task<IActionResult> OtpByEmail(string email)
         => await _authService.OtpByEmail(email).ToActionResult();

        [AllowAnonymous]
        [HttpPost("ForgetPasswordByEmail")]
        public async Task<IActionResult> ForgetPasswordByEmail(string email)
          => await _authService.ForgetPasswordUserByEmail(email).ToActionResult();

        [AllowAnonymous]
        [HttpPost("VerifyOtp")]
        public async Task<IActionResult> VerifyOtp(string email, string otp)
          => await _authService.VerifyOtp(email, otp).ToActionResult();

        [AllowAnonymous]
        [HttpPost("ForgetPasswordByPhoneNumber")]
        public async Task<IActionResult> ForgetPasswordByPhoneNumber(string phoneNumber)
          => await _authService.ForgetPasswordUserByPhoneNmber(phoneNumber).ToActionResult();

        [AllowAnonymous]
        [HttpPost("ChangePasswordNotToken")]
        public async Task<IActionResult> ChangePassword(ChangePasswordNotTokenDto changePasswordDto)
          => await _authService.ChangePasswordUser(changePasswordDto).ToActionResult();

        [HttpPost("ChangePassword")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
          => await _authService.ChangePasswordUser(changePasswordDto).ToActionResult();

        [HttpPost("ChangePasswordUser")]
        public async Task<IActionResult> ChangePasswordUser(ChangePasswordDto changePasswordDto)
          => await _authService.ChangePasswordUser(changePasswordDto).ToActionResult();

        [HttpDelete("RemoveAccount")]
        public async Task<IActionResult> RemoveAccount(string UserId)
        => await _authService.RemoveAccount(UserId).ToActionResult();


    }
}

using MedMonitor.Shared.Enum;
using System.ComponentModel.DataAnnotations;

namespace MedMonitor.Core.Dto
{
    /// <summary>
    /// DTO لتسجيل مستخدم جديد (Doctor أو Nurse)
    /// </summary>
    public class UserRegisterDto
    {
        [Required(ErrorMessage = "الاسم الكامل مطلوب")]
        public string FullName { get; set; } = null!;

        [Required(ErrorMessage = "اسم المستخدم مطلوب")]
        public string UserName { get; set; } = null!;

        [Required(ErrorMessage = "البريد الإلكتروني مطلوب")]
        [EmailAddress(ErrorMessage = "البريد الإلكتروني غير صحيح")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "رقم الهاتف مطلوب")]
        [Phone(ErrorMessage = "رقم الهاتف غير صحيح")]
        public string PhoneNumber { get; set; } = null!;

        [Required(ErrorMessage = "كلمة المرور مطلوبة")]
        [MinLength(6, ErrorMessage = "يجب أن تكون كلمة المرور على الأقل 6 أحرف")]
        public string Password { get; set; } = null!;

        /// <summary>
        /// 2 = Doctor, 3 = Nurse
        /// </summary>
        [Required(ErrorMessage = "اختر دورك")]
        public UserRoleEnum Role { get; set; }

        [Required(ErrorMessage = "النوع مطلوب")]
        public GenderEnum Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        /// <summary>
        /// تخصص الطبيب (اختياري للممرضات)
        /// </summary>
        public string? Specialization { get; set; }

        public UserRegisterDto() { }

        public UserRegisterDto(string fullName, string userName, string email, string phoneNumber, string password, UserRoleEnum role, GenderEnum gender)
        {
            FullName = fullName;
            UserName = userName;
            Email = email;
            PhoneNumber = phoneNumber;
            Password = password;
            Role = role;
            Gender = gender;
        }
    }
}

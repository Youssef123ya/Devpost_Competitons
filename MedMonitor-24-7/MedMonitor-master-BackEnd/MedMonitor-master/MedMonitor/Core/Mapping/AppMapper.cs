using Akeel.Utilities.EF.Extensions.Models;
using AutoMapper;
using MedMonitor.Core.Dto;
using MedMonitor.Infrastructure.Models;


namespace MedMonitor.Core.Mapping
{
    public class AppMapper : Profile
    {
        public AppMapper()
        {


            CreateMap<Attachment, AttachmentDto>();
            CreateMap<AttachmentDto, Attachment>();

            CreateMap<AttachmentWriterDto, Attachment>();
            CreateMap<Attachment, AttachmentWriterDto>();


            CreateMap<User, UserDto>();
            CreateMap<UserDto, User>();
            CreateMap<UserDto, UserWithTokenDto>();
            CreateMap<UserWriterDto, User>();
            CreateMap<UserWriterDto, UserDto>();
            CreateMap<UserDto, UserWriterDto>();
            CreateMap<UserWriterDto, User>();
            CreateMap<User, UserWriterDto>();

            CreateMap<UserDto, UserRegisterDto>();
            CreateMap<UserRegisterDto, UserDto>();

            CreateMap<User, UserRegisterDto>();
            CreateMap<UserRegisterDto, User>();

            CreateMap<AdmissionRequest, AdmissionRequestDto>()
                .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => src.Doctor.FullName ?? src.Doctor.UserName))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
                .ReverseMap()
                .ForMember(dest => dest.Doctor, opt => opt.Ignore());

            CreateMap<Bed, BedDto>().ReverseMap();

            CreateMap<Infrastructure.Models.Task, TaskDto>().ReverseMap();
            CreateMap<RowsWithPaginationInfo<Infrastructure.Models.Task>, List<TaskDto>>()
                .ConvertUsing((src, dest, context) =>
                    context.Mapper.Map<List<TaskDto>>(src.Rows));

            CreateMap<VitalSign, VitalSignDto>().ReverseMap();

            CreateMap<AgoraProjectWithTokenDto, AgoraProjectDto>();
            CreateMap<AgoraProjectDto, AgoraProjectWithTokenDto>();

       

            CreateMap(typeof(RowsWithPaginationInfo<>), typeof(RowsWithPaginationInfo<>));
        }

    }
}

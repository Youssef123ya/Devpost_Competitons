namespace MedMonitor.Infrastructure.Repositories.Interface
{
    public interface IUnitOfWork
    {
        IAttachmentRepository Attachment { get; }
        IUserRepository User { get; }

        IAdmissionRequestRepository AdmissionRequest { get; }
        IBedRepository Bed { get; }
        ITaskRepository Task { get; }
        IVitalSignRepository VitalSign { get; }

        Task<int> SaveAsync();
    }
}

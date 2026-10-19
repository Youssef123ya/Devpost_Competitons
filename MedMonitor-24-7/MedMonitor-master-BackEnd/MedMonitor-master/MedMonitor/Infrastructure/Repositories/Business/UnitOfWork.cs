using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Repositories.Interface;

namespace MedMonitor.Infrastructure.Repositories.Business
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;

        public UnitOfWork(AppDbContext context)
        {
            _context = context;
        }

        public IAttachmentRepository Attachment => new AttachmentRepository(_context);
        public IUserRepository User => new UserRepository(_context);

        public IAdmissionRequestRepository AdmissionRequest => new AdmissionRequestRepository(_context);
        public IBedRepository Bed => new BedRepository(_context);
        public ITaskRepository Task => new TaskRepository(_context);
        public IVitalSignRepository VitalSign => new VitalSignRepository(_context);


        public Task<int> SaveAsync()
        {
            return _context.SaveChangesAsync();
        }
    }
}

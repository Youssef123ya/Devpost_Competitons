using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Business;
using MedMonitor.Shared.Dtos;

namespace MedMonitor.Infrastructure.Repositories.Interface
{
    public interface IAttachmentRepository : IRepository<Attachment>
    {
        Task<RowsWithPaginationInfo<Attachment>> ListAttchmentAsync(Shared.Dtos.ListCriteriaDto<Attachment> criteria, string UserId);
        Task<RowsWithPaginationInfo<Attachment>> ListAsync(ListCriteriaDto<Attachment> criteria);
        Task<RowsWithPaginationInfo<Attachment>> ListAttchmentWithoutAudioAsync(ListCriteriaDto<Attachment> criteria, string UserId);
    }
}

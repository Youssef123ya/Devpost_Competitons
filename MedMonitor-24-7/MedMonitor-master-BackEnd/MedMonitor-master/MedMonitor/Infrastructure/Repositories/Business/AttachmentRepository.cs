using Akeel.Utilities.EF.Extensions.ExtensionMethods;
using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Models;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Infrastructure.Repositories.QueryHelpers;
using MedMonitor.Shared.Dtos;

namespace MedMonitor.Infrastructure.Repositories.Business
{
    public class AttachmentRepository : Repository<Attachment>, IAttachmentRepository
    {
        private readonly AppDbContext _context;
        private readonly AttachmentQueryHelper _attachmentQueryHelper = new AttachmentQueryHelper();
        public AttachmentRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }
        public async Task<RowsWithPaginationInfo<Attachment>> ListAttchmentAsync(ListCriteriaDto<Attachment> criteria, string UserId)
        {
            return await _context.Attachments.IncludeRange(criteria.ListRelatedObjectsEnum, _attachmentQueryHelper)
                .Where(s => s.UserId == UserId)
                .OnSelectListWithPaginationAsync(criteria.PaginationInfo, criteria.ListRelatedObjectsEnum,
                    _attachmentQueryHelper);
        }
        public async Task<RowsWithPaginationInfo<Attachment>> ListAttchmentWithoutAudioAsync(ListCriteriaDto<Attachment> criteria, string UserId)
        {
            return await _context.Attachments.IncludeRange(criteria.ListRelatedObjectsEnum, _attachmentQueryHelper)
                .Where(s => s.UserId == UserId && !s.AttachUrl.Contains(".mp3"))
                .OnSelectListWithPaginationAsync(criteria.PaginationInfo, criteria.ListRelatedObjectsEnum,
                    _attachmentQueryHelper);
        }
        public async Task<RowsWithPaginationInfo<Attachment>> ListAsync(ListCriteriaDto<Attachment> criteria)
        {
            return await _context.Attachments.IncludeRange(criteria.ListRelatedObjectsEnum, _attachmentQueryHelper)
                .OnSelectListWithPaginationAsync(criteria.PaginationInfo, criteria.ListRelatedObjectsEnum,
                    _attachmentQueryHelper);
        }

    }
}

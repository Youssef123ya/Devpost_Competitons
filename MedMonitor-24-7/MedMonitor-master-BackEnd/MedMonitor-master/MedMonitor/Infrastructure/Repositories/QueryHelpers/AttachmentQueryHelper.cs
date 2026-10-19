using MedMonitor.Infrastructure.Models;
using MedMonitor.Shared.Enum;
using MedMonitor.Shared.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MedMonitor.Infrastructure.Repositories.QueryHelpers
{
    public class AttachmentQueryHelper : IIncludable<Attachment>, IPagination<Attachment>
    {
        public AttachmentQueryHelper()
        {

        }

        public static AttachmentQueryHelper Instance => new();
        public IQueryable<Attachment> HandleIncludeRange(IQueryable<Attachment> rows, RelatedObjectEnum includeEnum)
        {
            return includeEnum switch
            {
                RelatedObjectEnum.User => rows.Include(a => a.User),
                _ => rows
            };
        }

        public Attachment ToDto(Attachment entity, List<RelatedObjectEnum> listRelatedObjectEnums)
        {
            return entity;
        }
    }
}

using MedMonitor.Infrastructure.Models;
using MedMonitor.Shared.Enum;
using Microsoft.EntityFrameworkCore;

namespace MedMonitor.Infrastructure.Repositories.QueryHelpers
{
    public class AdmissionRequestQueryHelper : QueryFilter<AdmissionRequest>
    {
        public static AdmissionRequestQueryHelper Instance => new();

        public override IQueryable<AdmissionRequest> HandleIncludeRange(IQueryable<AdmissionRequest> rows, RelatedObjectEnum includeEnum)
        {
            return includeEnum switch
            {
                RelatedObjectEnum.User => rows.Include(r => r.Doctor),
                _ => rows
            };
        }
    }
}

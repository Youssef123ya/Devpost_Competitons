using MedMonitor.Shared.Enum;
using Microsoft.EntityFrameworkCore;

namespace MedMonitor.Infrastructure.Repositories.QueryHelpers
{
    public class VitalSignQueryHelper : QueryFilter<MedMonitor.Infrastructure.Models.VitalSign>
    {
        public static VitalSignQueryHelper Instance => new();

        public override IQueryable<MedMonitor.Infrastructure.Models.VitalSign> HandleIncludeRange(
            IQueryable<MedMonitor.Infrastructure.Models.VitalSign> rows,
            RelatedObjectEnum includeEnum)
        {
            return includeEnum switch
            {
                RelatedObjectEnum.User => rows.Include(x => x.Patient),
                _ => rows
            };
        }
    }
}

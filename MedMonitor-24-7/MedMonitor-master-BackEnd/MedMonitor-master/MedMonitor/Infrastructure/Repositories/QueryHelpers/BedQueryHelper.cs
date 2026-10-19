using MedMonitor.Infrastructure.Models;
using MedMonitor.Shared.Enum;
using Microsoft.EntityFrameworkCore;

namespace MedMonitor.Infrastructure.Repositories.QueryHelpers
{
    public class BedQueryHelper : QueryFilter<Bed>
    {
        public static BedQueryHelper Instance => new();

        public override IQueryable<Bed> HandleIncludeRange(IQueryable<Bed> rows, RelatedObjectEnum includeEnum)
        {
            // ✅ Patient data now stored directly on Bed model, no need to Include User
            return includeEnum switch
            {
                RelatedObjectEnum.User => rows,  // Patient data on Bed directly
                _ => rows
            };
        }
    }
}

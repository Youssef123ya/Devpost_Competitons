using MedMonitor.Shared.Enum;
using Microsoft.EntityFrameworkCore;

namespace MedMonitor.Infrastructure.Repositories.QueryHelpers
{
    public class TaskQueryHelper : QueryFilter<MedMonitor.Infrastructure.Models.Task>
    {
        public static TaskQueryHelper Instance => new();

        public override IQueryable<MedMonitor.Infrastructure.Models.Task> HandleIncludeRange(IQueryable<MedMonitor.Infrastructure.Models.Task> rows, RelatedObjectEnum includeEnum)
        {
            return includeEnum switch
            {
                RelatedObjectEnum.User => rows
                    .Include(t => t.Doctor)
                    .Include(t => t.Nurse)
                    .Include(t => t.Patient),

                _ => rows
            };
        }
    }
}

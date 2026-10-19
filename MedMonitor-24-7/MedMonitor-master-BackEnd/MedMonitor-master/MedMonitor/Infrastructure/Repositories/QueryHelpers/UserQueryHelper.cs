using MedMonitor.Infrastructure.Models;
using MedMonitor.Shared.Enum;
using Microsoft.EntityFrameworkCore;

namespace MedMonitor.Infrastructure.Repositories.QueryHelpers
{
    public class UserQueryHelper : QueryFilter<User>
    {
        public UserQueryHelper()
        {

        }

        public static UserQueryHelper Instance => new();

        public override IQueryable<User> HandleIncludeRange(IQueryable<User> rows, RelatedObjectEnum includeEnum)
        {
            return includeEnum switch
            {
              
                RelatedObjectEnum.Attachments => rows.Include(a => a.Attachments),
              
                _ => rows
            };
        }

    }
}

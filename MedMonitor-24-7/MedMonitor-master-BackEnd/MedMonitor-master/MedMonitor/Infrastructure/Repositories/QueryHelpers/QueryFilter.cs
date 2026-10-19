using MedMonitor.Shared.Enum;
using MedMonitor.Shared.Interfaces;

namespace MedMonitor.Infrastructure.Repositories.QueryHelpers
{
    public abstract class QueryFilter<T> : IIncludable<T>, IPagination<T>
    {
        public abstract IQueryable<T> HandleIncludeRange(IQueryable<T> rows, RelatedObjectEnum includeEnum);

        public T ToDto(T entity, List<RelatedObjectEnum> listRelatedObjectEnums)
        {
            return entity;
        }
    }
}

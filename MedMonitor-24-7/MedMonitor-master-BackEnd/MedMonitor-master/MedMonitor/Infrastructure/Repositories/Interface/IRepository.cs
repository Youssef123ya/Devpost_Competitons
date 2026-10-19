using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Infrastructure.Repositories.QueryHelpers;
using MedMonitor.Shared.Dtos;
using System.Linq.Expressions;

namespace MedMonitor.Infrastructure.Repositories.Interface
{
    public interface IRepository<T> where T : class
    {
        void Add(T entity);
        void AddRange(IEnumerable<T> entities);
        void Update(T entity);
        void UpdateRange(IEnumerable<T> entities);
        void Remove(T entity);
        void RemoveRange(IEnumerable<T> entities);
        Task<bool?> AnyAsync(Expression<Func<T, bool>> predicate);
        Task<T?> FindAsync(Expression<Func<T, bool>> predicate);
        Task<T?> FindAsNotTrackingAsync(Expression<Func<T, bool>> predicate, QueryFilter<T> queryFilter,
            GetCriteriaDto criteria);
        Task<T?> FindAsNotTrackingAsync(Expression<Func<T, bool>> predicate);
        Task<T?> FirstOrDefaultAsync();
        Task<T?> DefaultIfEmpty();
        Task<int?> MaxAsync(Expression<Func<T, int>>? predicate = null);
        Task<RowsWithPaginationInfo<T>> ListAsync<TFilter>(QueryFilter<T> queryFilter, Shared.Dtos.ListCriteriaDto<TFilter> criteria);
        Task<List<T>> ListAsync(Expression<Func<T, bool>>? predicate = null);
        Task<List<T>> WhereAsync(Expression<Func<T, bool>>? predicate = null);
        Task<int?> WhereMaxAsync(Expression<Func<T, bool>>? predicateWhere = null, Expression<Func<T, int>>? predicateMax = null);
    }
}

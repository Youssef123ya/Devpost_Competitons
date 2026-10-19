using Akeel.Utilities.EF.Extensions.ExtensionMethods;
using Akeel.Utilities.EF.Extensions.Models;
using Microsoft.EntityFrameworkCore;
using MedMonitor.Infrastructure.Data;
using MedMonitor.Infrastructure.Repositories.Interface;
using MedMonitor.Infrastructure.Repositories.QueryHelpers;
using MedMonitor.Shared.Dtos;
using System.Linq.Expressions;

namespace MedMonitor.Infrastructure.Repositories.Business
{
    public class Repository<T> : IRepository<T> where T : class
    {
        private readonly AppDbContext _context;

        public Repository(AppDbContext context)
        {
            _context = context;
        }

        public void Add(T entity)
        => _context.Set<T>().Add(entity);

        public void AddRange(IEnumerable<T> entities)
       => _context.Set<T>().AddRange(entities);

        public async Task<bool?> AnyAsync(Expression<Func<T, bool>> predicate)
       => await _context.Set<T>().AnyAsync(predicate);

        public Task<T?> FindAsync(Expression<Func<T, bool>> predicate)
       => _context.Set<T>().FirstOrDefaultAsync(predicate);

        public Task<T?> FirstOrDefaultAsync()
       => _context.Set<T>().FirstOrDefaultAsync();

        public async Task<RowsWithPaginationInfo<T>> ListAsync<TFilter>(QueryFilter<T> queryFilter,
       Shared.Dtos.ListCriteriaDto<TFilter> criteria)
        {
            return await _context.Set<T>().AsNoTracking()
                .IncludeRange(criteria.ListRelatedObjectsEnum, queryFilter)
                .OnSelectListWithPaginationAsync(criteria.PaginationInfo, criteria.ListRelatedObjectsEnum, queryFilter);
        }

        public async Task<List<T>> ListAsync(Expression<Func<T, bool>>? predicate = null)
        {
            var query = _context.Set<T>().AsNoTracking().AsQueryable();
            if (predicate != null)
                query = query.Where(predicate);

            return await query.ToListAsync();
        }

        public void Update(T entity)
          => _context.Set<T>().Update(entity);

        public void UpdateRange(IEnumerable<T> entities)
       => _context.Set<T>().UpdateRange(entities);

        public void Remove(T entity)
      => _context.Set<T>().Remove(entity);

        public void RemoveRange(IEnumerable<T> entities)
        => _context.Set<T>().RemoveRange(entities);

        public async Task<List<T>> WhereAsync(Expression<Func<T, bool>> predicate)
        {
            var query = _context.Set<T>().AsNoTracking().Where(predicate);
            return await query.ToListAsync();
        }

        public async Task<int?> MaxAsync(Expression<Func<T, int>>? predicate = null)
        {
            var query = await _context.Set<T>().AsNoTracking().MaxAsync(predicate);
            return query;
        }

        public Task<T?> DefaultIfEmpty()
        {
            throw new NotImplementedException();
        }

        public async Task<int?> WhereMaxAsync(Expression<Func<T, bool>>? predicateWhere = null, Expression<Func<T, int>>? predicateMax = null)
        {
            int max = 0;
            var query = _context.Set<T>().AsNoTracking().Where(predicateWhere);
            if (await query.CountAsync() > 0)
                max = await query.MaxAsync(predicateMax);

            return max;
        }

        public async Task<T?> FindAsNotTrackingAsync(Expression<Func<T, bool>> predicate, QueryFilter<T> queryFilter,
            GetCriteriaDto criteria)
        {
            return await _context.Set<T>()
                .AsNoTracking()
                .IncludeRange(criteria.ListRelatedObjectsEnum, queryFilter)
                .FirstOrDefaultAsync(predicate);
        }




        public Task<T?> FindAsNotTrackingAsync(Expression<Func<T, bool>> predicate)
            => _context.Set<T>().AsNoTracking().FirstOrDefaultAsync(predicate);
    }
}

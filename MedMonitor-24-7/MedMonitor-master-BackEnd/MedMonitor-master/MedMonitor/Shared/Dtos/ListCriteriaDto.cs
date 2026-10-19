using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Shared.Enum;

namespace MedMonitor.Shared.Dtos
{
    public class ListCriteriaDto<T> : ListCriteriaDto<T, OrderObjectEnum, RelatedObjectEnum>
    {
        public new ListCriteriaDto<T> AddNewInclude(RelatedObjectEnum include)
        {
            base.AddNewInclude(include);
            return this;
        }

        public ListCriteriaDto<T> AddNewInclude(IEnumerable<RelatedObjectEnum> includes)
        {
            foreach (var relatedObjectsEnum in includes) base.AddNewInclude(relatedObjectsEnum);
            return this;
        }
    }
}

using Akeel.Utilities.EF.Extensions.Models;
using MedMonitor.Shared.Enum;

namespace MedMonitor.Shared.Dtos
{
    public class GetCriteriaDto : GetCriteriaDto<RelatedObjectEnum>
    {
        public new static GetCriteriaDto Default => new();

        public new GetCriteriaDto AddNewInclude(RelatedObjectEnum include)
        {
            base.AddNewInclude(include);
            return this;
        }

        public GetCriteriaDto AddNewIncludes(params RelatedObjectEnum[] includes)
        {
            foreach (var include in includes) base.AddNewInclude(include);

            return this;
        }
    }
}

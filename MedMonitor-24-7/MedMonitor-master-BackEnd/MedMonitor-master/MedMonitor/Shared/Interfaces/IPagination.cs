using Akeel.Utilities.EF.Extensions.Interfaces;
using MedMonitor.Shared.Enum;

namespace MedMonitor.Shared.Interfaces
{
    public interface IPagination<T, TFilter> : ISelectListWithPagination<T, TFilter, RelatedObjectEnum>
    {
    }

    public interface IPagination<T> : ISelectListWithPagination<T, T, RelatedObjectEnum>
    {
    }
}

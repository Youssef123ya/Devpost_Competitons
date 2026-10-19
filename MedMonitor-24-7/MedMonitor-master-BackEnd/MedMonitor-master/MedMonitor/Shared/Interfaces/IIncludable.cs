using Akeel.Utilities.EF.Extensions.Interfaces;
using MedMonitor.Shared.Enum;

namespace MedMonitor.Shared.Interfaces
{
    public interface IIncludable<T> : IIncludableRange<T, RelatedObjectEnum>
    {
    }
}

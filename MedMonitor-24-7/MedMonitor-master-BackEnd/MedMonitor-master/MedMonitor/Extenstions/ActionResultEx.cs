using Akeel.Utilities.ValidateResult;
using Microsoft.AspNetCore.Mvc;

namespace MedMonitor.Extenstions
{
    public static class ActionResultEx
    {
        public static IActionResult ToActionResult<T>(this ValidateResult<T> result)
        {
            try
            {
                if (result.IsFailure)
                    return new BadRequestObjectResult(result.Error);

                return new OkObjectResult(result.Data);
            }
            catch (Exception e)
            {
                return new ObjectResult(new
                {
                    e.Message,
#if DEBUG
                    e.StackTrace
#endif
                })
                {
                    StatusCode = 500
                };
            }
        }

        public static async Task<IActionResult> ToActionResult<T>(this Task<ValidateResult<T>> task)
        {
            try
            {
                var result = await task;
                return result.ToActionResult();
            }
            catch (Exception e)
            {
                return new ObjectResult(new
                {
                    e.Message,
#if DEBUG
                    e.StackTrace
#endif
                })
                {
                    StatusCode = 500
                };
            }
        }
    }
}

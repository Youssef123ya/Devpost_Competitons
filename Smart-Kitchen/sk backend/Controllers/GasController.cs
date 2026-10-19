using Microsoft.AspNetCore.Mvc;
using SmartKitchen.API.DTOs;
using SmartKitchen.API.Services;

namespace SmartKitchen.API.Controllers;

[ApiController]
[Route("api/gas")]
public class GasController : ControllerBase
{
    private readonly IAlertService _alertService;

    public GasController(IAlertService alertService)
    {
        _alertService = alertService;
    }

    [HttpPost("control")]
    public async Task<IActionResult> Control(
        [FromBody] GasControlRequest request,
        CancellationToken cancellationToken)
    {
        var state = await _alertService.SetGasControlStateAsync(
            request.EnableGas,
            "manual",
            cancellationToken);

        return Ok(new
        {
            isEnabled = state.IsEnabled
        });
    }

    [HttpGet("control")]
    public async Task<IActionResult> GetControl(
        CancellationToken cancellationToken)
    {
        var state = await _alertService.GetGasControlStateAsync(
            cancellationToken);

        return Ok(new
        {
            isEnabled = state.IsEnabled,
            updatedAt = state.UpdatedAt
        });
    }
}
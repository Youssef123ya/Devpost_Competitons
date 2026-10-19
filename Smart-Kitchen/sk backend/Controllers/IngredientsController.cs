using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartKitchen.API.DTOs;
using SmartKitchen.API.Services;

namespace SmartKitchen.API.Controllers;

[Authorize]
[ApiController]
[Route("api/ingredients")]
[Produces("application/json")]
public class IngredientsController : ControllerBase
{
    private readonly IRecipeService _recipeService;

    public IngredientsController(
        IRecipeService recipeService)
    {
        _recipeService = recipeService;
    }

    [HttpGet("recent")]
    [ProducesResponseType(
        typeof(ApiResponse<List<string>>),
        200)]
    public async Task<IActionResult> GetRecent()
    {
        var userId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        Console.WriteLine($"Current User = {userId}");

        var recent =
            await _recipeService
                .GetRecentIngredientsAsync(userId);

        Console.WriteLine($"Recent Count = {recent.Count}");

        return Ok(
            ApiResponse<List<string>>
                .Success(
                    "Recent ingredients retrieved.",
                    recent));
    }

    [HttpGet("recent/detailed")]
    [ProducesResponseType(
        typeof(ApiResponse<List<RecentIngredientDto>>),
        200)]
    public async Task<IActionResult> GetRecentDetailed()
    {
        var userId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        Console.WriteLine($"Current User = {userId}");

        var recent =
            await _recipeService
                .GetRecentIngredientsDetailedAsync(userId);

        Console.WriteLine($"Recent Count = {recent.Count}");

        return Ok(
            ApiResponse<List<RecentIngredientDto>>
                .Success(
                    "Recent ingredients retrieved.",
                    recent));
    }

    [HttpDelete("recent/{ingredientId:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    [ProducesResponseType(typeof(ApiResponse<object>), 404)]
    public async Task<IActionResult> DeleteRecent(
        int ingredientId)
    {
        var userId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        Console.WriteLine(
            $"Delete Recent -> User = {userId}, IngredientId = {ingredientId}");

        var removed =
            await _recipeService.DeleteRecentIngredientAsync(
                userId,
                ingredientId);

        if (!removed)
        {
            return NotFound(
                ApiResponse<object>.Fail(
                    "Recent ingredient not found."));
        }

        return Ok(
            ApiResponse<object>
                .Success(
                    "Recent ingredient removed."));
    }
    [HttpDelete("recent/by-name/{name}")]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    public async Task<IActionResult> DeleteRecentByName(
    string name)
    {
        var userId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        var removed =
            await _recipeService.DeleteRecentIngredientByNameAsync(
                userId,
                name);

        if (!removed)
        {
            return NotFound(
                ApiResponse<object>.Fail(
                    "Recent ingredient not found."));
        }

        return Ok(
            ApiResponse<object>.Success(
                "Recent ingredient removed."));
    }
}
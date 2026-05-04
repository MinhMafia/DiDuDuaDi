using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/admin/food-tours")]
[Authorize(Roles = "admin")]
public class AdminToursController(IAdminRepository repository) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<FoodTour>> CreateFoodTour([FromBody] CreateFoodTourRequest request)
    {
        var validationMessage = ValidateRequest(request);
        if (validationMessage != null)
        {
            return BadRequest(validationMessage);
        }

        var tour = BuildTour(Guid.NewGuid(), request);
        await repository.CreateFoodTourAsync(tour);

        return CreatedAtAction(nameof(GetFoodTourById), new { id = tour.Id }, tour);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FoodTour>>> GetFoodTours()
    {
        var tours = await repository.GetFoodToursAsync();
        return Ok(tours);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FoodTour>> GetFoodTourById(Guid id)
    {
        var tour = await repository.GetFoodTourByIdAsync(id);
        return tour == null ? NotFound() : Ok(tour);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateFoodTour(Guid id, [FromBody] CreateFoodTourRequest request)
    {
        var validationMessage = ValidateRequest(request);
        if (validationMessage != null)
        {
            return BadRequest(validationMessage);
        }

        var existingTour = await repository.GetFoodTourByIdAsync(id);
        if (existingTour == null)
        {
            return NotFound();
        }

        existingTour.Title = NormalizeLocalizedString(request.Title);
        existingTour.Description = NormalizeLocalizedString(request.Description);
        existingTour.Category = NormalizeNullable(request.Category);
        existingTour.Steps = request.Steps
            .OrderBy(step => step.Order)
            .Select((step, index) => new FoodTourStep
            {
                PoiId = step.PoiId,
                Order = index + 1
            })
            .ToList();

        await repository.UpdateFoodTourAsync(existingTour);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteFoodTour(Guid id)
    {
        var existingTour = await repository.GetFoodTourByIdAsync(id);
        if (existingTour == null)
        {
            return NotFound();
        }

        await repository.DeleteFoodTourAsync(id);
        return NoContent();
    }

    private static FoodTour BuildTour(Guid id, CreateFoodTourRequest request)
    {
        return new FoodTour
        {
            Id = id,
            Title = NormalizeLocalizedString(request.Title),
            Description = NormalizeLocalizedString(request.Description),
            Category = NormalizeNullable(request.Category),
            Steps = request.Steps
                .OrderBy(step => step.Order)
                .Select((step, index) => new FoodTourStep
                {
                    PoiId = step.PoiId,
                    Order = index + 1
                })
                .ToList()
        };
    }

    private static string? ValidateRequest(CreateFoodTourRequest request)
    {
        var hasTitle =
            !string.IsNullOrWhiteSpace(request.Title?.Vi) ||
            !string.IsNullOrWhiteSpace(request.Title?.En);

        if (!hasTitle)
        {
            return "Tour title is required.";
        }

        if (request.Steps == null || request.Steps.Count == 0)
        {
            return "At least one POI is required.";
        }

        if (request.Steps.GroupBy(step => step.Order).Any(group => group.Count() > 1))
        {
            return "Step order must be unique.";
        }

        if (request.Steps.GroupBy(step => step.PoiId).Any(group => group.Count() > 1))
        {
            return "A POI cannot appear twice in the same tour.";
        }

        return null;
    }

    private static LocalizedString NormalizeLocalizedString(LocalizedString? value)
    {
        var vi = NormalizeNullable(value?.Vi) ?? NormalizeNullable(value?.En) ?? string.Empty;
        var en = NormalizeNullable(value?.En) ?? NormalizeNullable(value?.Vi) ?? string.Empty;

        return new LocalizedString
        {
            Vi = vi,
            En = en
        };
    }

    private static string? NormalizeNullable(string? value)
    {
        var trimmedValue = value?.Trim();
        return string.IsNullOrWhiteSpace(trimmedValue) ? null : trimmedValue;
    }
}

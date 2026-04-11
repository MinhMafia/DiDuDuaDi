using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DiDuDuaDi.API.Repositories;
using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/admin/food-tours")]
[Authorize(Roles = "admin")]
public class AdminToursController : ControllerBase
{
    private readonly IAdminRepository _repo;

    public AdminToursController(IAdminRepository repo)
    {
        _repo = repo;
    }

    // ✅ CREATE
    [HttpPost]
    public async Task<ActionResult<FoodTour>> CreateFoodTour(
        [FromBody] CreateFoodTourRequest request)
    {
        if (request.Steps == null || !request.Steps.Any())
            return BadRequest("Steps is required");

        var duplicatedOrder = request.Steps
            .GroupBy(s => s.Order)
            .Any(g => g.Count() > 1);

        if (duplicatedOrder)
            return BadRequest("Step order must be unique");

        var tour = new FoodTour
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            Steps = request.Steps
                .OrderBy(s => s.Order)
                .Select(s => new FoodTourStep
                {
                    PoiId = s.PoiId,
                    Order = s.Order
                })
                .ToList()
        };

        await _repo.CreateFoodTourAsync(tour);

        return CreatedAtAction(nameof(GetFoodTourById), new { id = tour.Id }, tour);
    }

    // ✅ GET ALL
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FoodTour>>> GetFoodTours()
    {
        var tours = await _repo.GetFoodToursAsync();
        return Ok(tours);
    }

    // ✅ GET BY ID
    [HttpGet("{id}")]
    public async Task<ActionResult<FoodTour>> GetFoodTourById(Guid id)
    {
        var tour = await _repo.GetFoodTourByIdAsync(id);

        if (tour == null) return NotFound();

        return Ok(tour);
    }

    // ✅ UPDATE
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFoodTour(Guid id, CreateFoodTourRequest request)
    {
        var tour = await _repo.GetFoodTourByIdAsync(id);
        if (tour == null) return NotFound();

        tour.Title = request.Title;
        tour.Description = request.Description;
        tour.Category = request.Category;

        tour.Steps = request.Steps
            .OrderBy(s => s.Order)
            .Select(s => new FoodTourStep
            {
                PoiId = s.PoiId,
                Order = s.Order
            })
            .ToList();

        await _repo.UpdateFoodTourAsync(tour);

        return NoContent();
    }

    // ✅ DELETE
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFoodTour(Guid id)
    {
        var exists = await _repo.GetFoodTourByIdAsync(id);
        if (exists == null) return NotFound();

        await _repo.DeleteFoodTourAsync(id);

        return NoContent();
    }
}
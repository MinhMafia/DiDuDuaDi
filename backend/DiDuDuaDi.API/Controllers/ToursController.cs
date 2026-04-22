using DiDuDuaDi.API.Models;
using DiDuDuaDi.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToursController(IAdminRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FoodTour>>> GetAll()
    {
        var tours = await repository.GetFoodToursAsync();
        return Ok(tours);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FoodTour>> GetById(Guid id)
    {
        var tour = await repository.GetFoodTourByIdAsync(id);
        return tour == null ? NotFound() : Ok(tour);
    }
}

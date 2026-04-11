using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DiDuDuaDi.API.Repositories;
using DiDuDuaDi.API.Models;
using System.Security.Claims;

namespace DiDuDuaDi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToursController : ControllerBase
{
    // For user access (public or authenticated user)
    [HttpGet]
    public ActionResult<IReadOnlyList<FoodTour>> GetAll()
    {
        // In real impl, use repo to query food_tours
        // Demo data
        return Ok(new List<FoodTour>
        {
            new FoodTour {
                Id = Guid.NewGuid(),
                Title = new LocalizedString { Vi = "Ẩm thực Nhật Bản", En = "Japanese Food Tour" },
                Category = "japanese",
                Steps = new List<FoodTourStep>
                {
                    new FoodTourStep { PoiId = Guid.Parse("55555555-5555-5555-5555-555555555551"), Order = 1 },
                    new FoodTourStep { PoiId = Guid.Parse("55555555-5555-5555-5555-555555555552"), Order = 2 },
                    new FoodTourStep { PoiId = Guid.Parse("88888888-8888-8888-8888-888888888888"), Order = 3 }
                }
            }
        });
    }
    
    [HttpGet("{id:guid}")]
    public ActionResult<FoodTour> GetById(Guid id)
    {
        // Demo
        return Ok(new FoodTour
        {
            Id = id,
            Title = new LocalizedString { Vi = "Ẩm thực Nhật Bản", En = "Japanese Food Tour" },
            Category = "japanese",
            Steps = new List<FoodTourStep>
            {
                new FoodTourStep { PoiId = Guid.Parse("55555555-5555-5555-5555-555555555551"), Order = 1 }
            }
        });
    }
}


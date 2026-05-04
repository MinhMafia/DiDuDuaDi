using System;
using System.Collections.Generic;

namespace DiDuDuaDi.API.Models;

public class LocalizedString
{
    public string Vi { get; set; } = string.Empty;
    public string En { get; set; } = string.Empty;
}

public class FoodTour
{
    public Guid Id { get; set; }
    public string? Code { get; set; }
    public LocalizedString Title { get; set; } = new();
    public LocalizedString Description { get; set; } = new();
    public string? Category { get; set; }
    public string? ImageUrl { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public List<FoodTourStep> Steps { get; set; } = new();
}

public class FoodTourStep
{
    public Guid PoiId { get; set; }
    public int Order { get; set; }
}

public class CreateFoodTourRequest
{
    public LocalizedString Title { get; set; } = new();
    public LocalizedString Description { get; set; } = new();
    public string? Category { get; set; }
    public List<FoodTourStepRequest> Steps { get; set; } = new();
}

public class FoodTourStepRequest
{
    public Guid PoiId { get; set; }
    public int Order { get; set; }
}

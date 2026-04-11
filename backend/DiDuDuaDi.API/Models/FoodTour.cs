using System;
using System.Collections.Generic;

namespace DiDuDuaDi.API.Models;
// Thêm class này vào để trình biên dịch hiểu LocalizedString là gì
public class LocalizedString
{
    public string Vi { get; set; } = string.Empty;
    public string En { get; set; } = string.Empty;
}
public class FoodTour
{
    public Guid Id { get; set; }
    // Đảm bảo kiểu dữ liệu này trùng tên với class trong POI.cs
    public LocalizedString Title { get; set; } = new(); 
    public LocalizedString Description { get; set; } = new();
    public string? Category { get; set; }
    public string? ImageUrl { get; set; }
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
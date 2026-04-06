namespace DiDuDuaDi.API.Models;

public record UpdateOwnerPoiContentRequest(
    string Category,
    string NameVi,
    string DescriptionVi,
    string NameEn,
    string DescriptionEn);

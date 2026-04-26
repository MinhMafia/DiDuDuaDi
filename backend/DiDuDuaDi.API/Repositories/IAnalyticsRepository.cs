using System;
using System.Collections.Generic;
using DiDuDuaDi.API.Models;


namespace DiDuDuaDi.API.Repositories;

public interface IAnalyticsRepository
{
    bool TrackPoiView(Guid poiId, string? languageCode, string? source);
    bool TrackAudioPlay(Guid poiId, string? languageCode, string? source);
    int GetActiveVisitorsCount(int minutes = 5);

    IReadOnlyList<TopShopSummary> GetTopShops(int days = 30, int limit = 10, string metric = "visits");

    IReadOnlyList<TopPoiSummary> GetTopPois(int days = 30, int limit = 10, string metric = "visits");
}


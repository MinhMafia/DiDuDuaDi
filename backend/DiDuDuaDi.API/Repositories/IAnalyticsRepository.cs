using System;

namespace DiDuDuaDi.API.Repositories;

public interface IAnalyticsRepository
{
    bool TrackPoiView(Guid poiId, string? languageCode, string? source);
    bool TrackAudioPlay(Guid poiId, string? languageCode, string? source);
}

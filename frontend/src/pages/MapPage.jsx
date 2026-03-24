import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import SpeechGuidePlayer from "../components/audio/SpeechGuidePlayer";
import MapView from "../components/map/MapView";
import Loading from "../components/common/Loading";
import useGeolocation from "../hooks/useGeolocation";
import { getNearbyPois, getPois } from "../services/poiService";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { VINH_KHANH_CENTER } from "../utils/constants";
import {
  calculateDistanceMeters,
  formatDistance,
  getLocalizedValue,
} from "../utils/helpers";
import "./MapPage.css";

const DEFAULT_RADIUS = 500;

export default function MapPage() {
  const { i18n, t } = useTranslation();
  const autoPlayAudio = useSelector((state) => state.app.autoPlayAudio);
  const autoFocusedPoiRef = useRef("");
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [demoLocation, setDemoLocation] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [selectedPoiPlaybackKey, setSelectedPoiPlaybackKey] = useState("");
  const [mapCenter, setMapCenter] = useState(VINH_KHANH_CENTER);
  const { error: geoError, isLoading: geoLoading, location } = useGeolocation();
  const effectiveLocation = demoLocation ?? location;

  const allPoisQuery = useQuery({
    queryKey: ["pois"],
    queryFn: getPois,
    select: (response) => response.data ?? [],
  });

  const nearbyPoisQuery = useQuery({
    queryKey: ["pois", "nearby", effectiveLocation?.lat, effectiveLocation?.lng, radius],
    queryFn: () => getNearbyPois(effectiveLocation.lat, effectiveLocation.lng, radius),
    enabled: !!effectiveLocation,
    select: (response) => response.data ?? [],
  });

  const rawVisiblePois = effectiveLocation
    ? (nearbyPoisQuery.data ?? [])
    : (allPoisQuery.data ?? []);

  const visiblePois = useMemo(
    () =>
      rawVisiblePois.map((poi) => ({
        ...poi,
        audioUrl:
          getLocalizedValue(poi.audioGuides, i18n.language) ||
          getLocalizedValue(poi.audioUrl, i18n.language) ||
          poi.audioUrl ||
          "",
        displayDescription: getLocalizedValue(poi.description, i18n.language),
        displayName: getLocalizedValue(poi.name, i18n.language),
      })),
    [i18n.language, rawVisiblePois],
  );

  useEffect(() => {
    if (!selectedPoi || visiblePois.some((poi) => poi.id === selectedPoi.id)) {
      return;
    }

    setSelectedPoi(null);
  }, [selectedPoi, visiblePois]);

  useEffect(() => {
    if (!selectedPoi) return;
    setSelectedPoiPlaybackKey(`${selectedPoi.id}-${i18n.language}-${Date.now()}`);
  }, [i18n.language, selectedPoi]);

  useEffect(() => {
    if (selectedPoi) {
      setMapCenter(selectedPoi.location);
      return;
    }

    if (effectiveLocation) {
      setMapCenter(effectiveLocation);
      return;
    }

    setMapCenter(VINH_KHANH_CENTER);
  }, [effectiveLocation, selectedPoi]);

  const selectedPoiDistance = useMemo(() => {
    if (!effectiveLocation || !selectedPoi) return null;
    return calculateDistanceMeters(effectiveLocation, selectedPoi.location);
  }, [effectiveLocation, selectedPoi]);

  const isLoading =
    allPoisQuery.isLoading || (effectiveLocation && nearbyPoisQuery.isLoading);
  const queryError = allPoisQuery.error || nearbyPoisQuery.error;

  const nearestPoi = visiblePois[0] ?? null;
  const nearestPoiDistance = nearestPoi && effectiveLocation
    ? calculateDistanceMeters(effectiveLocation, nearestPoi.location)
    : null;
  const shouldAutoNarrate =
    autoPlayAudio && Boolean(selectedPoiDistance) && selectedPoiDistance <= 35;

  useEffect(() => {
    if (!autoPlayAudio || !nearestPoi || !nearestPoiDistance || nearestPoiDistance > 35) {
      return;
    }

    if (autoFocusedPoiRef.current === nearestPoi.id) {
      return;
    }

    autoFocusedPoiRef.current = nearestPoi.id;
    handleSelectPoi(nearestPoi);
  }, [autoPlayAudio, nearestPoi, nearestPoiDistance]);

  function handleSelectPoi(poi) {
    if (!poi) {
      setSelectedPoi(null);
      setSelectedPoiPlaybackKey("");
      return;
    }

    setSelectedPoi(poi);
    setSelectedPoiPlaybackKey(`${poi.id}-${Date.now()}`);
    if (poi?.location) {
      setMapCenter(poi.location);
    }
  }

  function handleCenterOnUser() {
    if (!location) return;
    setDemoLocation(null);
    setSelectedPoi(null);
    setSelectedPoiPlaybackKey("");
    setMapCenter(location);
  }

  function handleJumpToVinhKhanh() {
    setDemoLocation(VINH_KHANH_CENTER);
    setSelectedPoi(null);
    setSelectedPoiPlaybackKey("");
    setMapCenter(VINH_KHANH_CENTER);
  }

  const speechLanguage =
    SUPPORTED_LANGUAGES.find((language) => language.code === i18n.language)?.speechLocale ||
    "vi-VN";

  return (
    <section className="map-page">
      <div className="map-shell">
        <header className="map-header-card">
          <div>
            <p className="eyebrow">{t("map.liveMap")}</p>
            <h1>{t("map.title")}</h1>
            <p className="supporting-text">{t("map.subtitle")}</p>
          </div>

          <div className="status-row">
            <span className={`status-pill ${effectiveLocation ? "ok" : ""}`}>
              {demoLocation
                ? t("map.demoMode")
                : location
                  ? t("map.gpsOn")
                  : t("map.gpsWaiting")}
            </span>
            <span className="status-pill">
              {t("map.poiCount", { count: visiblePois.length })}
            </span>
          </div>
        </header>

        <div className="map-content-grid">
          <div className="map-stage-card">
            <div className="map-toolbar">
              <label className="radius-control">
                <span>{t("map.searchRadius", { radius })}</span>
                <input
                  type="range"
                  min="100"
                  max="1200"
                  step="50"
                  value={radius}
                  onChange={(event) => setRadius(Number(event.target.value))}
                />
              </label>

              <div className="map-toolbar-text">
                {effectiveLocation ? (
                  <span>
                    {effectiveLocation.lat.toFixed(5)}, {effectiveLocation.lng.toFixed(5)}
                  </span>
                ) : (
                  <span>{t("map.usingDefaultCenter")}</span>
                )}
              </div>

              <div className="map-action-group">
                <button
                  type="button"
                  className="map-action-button secondary"
                  onClick={handleJumpToVinhKhanh}
                >
                  {t("map.jumpToVinhKhanh")}
                </button>
                <button
                  type="button"
                  className="map-action-button"
                  disabled={!location}
                  onClick={handleCenterOnUser}
                >
                  {t("map.centerOnMe")}
                </button>
              </div>
            </div>

            <div className="map-canvas">
              <MapView
                center={mapCenter}
                pois={visiblePois}
                selectedPoi={selectedPoi}
                selectedPoiId={selectedPoi?.id}
                selectedPoiDistanceLabel={
                  selectedPoiDistance
                    ? t("map.distanceFromYou", {
                        distance: formatDistance(selectedPoiDistance),
                      })
                    : ""
                }
                userLocation={effectiveLocation}
                userLocationLabel={demoLocation ? t("map.demoLocationLabel") : t("map.userLocationLabel")}
                onSelectPoi={handleSelectPoi}
              />
            </div>

            <div className="map-legend">
              <span>
                <strong>{t("map.legendYou")}</strong>
              </span>
              <span>
                <strong>{t("map.legendPoi")}</strong>
              </span>
              <span>
                <strong>{t("map.legendSelected")}</strong>
              </span>
            </div>
          </div>

          <aside className="map-side-panel">
            <article className="panel-card">
              <h2>{t("map.nearbyTitle")}</h2>
              {geoLoading ? <p className="supporting-text">{t("map.requestingLocation")}</p> : null}
              {geoError ? <p className="error-text">{geoError}</p> : null}
              {!geoError && effectiveLocation ? (
                <p className="supporting-text">
                  {t("map.locationReady", {
                    lat: effectiveLocation.lat.toFixed(5),
                    lng: effectiveLocation.lng.toFixed(5),
                  })}
                </p>
              ) : null}
              {demoLocation ? (
                <p className="supporting-text">{t("map.demoHint")}</p>
              ) : null}
              {nearestPoi && nearestPoiDistance ? (
                <p className="supporting-text">
                  {t("map.nearestPoi", {
                    name: nearestPoi.displayName,
                    distance: formatDistance(nearestPoiDistance),
                  })}
                </p>
              ) : null}
              {isLoading ? <Loading /> : null}
              {queryError ? (
                <p className="error-text">
                  {queryError.message || t("map.loadError")}
                </p>
              ) : null}

              {!isLoading && !queryError && visiblePois.length === 0 ? (
                <p className="supporting-text">{t("map.emptyNearby")}</p>
              ) : null}

              <div className="poi-list">
                {visiblePois.map((poi) => {
                  const distance = effectiveLocation
                    ? calculateDistanceMeters(effectiveLocation, poi.location)
                    : null;

                  return (
                    <button
                      key={poi.id}
                      type="button"
                      className={`poi-card ${selectedPoi?.id === poi.id ? "active" : ""}`}
                      onClick={() => handleSelectPoi(poi)}
                    >
                      <div className="poi-card-head">
                        <strong>{poi.displayName}</strong>
                        <span className="poi-category">{poi.category}</span>
                      </div>
                      <p>{poi.displayDescription || t("map.noDescription")}</p>
                      <div className="poi-meta">
                        <span>
                          {poi.location.lat.toFixed(4)}, {poi.location.lng.toFixed(4)}
                        </span>
                        {distance ? <span>{formatDistance(distance)}</span> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>

            <article className="panel-card">
              <h2>{t("map.selectedPoi")}</h2>
              {!selectedPoi ? (
                <p className="supporting-text">{t("map.selectHint")}</p>
              ) : (
                <div className="selected-poi">
                  <strong>{selectedPoi.displayName}</strong>
                  <span className="poi-category">{selectedPoi.category}</span>
                  <p>{selectedPoi.displayDescription || t("map.noDescription")}</p>
                  {selectedPoiDistance ? (
                    <p>{t("map.distanceFromYou", { distance: formatDistance(selectedPoiDistance) })}</p>
                  ) : (
                    <p>{t("map.tapPoiHint")}</p>
                  )}
                  <SpeechGuidePlayer
                    audioUrl={selectedPoi.audioUrl}
                    playbackKey={selectedPoiPlaybackKey || selectedPoi.id}
                    speechLanguage={speechLanguage}
                    speechText={selectedPoi.displayDescription}
                    title={`${selectedPoi.displayName}${
                      selectedPoiPlaybackKey || shouldAutoNarrate
                        ? ` (${t("audio.autoPlayReady")})`
                        : ""
                    }`}
                    triggerAutoSpeak={Boolean(selectedPoiPlaybackKey) || shouldAutoNarrate}
                  />
                </div>
              )}
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
}

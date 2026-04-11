import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import SpeechGuidePlayer from "../components/audio/SpeechGuidePlayer";
import PoiDetailSheet from "../components/map/PoiDetailSheet";
import MapView from "../components/map/MapView";
import Loading from "../components/common/Loading";
import useGeolocation from "../hooks/useGeolocation";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { setAutoNarrateOnTouch, setAutoPlayAudio } from "../store/slices/appSlice";
import { trackAudioPlay, trackPoiView } from "../services/analyticsService";
import { getNearbyPois, getPois } from "../services/poiService";
import { getDrivingRoute } from "../services/routeService";
import { translateText } from "../services/translateService";
import { VINH_KHANH_CENTER } from "../utils/constants";
import {
  calculateDistanceMeters,
  formatDistance,
  getLocalizedValue,
} from "../utils/helpers";
import "./MapPage.css";

const DEFAULT_RADIUS = 500;
const DEFAULT_MAP_ZOOM = 16;
const SEARCH_FOCUS_ZOOM = 18;

export default function MapPage() {
  const { i18n, t } = useTranslation();
  const dispatch = useDispatch();
  const autoPlayAudio = useSelector((state) => state.app.autoPlayAudio);
  const autoNarrateOnTouch = useSelector((state) => state.app.autoNarrateOnTouch);
  const searchContainerRef = useRef(null);
  const autoFocusedPoiRef = useRef("");
  const trackedAudioRef = useRef("");
  const trackedPoiViewRef = useRef("");
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [demoLocation, setDemoLocation] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [isPoiDetailOpen, setIsPoiDetailOpen] = useState(false);
  const [selectedPoiPlaybackKey, setSelectedPoiPlaybackKey] = useState("");
  const [poiSearchTerm, setPoiSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(VINH_KHANH_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [viewCenter, setViewCenter] = useState(null);
  const [translatedPoiContent, setTranslatedPoiContent] = useState({});
  const { error: geoError, isLoading: geoLoading, location } = useGeolocation();
  const effectiveLocation = demoLocation ?? location;

  const speechLanguage =
    SUPPORTED_LANGUAGES.find((language) => language.code === i18n.language)?.speechLocale ||
    "vi-VN";

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

  const rawVisiblePois = effectiveLocation ? nearbyPoisQuery.data ?? [] : allPoisQuery.data ?? [];

  useEffect(() => {
    let isCanceled = false;

    async function hydrateMissingTranslations() {
      const nextTranslatedContent = {};

      await Promise.all(
        rawVisiblePois.map(async (poi) => {
          const translatedEntry = {};

          if (shouldDynamicallyTranslate(poi.name, i18n.language)) {
            translatedEntry.displayName = await safeTranslate(
              getTranslationSeed(poi.name, i18n.language),
              speechLanguage,
            );
          }

          if (shouldDynamicallyTranslate(poi.description, i18n.language)) {
            translatedEntry.displayDescription = await safeTranslate(
              getTranslationSeed(poi.description, i18n.language),
              speechLanguage,
            );
          }

          if (shouldTranslatePlainText(poi.approvedIntroduction, i18n.language)) {
            translatedEntry.displayIntroduction = await safeTranslate(
              poi.approvedIntroduction,
              speechLanguage,
            );
          }

          if (Object.keys(translatedEntry).length > 0) {
            nextTranslatedContent[poi.id] = translatedEntry;
          }
        }),
      );

      if (!isCanceled) {
        setTranslatedPoiContent(nextTranslatedContent);
      }
    }

    if (!rawVisiblePois.length) {
      setTranslatedPoiContent({});
      return undefined;
    }

    hydrateMissingTranslations();

    return () => {
      isCanceled = true;
    };
  }, [i18n.language, rawVisiblePois, speechLanguage]);

  const visiblePois = useMemo(
    () =>
      rawVisiblePois.map((poi) => {
        const translatedEntry = translatedPoiContent[poi.id] ?? {};

        return {
          ...poi,
          audioUrl:
            getLocalizedValue(poi.audioGuides, i18n.language) ||
            getLocalizedValue(poi.audioUrl, i18n.language) ||
            poi.audioUrl ||
            "",
          displayDescription:
            translatedEntry.displayDescription ||
            getLocalizedValue(poi.description, i18n.language),
          displayIntroduction:
            translatedEntry.displayIntroduction || poi.approvedIntroduction || "",
          displayName:
            translatedEntry.displayName || getLocalizedValue(poi.name, i18n.language),
        };
      }),
    [i18n.language, rawVisiblePois, translatedPoiContent],
  );

  const normalizedSearchTerm = normalizeForSearch(poiSearchTerm.trim());
  const poiSearchResults = useMemo(() => {
    if (!normalizedSearchTerm) return [];

    return visiblePois
      .filter((poi) => {
        const name = normalizeForSearch(poi.displayName);
        const category = normalizeForSearch(poi.category);
        return name.includes(normalizedSearchTerm) || category.includes(normalizedSearchTerm);
      })
      .slice(0, 8);
  }, [normalizedSearchTerm, visiblePois]);

  useEffect(() => {
    if (!selectedPoi) return;

    const matchedPoi = visiblePois.find((poi) => poi.id === selectedPoi.id);
    if (!matchedPoi) {
      setSelectedPoi(null);
      setSelectedPoiPlaybackKey("");
      setIsPoiDetailOpen(false);
      return;
    }

    if (matchedPoi !== selectedPoi) {
      setSelectedPoi(matchedPoi);
    }
  }, [selectedPoi, visiblePois]);

  useEffect(() => {
    if (!selectedPoi || !selectedPoiPlaybackKey) return;

    setSelectedPoiPlaybackKey(buildPlaybackKey(selectedPoi.id, i18n.language));
  }, [i18n.language, selectedPoi]);

  useEffect(() => {
    if (!isSearchOpen) return undefined;

    const handleClickOutside = (event) => {
      if (!searchContainerRef.current?.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!selectedPoi?.shopId) return;

    const trackingKey = `${selectedPoi.id}:${i18n.language}`;
    if (trackedPoiViewRef.current === trackingKey) {
      return;
    }

    trackedPoiViewRef.current = trackingKey;
    trackPoiView({
      poiId: selectedPoi.id,
      languageCode: i18n.language,
      source: demoLocation ? "demo-map" : "map",
    }).catch(() => {});
  }, [demoLocation, i18n.language, selectedPoi]);

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

  const isLoading = allPoisQuery.isLoading || (effectiveLocation && nearbyPoisQuery.isLoading);
  const queryError = allPoisQuery.error || nearbyPoisQuery.error;

  const nearestPoi = visiblePois[0] ?? null;
  const nearestPoiDistance =
    nearestPoi && effectiveLocation
      ? calculateDistanceMeters(effectiveLocation, nearestPoi.location)
      : null;

  const routeQuery = useQuery({
    queryKey: [
      "route",
      effectiveLocation?.lat,
      effectiveLocation?.lng,
      selectedPoi?.id,
      selectedPoi?.location?.lat,
      selectedPoi?.location?.lng,
    ],
    queryFn: () => getDrivingRoute(effectiveLocation, selectedPoi.location),
    enabled: Boolean(effectiveLocation && selectedPoi?.location),
    staleTime: 60_000,
  });
  const routePath = routeQuery.data?.coordinates ?? [];

  useEffect(() => {
    if (!autoPlayAudio || !nearestPoi || !nearestPoiDistance || nearestPoiDistance > 35) {
      return;
    }

    if (autoFocusedPoiRef.current === nearestPoi.id) {
      return;
    }

    autoFocusedPoiRef.current = nearestPoi.id;
    handleSelectPoi(nearestPoi, { narrateNow: true });
  }, [autoPlayAudio, nearestPoi, nearestPoiDistance]);

  function handleSelectPoi(poi, options = {}) {
    if (!poi) {
      setSelectedPoi(null);
      setSelectedPoiPlaybackKey("");
      setIsPoiDetailOpen(false);
      return;
    }

    const shouldNarrate =
      Boolean(options.narrateNow) ||
      (Boolean(options.touchTriggered) && autoNarrateOnTouch);

    setSelectedPoi(poi);
    if (poi?.location) {
      setMapCenter(poi.location);
      if (options.zoomToPoi) {
        setMapZoom(SEARCH_FOCUS_ZOOM);
      }
    }

    if (shouldNarrate) {
      setSelectedPoiPlaybackKey(buildPlaybackKey(poi.id, i18n.language));
    } else if (options.resetPlayback !== false) {
      setSelectedPoiPlaybackKey("");
    }
  }

  function handleReplayNarration(poi) {
    if (!poi || !autoNarrateOnTouch) return;

    setSelectedPoi(poi);
    setSelectedPoiPlaybackKey(buildPlaybackKey(poi.id, i18n.language));
  }

  function handleCenterOnUser() {
    if (!location) return;
    setDemoLocation(null);
    setSelectedPoi(null);
    setSelectedPoiPlaybackKey("");
    setIsPoiDetailOpen(false);
    setMapCenter(location);
    setMapZoom(DEFAULT_MAP_ZOOM);
  }

  function handleJumpToVinhKhanh() {
    setDemoLocation(VINH_KHANH_CENTER);
    setSelectedPoi(null);
    setSelectedPoiPlaybackKey("");
    setIsPoiDetailOpen(false);
    setMapCenter(VINH_KHANH_CENTER);
    setMapZoom(DEFAULT_MAP_ZOOM);
  }

  function handleMapMoveEnd(center) {
    setViewCenter(center);
  }

  function handleMapLongPress(latlng) {
    setDemoLocation({ lat: latlng.lat, lng: latlng.lng });
    setMapCenter({ lat: latlng.lat, lng: latlng.lng });
    setMapZoom(DEFAULT_MAP_ZOOM);
  }

  function handleSearchThisArea() {
    if (viewCenter) {
      setDemoLocation({ lat: viewCenter.lat, lng: viewCenter.lng });
    }
  }

  function handleSelectSearchResult(poi) {
    handleSelectPoi(poi, { touchTriggered: true, zoomToPoi: true });
    setPoiSearchTerm(poi.displayName || "");
    setIsSearchOpen(false);
  }

  function handleClearSearch() {
    setPoiSearchTerm("");
    setIsSearchOpen(false);
  }

  const distanceToViewCenter =
    viewCenter && effectiveLocation ? calculateDistanceMeters(effectiveLocation, viewCenter) : 0;
  const showSearchBtn = distanceToViewCenter > 50;

  function handleAudioPlaybackStart() {
    if (!selectedPoi?.shopId) return;

    const trackingKey = `${selectedPoi.id}:${i18n.language}:${selectedPoiPlaybackKey || "manual"}`;
    if (trackedAudioRef.current === trackingKey) {
      return;
    }

    trackedAudioRef.current = trackingKey;
    trackAudioPlay({
      poiId: selectedPoi.id,
      languageCode: i18n.language,
      source: selectedPoi.audioUrl ? "audio-file" : "tts",
    }).catch(() => {});
  }

  const detailRouteSummary =
    effectiveLocation && selectedPoi
      ? routeQuery.isLoading
        ? t("map.routeLoading")
        : routeQuery.isError
          ? t("map.routeError")
          : routeQuery.data
            ? t("map.routeSummary", {
                distance: formatDistance(routeQuery.data.distanceMeters),
                minutes: Math.max(1, Math.round(routeQuery.data.durationSeconds / 60)),
              })
            : ""
      : "";

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
              {demoLocation ? t("map.demoMode") : location ? t("map.gpsOn") : t("map.gpsWaiting")}
            </span>
            <span className="status-pill">{t("map.poiCount", { count: visiblePois.length })}</span>
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

              <div className="map-search" ref={searchContainerRef}>
                <div className="map-search-input-wrap">
                  <input
                    type="text"
                    className="map-search-input"
                    value={poiSearchTerm}
                    placeholder={t("map.searchPlaceholder")}
                    onFocus={() => setIsSearchOpen(true)}
                    onChange={(event) => {
                      setPoiSearchTerm(event.target.value);
                      setIsSearchOpen(true);
                    }}
                  />
                  {poiSearchTerm ? (
                    <button
                      type="button"
                      className="map-search-clear"
                      onClick={handleClearSearch}
                      aria-label={t("map.searchClear")}
                      title={t("map.searchClear")}
                    >
                      ×
                    </button>
                  ) : null}
                </div>

                {isSearchOpen && normalizedSearchTerm ? (
                  <div className="map-search-dropdown">
                    {poiSearchResults.length ? (
                      poiSearchResults.map((poi) => (
                        <button
                          type="button"
                          key={poi.id}
                          className="map-search-item"
                          onClick={() => handleSelectSearchResult(poi)}
                        >
                          <strong>{poi.displayName}</strong>
                          <span>{poi.category}</span>
                        </button>
                      ))
                    ) : (
                      <p className="map-search-empty">{t("map.searchNoResult")}</p>
                    )}
                  </div>
                ) : null}
              </div>

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

            <div className="map-toggle-group">
              <label className="map-toggle-chip">
                <input
                  type="checkbox"
                  checked={autoNarrateOnTouch}
                  onChange={(event) =>
                    dispatch(setAutoNarrateOnTouch(event.target.checked))
                  }
                />
                <span>
                  {t("map.autoNarrateOnTouch", {
                    defaultValue: "Tự thuyết minh khi chạm POI hoặc mô tả",
                  })}
                </span>
              </label>

              <label className="map-toggle-chip">
                <input
                  type="checkbox"
                  checked={autoPlayAudio}
                  onChange={(event) => dispatch(setAutoPlayAudio(event.target.checked))}
                />
                <span>
                  {t("map.autoNarrateNearby", {
                    defaultValue: "Tự thuyết minh khi ở gần POI",
                  })}
                </span>
              </label>
            </div>

            <div className="map-canvas">
              {showSearchBtn ? (
                <button className="search-area-btn" onClick={handleSearchThisArea} type="button">
                  {t("map.searchThisArea", { defaultValue: "Tìm quanh khu vực này" })}
                </button>
              ) : null}
              <MapView
                center={mapCenter}
                zoom={mapZoom}
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
                userLocationLabel={
                  demoLocation ? t("map.demoLocationLabel") : t("map.userLocationLabel")
                }
                routePath={routePath}
                onSelectPoi={(poi) => handleSelectPoi(poi, { touchTriggered: true })}
                onMapMoveEnd={handleMapMoveEnd}
                onMapLongPress={handleMapLongPress}
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
              {demoLocation ? <p className="supporting-text">{t("map.demoHint")}</p> : null}
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
                <p className="error-text">{queryError.message || t("map.loadError")}</p>
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
                      onClick={() => handleSelectPoi(poi, { touchTriggered: true })}
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
                  {autoNarrateOnTouch ? (
                    <button
                      type="button"
                      className="poi-description-trigger"
                      onClick={() => handleReplayNarration(selectedPoi)}
                    >
                      {selectedPoi.displayDescription || t("map.noDescription")}
                    </button>
                  ) : (
                    <p>{selectedPoi.displayDescription || t("map.noDescription")}</p>
                  )}
                  {selectedPoi.displayIntroduction ? (
                    <p className="selected-poi-intro">{selectedPoi.displayIntroduction}</p>
                  ) : null}
                  {selectedPoi.shopAddress ? (
                    <p className="selected-poi-address">{selectedPoi.shopAddress}</p>
                  ) : null}
                  {selectedPoiDistance ? (
                    <p>
                      {t("map.distanceFromYou", {
                        distance: formatDistance(selectedPoiDistance),
                      })}
                    </p>
                  ) : (
                    <p>{t("map.tapPoiHint")}</p>
                  )}
                  {effectiveLocation && selectedPoi ? (
                    routeQuery.isLoading ? (
                      <p className="supporting-text">{t("map.routeLoading")}</p>
                    ) : routeQuery.isError ? (
                      <p className="error-text">{t("map.routeError")}</p>
                    ) : routeQuery.data ? (
                      <p className="supporting-text">
                        {t("map.routeSummary", {
                          distance: formatDistance(routeQuery.data.distanceMeters),
                          minutes: Math.max(1, Math.round(routeQuery.data.durationSeconds / 60)),
                        })}
                      </p>
                    ) : null
                  ) : null}
                  {selectedPoi.menuItems?.length ? (
                    <div className="poi-menu-preview">
                      <h3>{t("map.menuTitle")}</h3>
                      <div className="poi-menu-list">
                        {selectedPoi.menuItems.map((item) => (
                          <article key={item.id} className="poi-menu-item">
                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : null}
                            <div>
                              <strong>{item.name}</strong>
                              <p>{item.description}</p>
                              <span>
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                  maximumFractionDigits: 0,
                                }).format(item.price || 0)}
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="map-detail-button"
                    onClick={() => setIsPoiDetailOpen(true)}
                  >
                    {t("map.viewDetail")}
                  </button>
                  <SpeechGuidePlayer
                    audioUrl={selectedPoi.audioUrl}
                    onPlaybackStart={handleAudioPlaybackStart}
                    playbackKey={selectedPoiPlaybackKey || selectedPoi.id}
                    speechLanguage={speechLanguage}
                    speechText={selectedPoi.displayDescription}
                    title={`${selectedPoi.displayName}${
                      selectedPoiPlaybackKey
                        ? ` (${t("audio.autoPlayReady")})`
                        : ""
                    }`}
                    triggerAutoSpeak={Boolean(selectedPoiPlaybackKey)}
                  />
                </div>
              )}
            </article>
          </aside>
        </div>
      </div>
      {isPoiDetailOpen && selectedPoi ? (
        <PoiDetailSheet
          poi={selectedPoi}
          autoNarrateOnTouch={autoNarrateOnTouch}
          distanceLabel={
            selectedPoiDistance
              ? t("map.distanceFromYou", {
                  distance: formatDistance(selectedPoiDistance),
                })
              : ""
          }
          routeSummary={detailRouteSummary}
          speechLanguage={speechLanguage}
          onClose={() => setIsPoiDetailOpen(false)}
          onNarrateRequest={() => handleReplayNarration(selectedPoi)}
          onPlaybackStart={handleAudioPlaybackStart}
          playbackKey={selectedPoiPlaybackKey || selectedPoi.id}
          speechText={selectedPoi.displayDescription}
          titleSuffix={selectedPoiPlaybackKey ? t("audio.autoPlayReady") : ""}
          triggerAutoSpeak={Boolean(selectedPoiPlaybackKey)}
        />
      ) : null}
    </section>
  );
}

function normalizeForSearch(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasDirectLocalizedValue(value, language) {
  if (!value) return false;
  if (typeof value !== "object") return false;
  return Boolean(value[language]);
}

function shouldDynamicallyTranslate(value, language) {
  if (!value || language === "vi") return false;
  return !hasDirectLocalizedValue(value, language);
}

function shouldTranslatePlainText(value, language) {
  if (!value || typeof value !== "string") return false;
  return language !== "vi";
}

function getTranslationSeed(value, language) {
  if (!value) return "";
  if (typeof value === "string") return value;

  return (
    value[language] ||
    value.vi ||
    value.en ||
    Object.values(value).find((item) => typeof item === "string") ||
    ""
  );
}

async function safeTranslate(text, targetLanguage) {
  if (!text) return "";

  try {
    return await translateText(text, targetLanguage);
  } catch {
    return text;
  }
}

function buildPlaybackKey(poiId, language) {
  return `${poiId}-${language}-${Date.now()}`;
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import SpeechGuidePlayer from "../components/audio/SpeechGuidePlayer";
import PoiDetailSheet from "../components/map/PoiDetailSheet";
import MapView from "../components/map/MapView";
import Loading from "../components/common/Loading";
import PoiQrCard from "../components/common/PoiQrCard";
import useDeviceHeading from "../hooks/useDeviceHeading";
import useGeolocation from "../hooks/useGeolocation";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { setAutoNarrateOnTouch, setAutoPlayAudio } from "../store/slices/appSlice";
import { trackAudioPlay, trackPoiView } from "../services/analyticsService";
import { getNearbyPois, getPois } from "../services/poiService";
import { getDrivingRoute } from "../services/routeService";
import { getTours } from "../services/tourService";
import { translateText } from "../services/translateService";
import { VINH_KHANH_CENTER } from "../utils/constants";
import { describeNetwork, getNetworkSnapshot } from "../utils/deviceStatus";
import userService from "../services/userService";
import {
  calculateDistanceMeters,
  formatDistance,
  getLocalizedValue,
  resolveBackendUrl,
} from "../utils/helpers";
import "./MapPage.css";

const DEFAULT_RADIUS = 500;
const RADIUS_OPTIONS = [50, 100, 200, 500];
const ALL_RADIUS_OPTION = "all";
const AUTO_NARRATE_NEARBY_DISTANCE_METERS = 35;
const DEFAULT_MAP_ZOOM = 16;
const SEARCH_FOCUS_ZOOM = 18;

export default function MapPage() {
  const { i18n, t } = useTranslation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.app.currentUser);
  const autoPlayAudio = useSelector((state) => state.app.autoPlayAudio);
  const autoNarrateOnTouch = useSelector((state) => state.app.autoNarrateOnTouch);
  const searchContainerRef = useRef(null);
  const autoFocusedPoiRef = useRef("");
  const trackedAudioRef = useRef("");
  const trackedPoiViewRef = useRef("");
  const [radius, setRadius] = useState(String(DEFAULT_RADIUS));
  const [demoLocation, setDemoLocation] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [isPoiDetailOpen, setIsPoiDetailOpen] = useState(false);
  const [selectedPoiPlaybackKey, setSelectedPoiPlaybackKey] = useState("");
  const [selectedTourId, setSelectedTourId] = useState("");
  const [poiSearchTerm, setPoiSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false,
  );
  const [mobilePanel, setMobilePanel] = useState("map");
  const [mapCenter, setMapCenter] = useState(VINH_KHANH_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [networkSnapshot, setNetworkSnapshot] = useState(() => getNetworkSnapshot());
  const [viewCenter, setViewCenter] = useState(null);
  const [translatedPoiContent, setTranslatedPoiContent] = useState({});
  const { error: geoError, isLoading: geoLoading, location } = useGeolocation();
  const {
    error: deviceHeadingError,
    heading: deviceHeading,
    isListening: isDeviceHeadingListening,
    isSupported: isDeviceHeadingSupported,
    permissionState: deviceHeadingPermissionState,
    requestHeading: requestDeviceHeading,
    stopHeading: stopDeviceHeading,
  } = useDeviceHeading();
  const effectiveLocation = demoLocation ?? location;

  const numericRadius = radius === ALL_RADIUS_OPTION ? null : Number(radius);

  const speechLanguage =
    SUPPORTED_LANGUAGES.find((language) => language.code === i18n.language)?.speechLocale ||
    "vi-VN";

  const allPoisQuery = useQuery({
    queryKey: ["pois"],
    queryFn: getPois,
    select: (response) => response.data ?? [],
  });

  const toursQuery = useQuery({
    queryKey: ["tours"],
    queryFn: getTours,
    select: (response) => (Array.isArray(response) ? response : response?.data ?? []),
  });

  const nearbyPoisQuery = useQuery({
    queryKey: ["pois", "nearby", effectiveLocation?.lat, effectiveLocation?.lng, numericRadius],
    queryFn: () => getNearbyPois(effectiveLocation.lat, effectiveLocation.lng, numericRadius),
    enabled: Boolean(effectiveLocation && numericRadius),
    select: (response) => response.data ?? [],
  });

  const allPois = allPoisQuery.data ?? [];
  const tours = toursQuery.data ?? [];
  const rawVisiblePois = effectiveLocation
    ? numericRadius
      ? nearbyPoisQuery.data ?? []
      : allPois
    : allPois;

  const radiusLabel =
    radius === ALL_RADIUS_OPTION ? t("map.radiusAllOption") : `${numericRadius}m`;

  const selectedTour = useMemo(
    () => tours.find((tour) => tour.id === selectedTourId) ?? null,
    [selectedTourId, tours],
  );

  const rawTourPois = useMemo(() => {
    if (!selectedTour) return [];

    const poiById = new Map(allPois.map((poi) => [poi.id, poi]));
    return (selectedTour.steps ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((step) => {
        const poi = poiById.get(step.poiId);
        return poi ? { ...poi, tourOrder: step.order } : null;
      })
      .filter(Boolean);
  }, [allPois, selectedTour]);

  const rawDisplayPois = selectedTour ? rawTourPois : rawVisiblePois;

  useEffect(() => {
    let isCanceled = false;

    async function hydrateMissingTranslations() {
      const nextTranslatedContent = {};

      await Promise.all(
        rawDisplayPois.map(async (poi) => {
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

    if (!rawDisplayPois.length) {
      setTranslatedPoiContent({});
      return undefined;
    }

    hydrateMissingTranslations();

    return () => {
      isCanceled = true;
    };
  }, [i18n.language, rawDisplayPois, speechLanguage]);

  const displayPois = useMemo(
    () => {
      const mapped = rawDisplayPois.map((poi) => {
        const translatedEntry = translatedPoiContent[poi.id] ?? {};

        return {
          ...poi,
          audioUrl: resolveBackendUrl(
            getLocalizedValue(poi.audioGuides, i18n.language) ||
              getLocalizedValue(poi.audioUrl, i18n.language) ||
              poi.audioUrl ||
              "",
          ),
          displayDescription:
            translatedEntry.displayDescription ||
            getLocalizedValue(poi.description, i18n.language),
          displayIntroduction:
            translatedEntry.displayIntroduction || poi.approvedIntroduction || "",
          displayName:
            translatedEntry.displayName || getLocalizedValue(poi.name, i18n.language),
        };
      });

      return mapped.sort((a, b) => {
        if (selectedTour) {
          return (a.tourOrder ?? 0) - (b.tourOrder ?? 0);
        }

        if (a.isFavorite === b.isFavorite) return 0;
        return a.isFavorite ? -1 : 1;
      });
    },
    [i18n.language, rawDisplayPois, selectedTour, translatedPoiContent],
  );

  const normalizedSearchTerm = normalizeForSearch(poiSearchTerm.trim());
  const poiSearchResults = useMemo(() => {
    if (!normalizedSearchTerm) return [];

    return displayPois
      .filter((poi) => {
        const name = normalizeForSearch(poi.displayName);
        const category = normalizeForSearch(poi.category);
        return name.includes(normalizedSearchTerm) || category.includes(normalizedSearchTerm);
      })
      .slice(0, 8);
  }, [displayPois, normalizedSearchTerm]);

  useEffect(() => {
    if (!selectedPoi) return;

    const matchedPoi = displayPois.find((poi) => poi.id === selectedPoi.id);
    if (!matchedPoi) {
      setSelectedPoi(null);
      setSelectedPoiPlaybackKey("");
      setIsPoiDetailOpen(false);
      return;
    }

    if (matchedPoi !== selectedPoi) {
      setSelectedPoi(matchedPoi);
    }
  }, [displayPois, selectedPoi]);

  useEffect(() => {
    if (!selectedTour || selectedPoi || !rawTourPois.length) {
      return;
    }

    setSelectedPoi(rawTourPois[0]);
    setMapCenter(rawTourPois[0].location);
    setMapZoom(DEFAULT_MAP_ZOOM);
  }, [rawTourPois, selectedPoi, selectedTour]);

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
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const syncViewport = (event) => {
      setIsMobileViewport(event.matches);
      if (!event.matches) {
        setMobilePanel("map");
      }
    };

    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const syncNetworkStatus = () => setNetworkSnapshot(getNetworkSnapshot());

    syncNetworkStatus();
    window.addEventListener("online", syncNetworkStatus);
    window.addEventListener("offline", syncNetworkStatus);
    connection?.addEventListener?.("change", syncNetworkStatus);

    return () => {
      window.removeEventListener("online", syncNetworkStatus);
      window.removeEventListener("offline", syncNetworkStatus);
      connection?.removeEventListener?.("change", syncNetworkStatus);
    };
  }, []);

  useEffect(() => {
    if (demoLocation && isDeviceHeadingListening) {
      stopDeviceHeading();
    }
  }, [demoLocation, isDeviceHeadingListening, stopDeviceHeading]);

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

  const isLoading =
    allPoisQuery.isLoading || Boolean(effectiveLocation && numericRadius && nearbyPoisQuery.isLoading);
  const queryError = allPoisQuery.error || (numericRadius ? nearbyPoisQuery.error : null) || toursQuery.error;

  const nearestPoi = useMemo(() => {
    if (!effectiveLocation || !displayPois.length) return null;
    let minDistance = Infinity;
    let nearest = null;
    for (const poi of displayPois) {
      const dist = calculateDistanceMeters(effectiveLocation, poi.location);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = poi;
      }
    }
    return nearest;
  }, [displayPois, effectiveLocation]) ?? (displayPois[0] || null);

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
    if (
      !autoPlayAudio ||
      !nearestPoi ||
      !nearestPoiDistance ||
      nearestPoiDistance > AUTO_NARRATE_NEARBY_DISTANCE_METERS
    ) {
      return;
    }

    if (autoFocusedPoiRef.current === nearestPoi.id) {
      return;
    }

    autoFocusedPoiRef.current = nearestPoi.id;
    handleSelectPoi(nearestPoi, { narrateNow: true });
  }, [autoPlayAudio, nearestPoi, nearestPoiDistance]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ poiId, isFavorite }) => {
      if (isFavorite) {
        return userService.removeFavorite(poiId);
      } else {
        return userService.addFavorite(poiId);
      }
    },
    // When mutate is called, we optimistically update the UI
    onMutate: async ({ poiId, isFavorite }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["pois"] });

      // Snapshot the previous value of both queries
      const allPoisQueryKey = ["pois"];
      const nearbyPoisQueryKey = ["pois", "nearby", effectiveLocation?.lat, effectiveLocation?.lng, numericRadius];
      
      const previousAllPois = queryClient.getQueryData(allPoisQueryKey);
      const previousNearbyPois = queryClient.getQueryData(nearbyPoisQueryKey);

      // The function to update a POI's favorite status in a list
      const updatePoiInList = (oldData) => {
          if (!oldData) return oldData;
          // Kiểm tra nếu cache lưu object chứa .data (API response)
          if (oldData.data && Array.isArray(oldData.data)) {
              return {
                  ...oldData,
                  data: oldData.data.map(poi => 
                      poi.id === poiId ? { ...poi, isFavorite: !isFavorite } : poi
                  )
              };
          }
          // Dự phòng nếu cache đã là mảng
          if (Array.isArray(oldData)) {
              return oldData.map(poi => 
                  poi.id === poiId ? { ...poi, isFavorite: !isFavorite } : poi
              );
          }
          return oldData;
      };

      // Optimistically update to the new value
      queryClient.setQueryData(allPoisQueryKey, updatePoiInList);
      if (effectiveLocation && numericRadius) {
          queryClient.setQueryData(nearbyPoisQueryKey, updatePoiInList);
      }

      // Return a context object with the snapshotted value
      return { previousAllPois, previousNearbyPois, allPoisQueryKey, nearbyPoisQueryKey };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      queryClient.setQueryData(context.allPoisQueryKey, context.previousAllPois);
      if (context?.nearbyPoisQueryKey) {
        queryClient.setQueryData(context.nearbyPoisQueryKey, context.previousNearbyPois);
      }
    },
    // Always refetch after error or success to ensure data is in sync with the server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pois"] });
    },
  });

  function handleToggleFavorite(event, poi) {
    event.stopPropagation();
    if (!currentUser) {
      alert(t("auth.loginRequired"));
      return;
    }
    toggleFavoriteMutation.mutate({ poiId: poi.id, isFavorite: poi.isFavorite });
  }

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

    if (options.mobilePanel) {
      setMobilePanel(options.mobilePanel);
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

  function handleSelectTour(event) {
    const nextTourId = event.target.value;
    setSelectedTourId(nextTourId);
    setSelectedPoiPlaybackKey("");
    setIsPoiDetailOpen(false);

    if (!nextTourId) {
      setSelectedPoi(null);
      return;
    }

    const tour = tours.find((item) => item.id === nextTourId);
    if (!tour) {
      return;
    }

    const orderedTourStops = (tour.steps ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((step) => allPois.find((poi) => poi.id === step.poiId))
      .filter(Boolean);

    const firstStop = orderedTourStops[0];
    if (!firstStop) {
      setSelectedPoi(null);
      return;
    }

    setSelectedPoi(firstStop);
    setMapCenter(firstStop.location);
    setMapZoom(DEFAULT_MAP_ZOOM);
    setMobilePanel("map");
  }

  function handleClearSelectedTour() {
    setSelectedTourId("");
    setSelectedPoi(null);
    setSelectedPoiPlaybackKey("");
  }

  function handleCenterOnUser() {
    if (!location) return;
    setDemoLocation(null);
    setSelectedPoi(null);
    setSelectedPoiPlaybackKey("");
    setIsPoiDetailOpen(false);
    setMobilePanel("map");
    setMapCenter(location);
    setMapZoom(DEFAULT_MAP_ZOOM);
  }

  function handleJumpToVinhKhanh() {
    setDemoLocation(VINH_KHANH_CENTER);
    setSelectedPoi(null);
    setSelectedPoiPlaybackKey("");
    setIsPoiDetailOpen(false);
    setMobilePanel("map");
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
      setMobilePanel("map");
    }
  }

  function handleSelectSearchResult(poi) {
    handleSelectPoi(poi, {
      touchTriggered: true,
      zoomToPoi: true,
      mobilePanel: "map",
    });
    setPoiSearchTerm(poi.displayName || "");
    setIsSearchOpen(false);
  }

  function handleClearSearch() {
    setPoiSearchTerm("");
    setIsSearchOpen(false);
  }

  function handleToggleDeviceHeading() {
    if (isDeviceHeadingListening) {
      stopDeviceHeading();
      return;
    }

    requestDeviceHeading();
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
  const selectedPoiSpeechText = selectedPoi
    ? [selectedPoi.displayDescription, selectedPoi.displayIntroduction]
        .filter(Boolean)
        .join(" ")
    : "";
  const networkPresentation = describeNetwork(networkSnapshot, t);
  const deviceHeadingDegrees = Number.isFinite(deviceHeading) ? Math.round(deviceHeading) : null;
  const canShowRealHeading = Boolean(location) && !demoLocation;
  const isDeviceHeadingActive =
    isDeviceHeadingListening && canShowRealHeading && Number.isFinite(deviceHeadingDegrees);
  const deviceHeadingPresentation = getDeviceHeadingPresentation({
    degrees: deviceHeadingDegrees,
    error: deviceHeadingError,
    hasLocation: Boolean(location),
    isActive: isDeviceHeadingActive,
    isDemoMode: Boolean(demoLocation),
    isListening: isDeviceHeadingListening,
    isSupported: isDeviceHeadingSupported,
    permissionState: deviceHeadingPermissionState,
    t,
  });

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
            <span
              className={`status-pill network ${networkPresentation.toneClass}`}
              title={networkPresentation.hint}
            >
              {networkPresentation.label}
            </span>
            <span className="status-pill">{t("map.poiCount", { count: displayPois.length })}</span>
            {selectedTour ? (
              <span className="status-pill ok">
                {t("map.tourActiveBadge", {
                  name: getLocalizedValue(selectedTour.title, i18n.language),
                })}
              </span>
            ) : null}
          </div>
        </header>

        {isMobileViewport ? (
          <div className="map-mobile-switch" role="tablist" aria-label={t("map.liveMap")}>
            <button
              type="button"
              role="tab"
              aria-selected={mobilePanel === "map"}
              className={mobilePanel === "map" ? "active" : ""}
              onClick={() => setMobilePanel("map")}
            >
              {t("nav.map")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobilePanel === "list"}
              className={mobilePanel === "list" ? "active" : ""}
              onClick={() => setMobilePanel("list")}
            >
              {t("map.nearbyTitle")}
            </button>
          </div>
        ) : null}

        <div className="map-content-grid">
          <div
            className={`map-stage-card${
              isMobileViewport && mobilePanel !== "map" ? " is-hidden-mobile" : ""
            }`}
          >
            <div className="map-toolbar">
              <label className="radius-control">
                <span>{t("map.searchRadius", { radiusLabel })}</span>
                <select
                  className="radius-select"
                  value={radius}
                  onChange={(event) => setRadius(event.target.value)}
                >
                  {RADIUS_OPTIONS.map((option) => (
                    <option key={option} value={String(option)}>
                      {option}m
                    </option>
                  ))}
                  <option value={ALL_RADIUS_OPTION}>{t("map.radiusAllOption")}</option>
                </select>
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
                      {"\u00D7"}
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
                  {t("map.autoNarrateOnTouch")}
                </span>
              </label>

              <label className="map-toggle-chip">
                <input
                  type="checkbox"
                  checked={autoPlayAudio}
                  onChange={(event) => dispatch(setAutoPlayAudio(event.target.checked))}
                />
                <span>
                  {t("map.autoNarrateNearby")}
                </span>
              </label>
            </div>

            <div className="map-canvas">
              {showSearchBtn ? (
                <button className="search-area-btn" onClick={handleSearchThisArea} type="button">
                  {t("map.searchThisArea")}
                </button>
              ) : null}
              <div className={`map-heading-control ${deviceHeadingPresentation.toneClass}`}>
                <button
                  type="button"
                  className={`map-heading-button ${isDeviceHeadingActive ? "active" : ""}`}
                  disabled={deviceHeadingPresentation.disabled}
                  onClick={handleToggleDeviceHeading}
                  aria-pressed={isDeviceHeadingListening}
                  title={deviceHeadingPresentation.note}
                  style={
                    isDeviceHeadingActive
                      ? { "--device-heading-deg": `${deviceHeadingDegrees}deg` }
                      : undefined
                  }
                >
                  <span className="map-heading-icon" aria-hidden="true" />
                  <span>{deviceHeadingPresentation.label}</span>
                </button>
                {deviceHeadingPresentation.note ? (
                  <span className="map-heading-note">{deviceHeadingPresentation.note}</span>
                ) : null}
              </div>
              <MapView
                center={mapCenter}
                zoom={mapZoom}
                pois={displayPois}
                selectedPoi={selectedPoi}
                selectedPoiId={selectedPoi?.id}
                showUserHeading={isDeviceHeadingActive}
                selectedPoiDistanceLabel={
                  selectedPoiDistance
                    ? t("map.distanceFromYou", {
                        distance: formatDistance(selectedPoiDistance),
                      })
                    : ""
                }
                userHeading={deviceHeading}
                userLocation={effectiveLocation}
                userLocationLabel={
                  demoLocation ? t("map.demoLocationLabel") : t("map.userLocationLabel")
                }
                routePath={routePath}
                onSelectPoi={(poi) =>
                  handleSelectPoi(poi, {
                    touchTriggered: true,
                    mobilePanel: "map",
                  })
                }
                onMapMoveEnd={handleMapMoveEnd}
                onMapLongPress={handleMapLongPress}
              />
            </div>

            <div className="map-legend">
              <span className="map-location-note">
                {effectiveLocation ? (
                  <>
                    <strong>{t("map.locationNote")}</strong>{" "}
                    {effectiveLocation.lat.toFixed(5)}, {effectiveLocation.lng.toFixed(5)}
                  </>
                ) : (
                  <strong>{t("map.usingDefaultCenter")}</strong>
                )}
              </span>
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

          <aside
            className={`map-side-panel${
              isMobileViewport && mobilePanel !== "list" ? " is-hidden-mobile" : ""
            }`}
          >
            <article className="panel-card">
              <h2>{t("map.nearbyTitle")}</h2>
              <div className="tour-picker-card">
                <div className="tour-picker-head">
                  <div>
                    <strong>{t("map.tourTitle")}</strong>
                    <p className="supporting-text">
                      {selectedTour
                        ? t("map.tourSelectedSummary", {
                            count: rawTourPois.length,
                            duration: selectedTour.estimatedDurationMinutes || rawTourPois.length * 20,
                          })
                        : t("map.tourHint")}
                    </p>
                  </div>
                  {selectedTour ? (
                    <button
                      type="button"
                      className="tour-clear-button"
                      onClick={handleClearSelectedTour}
                    >
                      {t("map.tourClear")}
                    </button>
                  ) : null}
                </div>

                <select
                  className="tour-select"
                  value={selectedTourId}
                  onChange={handleSelectTour}
                  disabled={toursQuery.isLoading}
                >
                  <option value="">{t("map.tourAllOption")}</option>
                  {tours.map((tour) => (
                    <option key={tour.id} value={tour.id}>
                      {getLocalizedValue(tour.title, i18n.language)}
                    </option>
                  ))}
                </select>

                {selectedTour ? (
                  <div className="tour-step-list">
                    {displayPois.map((poi) => (
                      <button
                        key={poi.id}
                        type="button"
                        className={`tour-step-chip ${selectedPoi?.id === poi.id ? "active" : ""}`}
                        onClick={() =>
                          handleSelectPoi(poi, {
                            touchTriggered: true,
                            mobilePanel: "map",
                            zoomToPoi: true,
                          })
                        }
                      >
                        <span>{poi.tourOrder}</span>
                        <strong>{poi.displayName}</strong>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

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

              {!isLoading && !queryError && displayPois.length === 0 ? (
                <p className="supporting-text">
                  {selectedTour ? t("map.tourEmpty") : t("map.emptyNearby")}
                </p>
              ) : null}

              <div className="poi-list">
                {displayPois.map((poi) => {
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
                        <div className="poi-card-info">
                          <strong>{poi.displayName}</strong>
                          <span className="poi-category">{poi.category}</span>
                          {selectedTour ? (
                            <span className="poi-tour-stop">
                              {t("map.tourStopLabel", { order: poi.tourOrder })}
                            </span>
                          ) : null}
                        </div>
                        {(!currentUser || currentUser.role === "user") && (
                          <button
                            type="button"
                            className={`poi-favorite-btn ${poi.isFavorite ? "active" : ""}`}
                            onClick={(e) => handleToggleFavorite(e, poi)}
                            title={poi.isFavorite ? t("favorites.remove") : t("favorites.add")}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                            </svg>
                          </button>
                        )}
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
          </aside>
        </div>

        <article className="panel-card map-detail-wide-card">
          <h2>{t("map.selectedPoi")}</h2>
          {!selectedPoi ? (
            <p className="supporting-text">{t("map.selectHint")}</p>
          ) : (
            <div className="selected-poi selected-poi-wide">
              <div className="selected-poi-main">
                {selectedPoi.imageUrl ? (
                  <img
                    className="selected-poi-image"
                    src={selectedPoi.imageUrl}
                    alt={selectedPoi.displayName}
                  />
                ) : null}
                <div className="selected-poi-summary">
                  <div className="selected-poi-head">
                    <div>
                      <strong>{selectedPoi.displayName}</strong>
                      <span className="poi-category">{selectedPoi.category}</span>
                    </div>
                    <button
                      type="button"
                      className="map-detail-button"
                      onClick={() => setIsPoiDetailOpen(true)}
                    >
                      {t("map.viewDetail")}
                    </button>
                  </div>

                  <p>{selectedPoi.displayDescription || t("map.noDescription")}</p>

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
                  {!isPoiDetailOpen ? (
                    <SpeechGuidePlayer
                      audioUrl={selectedPoi.audioUrl}
                      onPlaybackStart={handleAudioPlaybackStart}
                      playbackKey={selectedPoiPlaybackKey || selectedPoi.id}
                      speechLanguage={speechLanguage}
                      speechText={selectedPoiSpeechText}
                      title={selectedPoi.displayName}
                      triggerAutoSpeak={Boolean(selectedPoiPlaybackKey)}
                      variant="compact"
                    />
                  ) : null}
                </div>

                <PoiQrCard
                  poiId={selectedPoi.id}
                  poiName={selectedPoi.displayName}
                  compact
                  minimal
                />
              </div>
            </div>
          )}
        </article>
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
          onClose={() => {
            setIsPoiDetailOpen(false);
            setSelectedPoiPlaybackKey("");
          }}
          onNarrateRequest={() => handleReplayNarration(selectedPoi)}
          onPlaybackStart={handleAudioPlaybackStart}
          playbackKey={selectedPoiPlaybackKey || selectedPoi.id}
          speechText={selectedPoiSpeechText}
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

function getDeviceHeadingPresentation({
  degrees,
  error,
  hasLocation,
  isActive,
  isDemoMode,
  isListening,
  isSupported,
  permissionState,
  t,
}) {
  if (!isSupported) {
    return {
      disabled: true,
      label: t("map.headingUnsupportedShort"),
      note: t("map.headingUnsupported"),
      toneClass: "is-off",
    };
  }

  if (!hasLocation) {
    return {
      disabled: true,
      label: t("map.headingEnable"),
      note: t("map.headingRequiresLocation"),
      toneClass: "is-off",
    };
  }

  if (isDemoMode) {
    return {
      disabled: true,
      label: t("map.headingEnable"),
      note: t("map.headingDemoHint"),
      toneClass: "is-mid",
    };
  }

  if (isActive && Number.isFinite(degrees)) {
    return {
      disabled: false,
      label: t("map.headingLabel", { degrees }),
      note: t("map.headingFacing", { direction: getHeadingDirectionLabel(degrees, t) }),
      toneClass: "is-good",
    };
  }

  if (permissionState === "denied" || error === "denied") {
    return {
      disabled: false,
      label: t("map.headingEnable"),
      note: t("map.headingPermissionDenied"),
      toneClass: "is-warn",
    };
  }

  if (permissionState === "unsupported" || error === "unsupported") {
    return {
      disabled: true,
      label: t("map.headingUnsupportedShort"),
      note: t("map.headingUnsupported"),
      toneClass: "is-off",
    };
  }

  if (isListening) {
    return {
      disabled: false,
      label: t("map.headingWaiting"),
      note: t("map.headingWaitingHint"),
      toneClass: "is-mid",
    };
  }

  return {
    disabled: false,
    label: t("map.headingEnable"),
    note: t("map.headingHint"),
    toneClass: "is-mid",
  };
}

function getHeadingDirectionLabel(degrees, t) {
  const directions = [
    t("map.headingNorth"),
    t("map.headingNorthEast"),
    t("map.headingEast"),
    t("map.headingSouthEast"),
    t("map.headingSouth"),
    t("map.headingSouthWest"),
    t("map.headingWest"),
    t("map.headingNorthWest"),
  ];
  const normalizedDegrees = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalizedDegrees / 45) % directions.length;
  return directions[index];
}

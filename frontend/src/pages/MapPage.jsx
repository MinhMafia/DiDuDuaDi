import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import SpeechGuidePlayer from "../components/audio/SpeechGuidePlayer";
import PoiDetailSheet from "../components/map/PoiDetailSheet";
import MapView from "../components/map/MapView";
import Loading from "../components/common/Loading";
import useGeolocation from "../hooks/useGeolocation";
import { trackAudioPlay, trackPoiView } from "../services/analyticsService";
import { getNearbyPois, getPois } from "../services/poiService";
import { getDrivingRoute } from "../services/routeService";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { VINH_KHANH_CENTER } from "../utils/constants";
import { getFoodTours } from "../services/adminService";
import {
  calculateDistanceMeters,
  formatDistance,
  getLocalizedValue,
} from "../utils/helpers";
import {
  Layout,
  Card,
  Row,
  Col,
  Slider,
  Button,
  Typography,
  Tag,
  List,
  Space,
  Empty,
  Spin,
} from "antd";
import {
  AimOutlined,
  EnvironmentOutlined,
  CompassOutlined,
} from "@ant-design/icons";
import "./MapPage.css";
import SystemBenchMark from "./SystemBenchmark";

const DEFAULT_RADIUS = 500;
const DEFAULT_MAP_ZOOM = 16;
const SEARCH_FOCUS_ZOOM = 18;

export default function MapPage() {
  const { i18n, t } = useTranslation();
  const autoPlayAudio = useSelector((state) => state.app.autoPlayAudio);
  const searchContainerRef = useRef(null);
  const autoFocusedPoiRef = useRef("");
  const trackedAudioRef = useRef("");
  const trackedPoiViewRef = useRef("");
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [demoLocation, setDemoLocation] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [selectedPoiPlaybackKey, setSelectedPoiPlaybackKey] = useState("");
  const [poiSearchTerm, setPoiSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(VINH_KHANH_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [viewCenter, setViewCenter] = useState(null);
  const { error: geoError, isLoading: geoLoading, location } = useGeolocation();
  const effectiveLocation = demoLocation ?? location;
const [selectedTour, setSelectedTour] = useState(null);
const foodToursQuery = useQuery({
  queryKey: ["foodTours"],
  queryFn: getFoodTours,
  select: (res) => res.data ?? res ?? [],
});
  const allPoisQuery = useQuery({
    queryKey: ["pois"],
    queryFn: getPois,
    select: (response) => response.data ?? [],
  });

  const nearbyPoisQuery = useQuery({
    queryKey: [
      "pois",
      "nearby",
      effectiveLocation?.lat,
      effectiveLocation?.lng,
      radius,
    ],
    queryFn: () =>
      getNearbyPois(effectiveLocation.lat, effectiveLocation.lng, radius),
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

  const normalizedSearchTerm = normalizeForSearch(poiSearchTerm.trim());
  const poiSearchResults = useMemo(() => {
    if (!normalizedSearchTerm) return [];

    return visiblePois
      .filter((poi) => {
        const name = normalizeForSearch(poi.displayName);
        const category = normalizeForSearch(poi.category);
        return (
          name.includes(normalizedSearchTerm) ||
          category.includes(normalizedSearchTerm)
        );
      })
      .slice(0, 8);
  }, [normalizedSearchTerm, visiblePois]);

  useEffect(() => {
    if (!selectedPoi || visiblePois.some((poi) => poi.id === selectedPoi.id)) {
      return;
    }

    setSelectedPoi(null);
    setIsPoiDetailOpen(false);
  }, [selectedPoi, visiblePois]);

  useEffect(() => {
    if (!selectedPoi) return;
    setSelectedPoiPlaybackKey(
      `${selectedPoi.id}-${i18n.language}-${Date.now()}`,
    );
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

  const isLoading =
    allPoisQuery.isLoading || (effectiveLocation && nearbyPoisQuery.isLoading);
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
  const shouldAutoNarrate =
    autoPlayAudio && Boolean(selectedPoiDistance) && selectedPoiDistance <= 35;

  useEffect(() => {
    if (
      !autoPlayAudio ||
      !nearestPoi ||
      !nearestPoiDistance ||
      nearestPoiDistance > 35
    ) {
      return;
    }

    if (autoFocusedPoiRef.current === nearestPoi.id) {
      return;
    }

    autoFocusedPoiRef.current = nearestPoi.id;
    handleSelectPoi(nearestPoi);
  }, [autoPlayAudio, nearestPoi, nearestPoiDistance]);

  function handleSelectPoi(poi, options = {}) {
    if (!poi) {
      setSelectedPoi(null);
      setSelectedPoiPlaybackKey("");
      setIsPoiDetailOpen(false);
      return;
    }

    setSelectedPoi(poi);
    setSelectedPoiPlaybackKey(`${poi.id}-${Date.now()}`);
    if (poi?.location) {
      setMapCenter(poi.location);
      if (options.zoomToPoi) {
        setMapZoom(SEARCH_FOCUS_ZOOM);
      }
    }
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
    handleSelectPoi(poi, { zoomToPoi: true });
    setPoiSearchTerm(poi.displayName || "");
    setIsSearchOpen(false);
  }

  function handleClearSearch() {
    setPoiSearchTerm("");
    setIsSearchOpen(false);
  }

  const distanceToViewCenter =
    viewCenter && effectiveLocation
      ? calculateDistanceMeters(effectiveLocation, viewCenter)
      : 0;
  const showSearchBtn = distanceToViewCenter > 50;

  const speechLanguage =
    SUPPORTED_LANGUAGES.find((language) => language.code === i18n.language)
      ?.speechLocale || "vi-VN";

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

<<<<<<< HEAD
 const { Title, Text } = Typography;
const { Content } = Layout;
=======
  const detailRouteSummary =
    effectiveLocation && selectedPoi
      ? routeQuery.isLoading
        ? t("map.routeLoading")
        : routeQuery.isError
          ? t("map.routeError")
          : routeQuery.data
            ? t("map.routeSummary", {
                distance: formatDistance(routeQuery.data.distanceMeters),
                minutes: Math.max(
                  1,
                  Math.round(routeQuery.data.durationSeconds / 60),
                ),
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
>>>>>>> 950ceeaa31932b15611344a77015dd18135325a2

return (
  <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
    <Content style={{ padding: 16 }}>
      
      {/* HEADER */}
      <Card
        style={{ marginBottom: 16, borderRadius: 16 }}
        bodyStyle={{ padding: 20 }}
      >
        <Space direction="vertical">
          <Title level={3} style={{ margin: 0 }}>
            {t("map.title")}
          </Title>

          <Text type="secondary">{t("map.subtitle")}</Text>

          <Space>
            <Tag color={effectiveLocation ? "green" : "orange"}>
              {demoLocation
                ? t("map.demoMode")
                : location
                  ? t("map.gpsOn")
                  : t("map.gpsWaiting")}
            </Tag>

            <Tag icon={<CompassOutlined />}>
              {visiblePois.length} POIs
            </Tag>
          </Space>
        </Space>
      </Card>

<<<<<<< HEAD
      <Row gutter={16}>
        
        {/* MAP */}
        <Col xs={24} lg={16}>
          <Card
            style={{ borderRadius: 16 }}
            bodyStyle={{ padding: 12 }}
            title={
              <Space>
                <EnvironmentOutlined />
                <span>Map</span>
              </Space>
            }
            extra={
              <Space>
                <Button onClick={handleJumpToVinhKhanh}>
=======
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
                      <p className="map-search-empty">
                        {t("map.searchNoResult")}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="map-toolbar-text">
                {effectiveLocation ? (
                  <span>
                    {effectiveLocation.lat.toFixed(5)},{" "}
                    {effectiveLocation.lng.toFixed(5)}
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
>>>>>>> 950ceeaa31932b15611344a77015dd18135325a2
                  {t("map.jumpToVinhKhanh")}
                </Button>

                <Button
                  type="primary"
                  icon={<AimOutlined />}
                  disabled={!location}
                  onClick={handleCenterOnUser}
                >
                  {t("map.centerOnMe")}
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              
              {/* SLIDER */}
              <div>
                <Text strong>
                  {t("map.searchRadius", { radius })}
                </Text>

                <Slider
                  min={100}
                  max={1200}
                  step={50}
                  value={radius}
                  onChange={setRadius}
                />
              </div>

<<<<<<< HEAD
              {/* MAP */}
              <div
                style={{
                  height: "70vh",
                  borderRadius: 12,
                  overflow: "hidden",
                  position:"relative"
                }}
              >
                <SystemBenchMark />
                {showSearchBtn && (
                  <Button
                    type="primary"
                    style={{
                      position: "absolute",
                      zIndex: 1000,
                      left: "50%",
                      transform: "translateX(-50%)",
                      top: 10,
                    }}
                    onClick={handleSearchThisArea}
                  >
                    Tìm quanh khu vực này
                  </Button>
                )}
=======
            <div className="map-canvas">
              {showSearchBtn && (
                <button
                  className="search-area-btn"
                  onClick={handleSearchThisArea}
                  type="button"
                >
                  Tìm quanh khu vực này
                </button>
              )}
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
                  demoLocation
                    ? t("map.demoLocationLabel")
                    : t("map.userLocationLabel")
                }
                routePath={routePath}
                onSelectPoi={handleSelectPoi}
                onMapMoveEnd={handleMapMoveEnd}
                onMapLongPress={handleMapLongPress}
              />
            </div>
>>>>>>> 950ceeaa31932b15611344a77015dd18135325a2

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
                  onSelectPoi={handleSelectPoi}
                  onMapMoveEnd={handleMapMoveEnd}
                  onMapLongPress={handleMapLongPress}
                />
              </div>
            </Space>
          </Card>
        </Col>

<<<<<<< HEAD
        {/* SIDEBAR */}
        <Col lg={8}>
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            
            {/* POI LIST */}
            <Card
              title={t("map.nearbyTitle")}
              style={{ borderRadius: 16 }}
            >
              {geoLoading && <Spin />}
=======
          <aside className="map-side-panel">
            <article className="panel-card">
              <h2>{t("map.nearbyTitle")}</h2>
              {geoLoading ? (
                <p className="supporting-text">{t("map.requestingLocation")}</p>
              ) : null}
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
>>>>>>> 950ceeaa31932b15611344a77015dd18135325a2

              {geoError && <Text type="danger">{geoError}</Text>}

             

              <List
                dataSource={visiblePois}
                renderItem={(poi) => {
                  const distance = effectiveLocation
                    ? calculateDistanceMeters(
                        effectiveLocation,
                        poi.location
                      )
                    : null;

                  return (
                    <List.Item
                      onClick={() => handleSelectPoi(poi)}
                      style={{
                        cursor: "pointer",
                        borderRadius: 10,
                        padding: 10,
                        background:
                          selectedPoi?.id === poi.id
                            ? "#e6f4ff"
                            : "transparent",
                      }}
                    >
<<<<<<< HEAD
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>{poi.displayName}</Text>
                            <Tag>{poi.category}</Tag>
                          </Space>
                        }
                        description={poi.displayDescription}
                      />
=======
                      <div className="poi-card-head">
                        <strong>{poi.displayName}</strong>
                        <span className="poi-category">{poi.category}</span>
                      </div>
                      <p>{poi.displayDescription || t("map.noDescription")}</p>
                      <div className="poi-meta">
                        <span>
                          {poi.location.lat.toFixed(4)},{" "}
                          {poi.location.lng.toFixed(4)}
                        </span>
                        {distance ? (
                          <span>{formatDistance(distance)}</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>
>>>>>>> 950ceeaa31932b15611344a77015dd18135325a2

                      {distance && (
                        <Tag icon={<EnvironmentOutlined />}>
                          {formatDistance(distance)}
                        </Tag>
                      )}
                    </List.Item>
                  );
                }}
              />
            </Card>

            {/* SELECTED POI */}
            <Card
              title={t("map.selectedPoi")}
              style={{ borderRadius: 16 }}
            >
              {!selectedPoi ? (
                <Empty description={t("map.selectHint")} />
              ) : (
<<<<<<< HEAD
                <Space direction="vertical" style={{ width: "100%" }}>
                  
                  <Title level={5}>
                    {selectedPoi.displayName}
                  </Title>

                  <Tag color="blue">{selectedPoi.category}</Tag>

                  <Text>
                    {selectedPoi.displayDescription ||
                      t("map.noDescription")}
                  </Text>

                  {selectedPoiDistance && (
                    <Tag icon={<EnvironmentOutlined />} color="green">
                      {formatDistance(selectedPoiDistance)}
                    </Tag>
                  )}

                  {/* MENU */}
                  {selectedPoi.menuItems?.length > 0 && (
                    <List
                      size="small"
                      header={<b>{t("map.menuTitle")}</b>}
                      dataSource={selectedPoi.menuItems}
                      renderItem={(item) => (
                        <List.Item>
                          <Space>
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt=""
                                style={{
                                  width: 50,
                                  height: 50,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                }}
                              />
                            )}
                            <div>
                              <Text strong>{item.name}</Text>
                              <br />
                              <Text type="secondary">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(item.price || 0)}
                              </Text>
                            </div>
                          </Space>
                        </List.Item>
                      )}
                    />
                  )}

                  {/* AUDIO */}
=======
                <div className="selected-poi">
                  <strong>{selectedPoi.displayName}</strong>
                  <span className="poi-category">{selectedPoi.category}</span>
                  <p>
                    {selectedPoi.displayDescription || t("map.noDescription")}
                  </p>
                  {selectedPoi.approvedIntroduction ? (
                    <p className="selected-poi-intro">
                      {selectedPoi.approvedIntroduction}
                    </p>
                  ) : null}
                  {selectedPoi.shopAddress ? (
                    <p className="selected-poi-address">
                      {selectedPoi.shopAddress}
                    </p>
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
                          distance: formatDistance(
                            routeQuery.data.distanceMeters,
                          ),
                          minutes: Math.max(
                            1,
                            Math.round(routeQuery.data.durationSeconds / 60),
                          ),
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
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} />
                            ) : null}
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
>>>>>>> 950ceeaa31932b15611344a77015dd18135325a2
                  <SpeechGuidePlayer
                    audioUrl={selectedPoi.audioUrl}
                    onPlaybackStart={handleAudioPlaybackStart}
                    playbackKey={selectedPoiPlaybackKey || selectedPoi.id}
                    speechLanguage={speechLanguage}
                    speechText={selectedPoi.displayDescription}
<<<<<<< HEAD
                    triggerAutoSpeak={
                      Boolean(selectedPoiPlaybackKey) || shouldAutoNarrate
=======
                    title={`${selectedPoi.displayName}${
                      autoPlayAudio &&
                      (selectedPoiPlaybackKey || shouldAutoNarrate)
                        ? ` (${t("audio.autoPlayReady")})`
                        : ""
                    }`}
                    triggerAutoSpeak={
                      autoPlayAudio &&
                      (Boolean(selectedPoiPlaybackKey) || shouldAutoNarrate)
>>>>>>> 950ceeaa31932b15611344a77015dd18135325a2
                    }
                  />
                </Space>
              )}
<<<<<<< HEAD
            </Card>
            
          </Space>
        </Col>
      </Row>
    </Content>
  </Layout>
);
=======
            </article>
          </aside>
        </div>
      </div>
      {isPoiDetailOpen && selectedPoi ? (
        <PoiDetailSheet
          poi={selectedPoi}
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
          onPlaybackStart={handleAudioPlaybackStart}
          playbackKey={selectedPoiPlaybackKey || selectedPoi.id}
          speechText={selectedPoi.displayDescription}
          titleSuffix={
            selectedPoiPlaybackKey || shouldAutoNarrate
              ? t("audio.autoPlayReady")
              : ""
          }
          triggerAutoSpeak={
            Boolean(selectedPoiPlaybackKey) || shouldAutoNarrate
          }
        />
      ) : null}
    </section>
  );
>>>>>>> 950ceeaa31932b15611344a77015dd18135325a2
}

function normalizeForSearch(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

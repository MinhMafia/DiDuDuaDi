import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import SpeechGuidePlayer from "../components/audio/SpeechGuidePlayer";
import MapView from "../components/map/MapView";
import Loading from "../components/common/Loading";
import useGeolocation from "../hooks/useGeolocation";
import { trackAudioPlay, trackPoiView } from "../services/analyticsService";
import { getNearbyPois, getPois } from "../services/poiService";
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

export default function MapPage() {
  const { i18n, t } = useTranslation();
  const autoPlayAudio = useSelector((state) => state.app.autoPlayAudio);
  const autoFocusedPoiRef = useRef("");
  const trackedAudioRef = useRef("");
  const trackedPoiViewRef = useRef("");
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [demoLocation, setDemoLocation] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [selectedPoiPlaybackKey, setSelectedPoiPlaybackKey] = useState("");
  const [mapCenter, setMapCenter] = useState(VINH_KHANH_CENTER);
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

  function handleMapMoveEnd(center) {
    setViewCenter(center);
  }

  function handleMapLongPress(latlng) {
    setDemoLocation({ lat: latlng.lat, lng: latlng.lng });
    setMapCenter({ lat: latlng.lat, lng: latlng.lng });
  }

  function handleSearchThisArea() {
    if (viewCenter) {
      setDemoLocation({ lat: viewCenter.lat, lng: viewCenter.lng });
    }
  }

  const distanceToViewCenter = viewCenter && effectiveLocation 
    ? calculateDistanceMeters(effectiveLocation, viewCenter) 
    : 0;
  const showSearchBtn = distanceToViewCenter > 50;

  const speechLanguage =
    SUPPORTED_LANGUAGES.find((language) => language.code === i18n.language)?.speechLocale ||
    "vi-VN";

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

 const { Title, Text } = Typography;
const { Content } = Layout;

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

        {/* SIDEBAR */}
        <Col lg={8}>
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            
            {/* POI LIST */}
            <Card
              title={t("map.nearbyTitle")}
              style={{ borderRadius: 16 }}
            >
              {geoLoading && <Spin />}

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
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>{poi.displayName}</Text>
                            <Tag>{poi.category}</Tag>
                          </Space>
                        }
                        description={poi.displayDescription}
                      />

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
                  <SpeechGuidePlayer
                    audioUrl={selectedPoi.audioUrl}
                    onPlaybackStart={handleAudioPlaybackStart}
                    playbackKey={selectedPoiPlaybackKey || selectedPoi.id}
                    speechLanguage={speechLanguage}
                    speechText={selectedPoi.displayDescription}
                    triggerAutoSpeak={
                      Boolean(selectedPoiPlaybackKey) || shouldAutoNarrate
                    }
                  />
                </Space>
              )}
            </Card>
            
          </Space>
        </Col>
      </Row>
    </Content>
  </Layout>
);
}

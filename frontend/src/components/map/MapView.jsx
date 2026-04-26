import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Polygon,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { VINH_KHANH_CENTER } from "../../utils/constants";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const HEADING_CONE_LENGTH_METERS = 55;
const HEADING_CONE_SHOULDER_METERS = 28;
const HEADING_CONE_HALF_ANGLE = 22;

export default function MapView({
  center = VINH_KHANH_CENTER,
  zoom = 16,
  pois = [],
  selectedPoiId,
  showUserHeading = false,
  userHeading,
  userLocation,
  userLocationLabel,
  routePath = [],
  onSelectPoi,
  onMapClick,
  onMapMoveEnd,
  onMapLongPress,
}) {
  const [suppressedTooltipPoiId, setSuppressedTooltipPoiId] = useState(null);
  const headingShape =
    showUserHeading && userLocation && Number.isFinite(userHeading)
      ? getHeadingShape(userLocation, userHeading)
      : null;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      maxZoom={22}
      zoomControl={false}
      style={mapContainerStyle}
      scrollWheelZoom
    >
      <ChangeView center={center} zoom={zoom} />
      <MapEventHandler
        onMapClick={onMapClick}
        onMapMoveEnd={onMapMoveEnd}
        onMapLongPress={onMapLongPress}
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={22}
      />
      <ZoomControl position="bottomright" />

      {headingShape ? (
        <>
          <Polygon
            interactive={false}
            positions={headingShape.cone}
            pathOptions={{
              color: "#0f766e",
              fillColor: "#14b8a6",
              fillOpacity: 0.22,
              opacity: 0.9,
              weight: 2,
            }}
          />
          <Polyline
            interactive={false}
            positions={[userLocation, headingShape.tip]}
            pathOptions={{
              color: "#0f766e",
              dashArray: "6 6",
              opacity: 0.95,
              weight: 3,
            }}
          />
        </>
      ) : null}

      {userLocation ? (
        <CircleMarker
          center={userLocation}
          pathOptions={{
            color: "#134e4a",
            fillColor: "#0f766e",
            fillOpacity: 1,
            weight: 2,
          }}
          radius={10}
        >
          <Popup>{userLocationLabel}</Popup>
        </CircleMarker>
      ) : null}

      {routePath.length > 1 ? (
        <Polyline
          positions={routePath}
          pathOptions={{
            color: "#0ea5e9",
            weight: 6,
            opacity: 0.85,
          }}
        />
      ) : null}

      {pois.map((poi) => {
        const isSelected = poi.id === selectedPoiId;
        const shouldShowTooltip = suppressedTooltipPoiId !== poi.id;

        return (
          <CircleMarker
            key={poi.id}
            center={poi.location}
            eventHandlers={{
              mousedown: () => setSuppressedTooltipPoiId(poi.id),
              mouseout: () => {
                if (suppressedTooltipPoiId === poi.id) {
                  setSuppressedTooltipPoiId(null);
                }
              },
              click: () => onSelectPoi?.(poi),
            }}
            pathOptions={{
              color: isSelected ? "#c2410c" : "#1d4ed8",
              fillColor: isSelected ? "#ff6b35" : "#2563eb",
              fillOpacity: 0.95,
              weight: 2,
            }}
            radius={isSelected ? 12 : 9}
          >
            {shouldShowTooltip ? (
              <Tooltip direction="top" offset={[0, -8]} className="poi-hover-tooltip">
                <div className="poi-hover-tooltip-content">
                  <strong title={poi.displayName}>{poi.displayName}</strong>
                  <span className="poi-category">{poi.category}</span>
                </div>
              </Tooltip>
            ) : null}
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

function ChangeView({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, map, zoom]);

  return null;
}

function getHeadingShape(location, heading) {
  const tip = destinationPoint(location, heading, HEADING_CONE_LENGTH_METERS);
  const left = destinationPoint(
    location,
    heading - HEADING_CONE_HALF_ANGLE,
    HEADING_CONE_SHOULDER_METERS,
  );
  const right = destinationPoint(
    location,
    heading + HEADING_CONE_HALF_ANGLE,
    HEADING_CONE_SHOULDER_METERS,
  );

  return {
    cone: [location, left, tip, right],
    tip,
  };
}

function destinationPoint(location, bearingDegrees, distanceMeters) {
  const earthRadiusMeters = 6371000;
  const bearing = toRadians(bearingDegrees);
  const lat1 = toRadians(location.lat);
  const lng1 = toRadians(location.lng);
  const angularDistance = distanceMeters / earthRadiusMeters;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lat: toDegrees(lat2),
    lng: toDegrees(lng2),
  };
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function toDegrees(value) {
  return (value * 180) / Math.PI;
}

function MapEventHandler({ onMapClick, onMapMoveEnd, onMapLongPress }) {
  useMapEvents({
    click(event) {
      onMapClick?.(event.latlng);
    },
    moveend(event) {
      onMapMoveEnd?.(event.target.getCenter());
    },
    contextmenu(event) {
      onMapLongPress?.(event.latlng);
    },
  });

  return null;
}

import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
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

export default function MapView({
  center = VINH_KHANH_CENTER,
  pois = [],
  selectedPoiId,
  userLocation,
  userLocationLabel,
  routePath = [],
  onSelectPoi,
  onMapClick,
  onMapMoveEnd,
  onMapLongPress,
}) {
  const [suppressedTooltipPoiId, setSuppressedTooltipPoiId] = useState(null);

  return (
    <MapContainer
      center={center}
      zoom={16}
      zoomControl={false}
      style={mapContainerStyle}
      scrollWheelZoom
    >
      <ChangeView center={center} />
      <MapEventHandler
        onMapClick={onMapClick}
        onMapMoveEnd={onMapMoveEnd}
        onMapLongPress={onMapLongPress}
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />

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

function ChangeView({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
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

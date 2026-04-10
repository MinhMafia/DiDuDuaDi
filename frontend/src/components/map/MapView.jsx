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
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import { VINH_KHANH_CENTER } from "../../utils/constants";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

export default function MapView({
  center = VINH_KHANH_CENTER,
  zoom = 16,
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

      <MarkerClusterGroup
        chunkedLoading
        disableClusteringAtZoom={19}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
      >
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
      </MarkerClusterGroup>
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

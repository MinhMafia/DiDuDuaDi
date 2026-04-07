import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
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
  selectedPoi,
  selectedPoiId,
  selectedPoiDistanceLabel,
  userLocationLabel,
  onSelectPoi,
  onMapClick,
  onMapMoveEnd,
  onMapLongPress,
}) {
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

      {pois.map((poi) => {
        const isSelected = poi.id === selectedPoiId;

        return (
          <CircleMarker
            key={poi.id}
            center={poi.location}
            eventHandlers={{
              click: () => onSelectPoi?.(poi),
            }}
            pathOptions={{
              color: isSelected ? "#c2410c" : "#1d4ed8",
              fillColor: isSelected ? "#ff6b35" : "#2563eb",
              fillOpacity: 0.95,
              weight: 2,
            }}
            radius={isSelected ? 12 : 9}
          />
        );
      })}

      {selectedPoi ? (
        <Popup
          position={selectedPoi.location}
          eventHandlers={{
            remove: () => onSelectPoi?.(null),
          }}
        >
          <div className="map-info-window">
            <strong>{selectedPoi.displayName}</strong>
            <span className="poi-category">{selectedPoi.category}</span>
            <p>
              {selectedPoi.displayDescription || "Chua co mo ta cho dia diem nay."}
            </p>
            {selectedPoiDistanceLabel ? <span>{selectedPoiDistanceLabel}</span> : null}
            {!selectedPoiDistanceLabel && userLocation ? (
              <span>{userLocationLabel}</span>
            ) : null}
          </div>
        </Popup>
      ) : null}
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
    }
  });

  return null;
}

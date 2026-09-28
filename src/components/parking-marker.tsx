import L from "leaflet";

export const parkingMarkerIcon = L.divIcon({
  className: "",
  html: '<span class="parking-location-marker"><span class="parking-location-marker-pin"><span>P</span></span></span>',
  iconSize: [32, 38],
  iconAnchor: [16, 37],
  popupAnchor: [0, -35],
});

export function ParkingMarkerPin() {
  return (
    <span className="parking-location-marker">
      <span className="parking-location-marker-pin"><span>P</span></span>
    </span>
  );
}

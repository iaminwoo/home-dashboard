"use client";

import type { ParkingPosition } from "@/lib/dashboard-parking";
import { homeLocation } from "@/lib/home-location";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import styles from "./parking-map.module.css";
import { homeIcon } from "./leaflet-home-icon";
import { parkingMarkerIcon } from "./parking-marker";

function KeepNearbyLocationsInView({ parking }: { parking: ParkingPosition }) {
  const map = useMap();
  useEffect(() => {
    if (!homeLocation) return;
    const nearby =
      Math.abs(parking.latitude - homeLocation.latitude) < 0.04 &&
      Math.abs(parking.longitude - homeLocation.longitude) < 0.04;
    if (nearby)
      map.fitBounds(
        [
          [parking.latitude, parking.longitude],
          [homeLocation.latitude, homeLocation.longitude],
        ],
        { padding: [24, 24], maxZoom: 19 },
      );
  }, [map, parking.latitude, parking.longitude]);
  return null;
}

export function ParkingDisplayMap({ position }: { position: ParkingPosition }) {
  return (
    <div className={`${styles.mapShell} ${styles.displayMapShell}`}>
      <MapContainer
        center={[position.latitude, position.longitude]}
        zoom={19}
        className={styles.map}
        dragging={false}
        touchZoom={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {homeLocation && <Polyline positions={[[position.latitude, position.longitude], [homeLocation.latitude, homeLocation.longitude]]} pathOptions={{ color: "#71817a", weight: 1.5, opacity: 0.55, dashArray: "5 7", lineCap: "round" }} interactive={false} />}
        <Marker
          position={[position.latitude, position.longitude]}
          icon={parkingMarkerIcon}
        />
        {homeLocation && (
          <Marker
            position={[homeLocation.latitude, homeLocation.longitude]}
            icon={homeIcon}
            interactive={false}
          />
        )}
        <KeepNearbyLocationsInView parking={position} />
      </MapContainer>
    </div>
  );
}

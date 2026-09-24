"use client";

import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import type { ParkingPosition } from "@/lib/dashboard-parking";
import { homeLocation } from "@/lib/home-location";
import styles from "./parking-map.module.css";
import { homeIcon } from "./leaflet-home-icon";

export type ParkingPickerMapProps = { center: ParkingPosition; recenterSignal: number; onCenterChange: (position: ParkingPosition) => void };

function CenterTracker({ center, recenterSignal, onCenterChange }: ParkingPickerMapProps) {
  const map = useMap();
  useMapEvents({ moveend: () => { const next = map.getCenter(); onCenterChange({ latitude: next.lat, longitude: next.lng }); } });
  useEffect(() => {
    if (recenterSignal > 0) map.flyTo([center.latitude, center.longitude], Math.max(map.getZoom(), 16), { duration: 0.45 });
  }, [center.latitude, center.longitude, map, recenterSignal]);
  return null;
}

export function ParkingPickerMap(props: ParkingPickerMapProps) {
  return <div className={styles.mapShell}><MapContainer center={[props.center.latitude, props.center.longitude]} zoom={16} className={styles.map} scrollWheelZoom><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />{homeLocation && <Marker position={[homeLocation.latitude, homeLocation.longitude]} icon={homeIcon} interactive={false} />}<CenterTracker {...props} /></MapContainer><div className={styles.centerPin} aria-hidden="true"><span>⌖</span></div></div>;
}

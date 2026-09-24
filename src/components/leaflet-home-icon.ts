"use client";

import L from "leaflet";

/** A quiet, image-free home reference marker shared by the admin and display maps. */
export const homeIcon = L.divIcon({
  className: "",
  html: '<span style="display:grid;width:20px;height:20px;place-items:center;border:2px solid white;border-radius:6px;background:#789288;box-shadow:0 1px 4px #18332655"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-6h6v6"/></svg></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

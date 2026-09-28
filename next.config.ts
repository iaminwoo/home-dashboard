import type { NextConfig } from "next";

const lanIp = process.env.DEV_LAN_IP;

const nextConfig: NextConfig = {
  // `scripts/dev.mjs`가 현재 LAN IP를 찾아 개발 서버에 전달합니다.
  allowedDevOrigins: lanIp ? [lanIp] : [],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 컴퓨터의 Wi-Fi LAN 주소에서 태블릿·휴대폰이 HMR 자산을 요청할 수 있게 합니다.
  allowedDevOrigins: ["192.168.45.214"],
};

export default nextConfig;

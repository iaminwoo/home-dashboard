import type { Metadata } from "next";
import { AuthGate } from "@/components/auth-gate";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = { title: "Home Dashboard", description: "우리 집을 위한 개인 대시보드" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body><ThemeProvider><AuthGate>{children}</AuthGate></ThemeProvider></body>
    </html>
  );
}

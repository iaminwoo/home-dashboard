import { ThinQApiError } from "@/lib/thinq/client";
import { ThinQConfigError } from "@/lib/thinq/config";
import { getWashTowerStatus } from "@/lib/thinq/status";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getWashTowerStatus(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ThinQConfigError) {
      console.error("ThinQ status request failed", { stage: "config", message: error.message });
      return Response.json({ error: "워시타워 연결 설정을 확인해 주세요." }, { status: 503 });
    }

    if (error instanceof ThinQApiError) {
      console.error("ThinQ status request failed", {
        stage: error.stage,
        endpoint: error.endpoint,
        status: error.status,
        message: error.message,
      });
    } else {
      console.error("ThinQ status request failed", { stage: "status", message: "워시타워 상태를 조회하지 못했습니다." });
    }

    return Response.json({ error: "워시타워 상태를 불러오지 못했습니다." }, { status: 502 });
  }
}

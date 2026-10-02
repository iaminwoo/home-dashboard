import "server-only";

import { randomUUID } from "node:crypto";
import { getThinQConfig } from "./config";

type ThinQRequestStage = "devices" | "device-state";

export class ThinQApiError extends Error {
  constructor(
    message: string,
    readonly stage: ThinQRequestStage,
    readonly endpoint: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "ThinQApiError";
  }
}

function messageId() {
  return Buffer.from(randomUUID().replace(/-/g, ""), "hex").toString("base64url");
}

export async function thinqGet<T>(endpoint: string, stage: ThinQRequestStage): Promise<T> {
  const config = getThinQConfig();
  const url = new URL(endpoint, config.baseUrl);
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "x-message-id": messageId(),
        "x-country": config.country,
        "x-client-id": config.clientId,
        "x-api-key": config.apiKey,
      },
      cache: "no-store",
    });
  } catch {
    throw new ThinQApiError("ThinQ API에 연결하지 못했습니다.", stage, endpoint, null);
  }

  if (!response.ok) {
    throw new ThinQApiError("ThinQ API 요청이 실패했습니다.", stage, endpoint, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ThinQApiError("ThinQ API 응답을 해석하지 못했습니다.", stage, endpoint, response.status);
  }
}

export function isStaleDeviceError(error: unknown) {
  return error instanceof ThinQApiError
    && error.stage === "device-state"
    && (error.status === 400 || error.status === 404);
}

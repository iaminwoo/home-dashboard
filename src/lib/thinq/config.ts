import "server-only";

export class ThinQConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ThinQConfigError";
  }
}

export type ThinQConfig = {
  accessToken: string;
  clientId: string;
  apiKey: string;
  country: string;
  baseUrl: string;
};

function required(name: "THINQ_ACCESS_TOKEN" | "THINQ_CLIENT_ID" | "THINQ_API_KEY") {
  const value = process.env[name]?.trim();
  if (!value) throw new ThinQConfigError(`${name} 환경변수가 설정되지 않았습니다.`);
  return value;
}

export function getThinQConfig(): ThinQConfig {
  const baseUrl = process.env.THINQ_BASE_URL?.trim() || "https://api-kic.lgthinq.com";

  try {
    new URL(baseUrl);
  } catch {
    throw new ThinQConfigError("THINQ_BASE_URL이 올바른 URL이 아닙니다.");
  }

  return {
    accessToken: required("THINQ_ACCESS_TOKEN"),
    clientId: required("THINQ_CLIENT_ID"),
    apiKey: required("THINQ_API_KEY"),
    country: process.env.THINQ_COUNTRY?.trim() || "KR",
    baseUrl,
  };
}

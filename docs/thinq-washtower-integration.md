# LG ThinQ 워시타워 연동 가이드

이 문서는 `thinq-test`의 현재 소스 코드를 기준으로 작성했다. 다른 Next.js 프로젝트에 연동을 옮길 때 API 호출 흐름, 기기 식별, 상태 응답의 비대칭 구조, 그리고 신뢰하면 안 되는 시간 값을 빠뜨리지 않기 위한 기술 문서다.

> 보안: PAT와 `x-api-key`의 실제 값은 이 문서, 클라이언트 코드, 브라우저 응답에 넣지 않는다. 서버 환경변수에서만 읽는다.

## 1. 현재 구현 개요

브라우저는 LG API에 직접 접근하지 않는다. 클라이언트 페이지가 Next.js Route Handler인 `GET /api/thinq/status`만 호출하며, 해당 Route Handler가 Node.js 런타임에서 ThinQ API 요청을 수행한다.

```text
Browser (app/page.tsx)
  → GET /api/thinq/status
  → app/api/thinq/status/route.ts
  → lib/thinq/devices.ts
  → lib/thinq/client.ts
  → LG ThinQ API
      → GET /devices
      → GET /devices/{deviceId}/state (목록의 모든 기기)
      → GET /devices/{deviceId}/profile (식별된 워시타워 기기)
  → 워시타워별 summary + raw response
  → Browser
```

인증은 Personal Access Token(PAT) 기반이다. `lib/thinq/config.ts`가 서버의 `process.env`에서 값을 읽고, `lib/thinq/client.ts`가 `Authorization: Bearer <PAT>` 헤더를 만든다. `NEXT_PUBLIC_` 환경변수는 사용하지 않으므로 PAT는 번들에 포함되지 않는다.

## 2. 관련 파일 구조

```text
app/page.tsx
app/api/thinq/status/route.ts
lib/thinq/config.ts
lib/thinq/client.ts
lib/thinq/devices.ts
.env.local.example
openapi.json
```

| 파일 | 역할 |
| --- | --- |
| `app/page.tsx` | 브라우저 polling, 수동 새로고침, 응답 화면 표시, localStorage snapshot 생성 |
| `app/api/thinq/status/route.ts` | 서버 API Route. 기기 목록/상태/프로파일을 조회하고 워시타워를 조립한다. |
| `lib/thinq/config.ts` | 환경변수 검증 및 Base URL/country 기본값 설정 |
| `lib/thinq/client.ts` | 공통 GET, 인증/요청 헤더, message ID, 오류 객체 처리 |
| `lib/thinq/devices.ts` | `/devices`, `/devices/{deviceId}/state`, `/devices/{deviceId}/profile` 얇은 래퍼 |
| `.env.local.example` | 필요한 서버 환경변수 템플릿 |
| `openapi.json` | 현재 프로젝트가 참조한 ThinQ OpenAPI 명세 |

## 3. 환경변수

현재 코드가 사용하는 ThinQ 환경변수는 아래 다섯 개다.

| 변수 | 용도 | 필수 여부 | 예시 형식 | 클라이언트 노출 금지 |
| --- | --- | --- | --- | --- |
| `THINQ_ACCESS_TOKEN` | PAT. `Authorization` 헤더에 사용 | 필수 | PAT 문자열 | 예 |
| `THINQ_CLIENT_ID` | 호출 클라이언트의 고유 ID | 필수 | `thinq-washtower-test-<unique-id>` | 예 (현재 구현은 server-only) |
| `THINQ_API_KEY` | ThinQ API 호출 키 | 필수 | 명세에서 요구하는 API key 문자열 | 예 |
| `THINQ_COUNTRY` | ISO 3166-1 alpha-2 국가 코드 | 선택, 기본값 `KR` | `KR` | 아니오 |
| `THINQ_BASE_URL` | ThinQ API Base URL | 선택, 기본값 `https://api-kic.lgthinq.com` | HTTPS URL | 아니오 |

`THINQ_ACCESS_TOKEN`, `THINQ_CLIENT_ID`, `THINQ_API_KEY`는 `required()`로 공백 여부까지 검사한다. Base URL은 유효한 URL인지 검사한다. 배포 환경에서는 위 값을 배포 플랫폼의 서버 환경변수로 등록해야 한다.

## 4. ThinQ 요청 헤더

`thinqGet()`은 모든 ThinQ GET에 아래 헤더를 넣는다.

| 헤더 | 현재 값의 출처 |
| --- | --- |
| `Authorization` | `Bearer ${THINQ_ACCESS_TOKEN}` |
| `x-message-id` | 요청마다 새로 생성 |
| `x-country` | `THINQ_COUNTRY` 또는 `KR` |
| `x-client-id` | `THINQ_CLIENT_ID` |
| `x-api-key` | `THINQ_API_KEY` |

`x-message-id`는 `crypto.randomUUID()`의 UUID v4에서 하이픈을 제거한 뒤, hex bytes를 Node `Buffer`의 `base64url`로 인코딩한다. 따라서 URL-safe, 무패딩, 22자 형식이다.

```ts
function messageId() {
  return Buffer.from(crypto.randomUUID().replace(/-/g, ""), "hex")
    .toString("base64url");
}

response = await fetch(endpoint, {
  headers: {
    Authorization: `Bearer ${config.accessToken}`,
    "x-message-id": messageId(),
    "x-country": config.country,
    "x-client-id": config.clientId,
    "x-api-key": config.apiKey,
  },
  cache: "no-store",
});
```

비정상 HTTP 응답 또는 네트워크 실패는 `ThinqApiError`로 바꾸며, stage, endpoint, status, body만 보관한다. 요청 헤더는 오류 객체에 보관하지 않는다.

## 5. API 호출 순서와 캐시

현재 `GET /api/thinq/status` 한 번은 다음을 수행한다.

1. `GET https://api-kic.lgthinq.com/devices`를 호출한다.
2. 응답의 유효한 `deviceId`를 가진 **모든 기기**에 대해 `GET /devices/{deviceId}/state`를 `Promise.all`로 병렬 호출한다.
3. `groupId`와 state 구조를 기준으로 워시타워 후보를 찾는다.
4. 식별된 워시타워 기기에 대해서만 `GET /devices/{deviceId}/profile`을 병렬 호출한다.
5. washer/dryer의 상태 summary와 raw response를 포함한 JSON을 브라우저에 반환한다.

현재는 `/devices`와 state를 매 polling마다 다시 요청한다. device ID 캐시는 구현되어 있지 않다. profile도 현재는 식별된 워시타워마다 매 Route 요청마다 호출된다.

`devices.ts`의 실제 endpoint 래퍼는 다음과 같다.

```ts
export function getDevices() {
  return thinqGet<ThinQEnvelope<ThinQDevice[]>>("/devices", "/devices");
}

export function getDeviceState(deviceId: string) {
  return thinqGet<ThinQEnvelope<unknown>>(
    `/devices/${encodeURIComponent(deviceId)}/state`,
    "/devices/{deviceId}/state",
  );
}
```

## 6. 워시타워 기기 식별 방법

분리형 워시타워는 `/devices`의 `deviceInfo.groupId`로 먼저 묶는다. 현재 코드에서 `groupId`가 있는 모든 기기는 해당 group에 넣는다. 이 그룹 안에서는 검증된 실제 `deviceType` 값을 우선 사용한다.

```text
DEVICE_WASHTOWER_WASHER
DEVICE_WASHTOWER_DRYER
```

해당 type을 찾지 못했을 때만 state 구조 fallback을 사용한다.

- `state.response`가 배열이면 washer fallback
- `state.response`가 배열이 아니면 dryer fallback

`alias`와 `modelName`은 `ThinQDevice` 타입에 포함되지만, 현재 선택 로직에는 사용하지 않는다. 화면 표시에만 쓰였던 값이며 식별 기준은 `groupId`, `deviceType`, state shape이다.

일체형 워시타워도 지원한다. group과 별개로 state의 `response`가 object이며 `washer`와 `dryer` key를 모두 가지면 일체형으로 취급한다.

```ts
const washerResult = results.find(({ device }) =>
  device.deviceInfo?.deviceType === "DEVICE_WASHTOWER_WASHER",
) || results.find(({ state }) => Array.isArray(state.response)) || null;

const dryerResult = results.find(({ device }) =>
  device.deviceInfo?.deviceType === "DEVICE_WASHTOWER_DRYER",
) || results.find(({ state }) => !Array.isArray(state.response)) || null;
```

## 7. `/state` 응답 구조 차이

이 차이는 반드시 보존해야 한다. 실제 워시타워 테스트에서 washer의 envelope `response`는 배열이고, dryer의 `response`는 객체였다.

```json
// washer
{ "response": [{ "runState": {}, "timer": {}, "cycle": {}, "location": {} }] }

// dryer
{ "response": { "runState": {}, "timer": {} } }
```

서버 Route의 `applianceState()`는 배열이면 첫 번째 항목을 root로, 그 외에는 객체 자체를 root로 사용한다. 값 또는 중간 객체가 없으면 `null`을 반환하므로 상태가 비어 있어도 handler가 깨지지 않는다.

```ts
const root = Array.isArray(value) ? record(value[0]) : record(value);
const runState = record(root?.runState);
const timer = record(root?.timer);

return {
  currentState: scalar(runState?.currentState),
  remainingTime: duration("remainHour", "remainMinute"),
  totalTime: duration("totalHour", "totalMinute"),
};
```

원본 필드 매핑은 다음과 같다.

| summary 값 | ThinQ 원본 필드 |
| --- | --- |
| `currentState` | `runState.currentState` |
| `remainingTime.hour` | `timer.remainHour` |
| `remainingTime.minute` | `timer.remainMinute` |
| `totalTime.hour` | `timer.totalHour` |
| `totalTime.minute` | `timer.totalMinute` |

## 8. 정규화된 내부 데이터 구조

**중요한 현재 구현 차이:** Route Handler가 최종적으로 `state`, `remainingMinutes`, `totalMinutes`, `course`라는 평탄한 값을 반환하는 것은 아니다. Route는 `summary.currentState`, `summary.remainingTime`, `summary.totalTime`을 반환한다. 브라우저 `app/page.tsx`가 그 summary와 raw state를 사용해 snapshot을 만든다.

Route 응답의 개략적인 실제 shape은 다음과 같다.

```ts
{
  connected: true,
  fetchedAt: string,
  devices: ThinQEnvelope<ThinQDevice[]>,
  washTowers: Array<{
    id: string,
    groupId: string | null,
    washer: {
      device: ThinQDevice,
      state: unknown,
      rawState: ThinQEnvelope<unknown>,
      profile: ThinQEnvelope<unknown> | null,
      summary: {
        currentState: string | number | boolean | null,
        remainingTime: { hour, minute } | null,
        totalTime: { hour, minute } | null,
      },
    } | null,
    dryer: /* washer와 같은 shape */,
  }>,
}
```

브라우저 localStorage snapshot은 다음 실제 shape이다.

```ts
type Snapshot = {
  timestamp: string
  washer: {
    state: string | null
    course: string | null
    remainingMinutes: number | null
    totalMinutes: number | null
  }
  dryer: {
    state: string | null
    course: string | null
    remainingMinutes: number | null
    totalMinutes: number | null
  }
}
```

`remainingMinutes`와 `totalMinutes`는 페이지에서 `number` 타입인 hour와 minute가 모두 존재할 때만 계산한다.

```ts
hour * 60 + minute
```

`course`는 서버가 정규화하지 않는다. 페이지의 `courseFromState()`가 raw state 전체를 재귀 탐색하여 key에 대소문자 무관하게 `course`가 포함되고 value가 string인 실제 값을 찾는다. `name` 또는 `current`가 포함된 key를 우선한다. 따라서 다른 프로젝트에서는 실제 fixture를 통해 코스 필드 이름을 확정하거나 이 동작을 별도 명시적 mapper로 바꾸는 것이 안전하다.

## 9. 실제로 확인된 상태값

아래 목록은 코드의 enum 전체가 아니라 2026-10-01 실제 워시타워 테스트에서 관찰된 값이다.

| 기기 | 관찰된 상태 |
| --- | --- |
| Washer | `INITIAL`, `RUNNING`, `RINSING`, `SPINNING`, `END`, `POWER_OFF` |
| Dryer | `DETECTING`, `RUNNING`, `END`, `POWER_OFF` |

페이지는 일부 상태만 사람이 읽기 쉬운 한국어로 매핑한다. 알 수 없는 상태는 추측 번역하지 않고 원본 코드 그대로 표시한다.

## 10. timer 값의 실제 특성

### `remainingMinutes`

- 단순 카운트다운이 아니다.
- 실제 동작 중 기기 판단에 따라 재계산된다.
- 세탁에서는 몇 분씩 한 번에 줄어들기도 했다.
- 건조에서는 남은 시간이 다시 증가했다.
- 2026-10-01 테스트에서 건조 시간이 `11분 → 21분`으로 여러 번 연장됐다.

따라서 대시보드에서 남은 시간은 `total - elapsed`로 계산하면 안 된다. 항상 최신 `/state`의 `remainingMinutes`를 사용해야 한다.

### `totalMinutes`

- 실제 총 소요시간을 보장하지 않는다.
- 세탁은 `totalMinutes = 60`이었지만 약 52분 만에 종료됐다.
- 건조는 `totalMinutes = 65`였지만 실제 `RUNNING` 시간은 약 88분이었다.
- 건조가 연장되어도 `totalMinutes`는 65로 유지됐다.

즉 total은 UI의 확정 ETA가 아니라 로그와 참고값으로 다루는 것이 안전하다.

## 11. 2026-10-01 실제 테스트 결과

### Washer

```text
20:46 INITIAL
20:47 RUNNING
21:02 RINSING
21:24 SPINNING
21:38 END
21:40 POWER_OFF
```

시작 감지부터 END까지 약 52분이었다.

### Dryer

```text
21:42 DETECTING
21:43 RUNNING
23:11 END
23:14 POWER_OFF
```

RUNNING부터 END까지 약 88분이었다.

### 전환 시간

```text
washer END 21:38
dryer DETECTING 21:42
```

약 4분이었다.

## 12. Browser polling 동작

`app/page.tsx`는 mount 시 `setTimeout(..., 0)`으로 첫 요청을 즉시 예약하고, `window.setInterval(..., 60_000)`으로 이후 요청을 예약한다. 즉 첫 화면에서 60초를 기다리지 않는다.

수동 새로고침 버튼도 동일한 `refresh()`를 호출한다. `useRef(false)`인 `requestInFlight`가 이미 진행 중인 요청을 차단하므로 interval과 수동 요청이 겹치지 않는다. `finally`에서 flag를 해제하므로 한 요청이 실패해도 다음 60초 interval은 계속 동작한다.

```ts
if (requestInFlight.current) return;
requestInFlight.current = true;
try {
  const response = await fetch("/api/thinq/status", { cache: "no-store" });
  // 성공/오류 처리
} finally {
  requestInFlight.current = false;
}
```

실제 테스트에서는 `/api/thinq/status`가 대략 1초 전후 걸렸고, Next.js 자체보다 ThinQ 외부 API 응답 대기가 대부분이었다.

## 13. localStorage 기록 구조

키는 `thinq-washtower-history`다. 성공한 Route 응답에서 첫 번째 워시타워를 대상으로 snapshot을 만든다. PAT, API key, device ID, profile은 snapshot에 저장하지 않는다.

저장 규칙은 현재 코드상 다음과 같다.

- 첫 저장에서 washer/dryer 중 하나가 active 상태이거나 `END`면 저장한다.
- active는 `null`, `POWER_OFF`, `END`를 제외한 상태다.
- 어느 한 기기라도 active면 매 polling snapshot을 저장한다. 따라서 `remainingMinutes`와 `totalMinutes`도 매번 저장된다.
- 한 기기가 처음 `END`로 전환되면 저장한다.
- 기존 상태가 `END` 또는 다른 non-null/non-`POWER_OFF` 상태이고 새 상태가 `POWER_OFF`면 저장한다.
- 두 기기가 반복해서 `POWER_OFF`이면 저장하지 않는다.
- 마지막 snapshot의 timestamp가 새 snapshot timestamp와 같으면 중복 저장하지 않는다.

기록은 새 snapshot을 저장할 때 현재 시점 기준 최근 24시간만 남기고, 그 뒤 최대 1,500개로 자른다. `기록 초기화` 버튼은 `localStorage.removeItem("thinq-washtower-history")`만 호출한다.

## 14. 현재 테스트 UI의 알려진 버그

`app/page.tsx`의 session summary는 다른 대시보드에 그대로 복사하면 안 된다. Raw snapshot 데이터는 이력 분석에 사용할 수 있지만, summary UI에는 다음 확인된 문제가 있다.

- 세탁 종료시간이 첫 `END`가 아니라 최신 snapshot 시각으로 계속 밀릴 수 있다.
- 세탁 `INITIAL`의 `total = 0`을 최초 total로 잡을 수 있다.
- `POWER_OFF` 이후 `total = 0`을 현재 total로 표시할 수 있다.
- 실제 dryer 동작 전에 dryer session이 만들어질 수 있다.

대시보드에서는 raw snapshot의 첫 active, 첫 `END`, 첫 post-END `POWER_OFF` 전환을 별도로 찾아 계산해야 한다.

## 15. 재사용할 것과 버릴 것

### 재사용

- `lib/thinq/config.ts`, `client.ts`, `devices.ts`
- server-only PAT 및 공통 헤더 생성
- `/devices` 처리, `groupId` + device type 식별
- `/state` 호출과 washer array/dryer object parsing
- `runState`/`timer` summary 추출
- 필요할 경우 실제 테스트 상태 fixture

### 그대로 가져가지 말 것

- `app/page.tsx`의 테스트 대시보드 UI
- 현재 session summary 계산
- raw JSON을 기본 화면에 노출하는 디버그 UI
- 상태 코드의 UI 번역/표시 로직

## 16. 대시보드용 권장 인터페이스

다른 프로젝트에는 ThinQ 세부사항을 숨기고 아래처럼 단일 진입점을 제공하는 구성이 좋다.

```ts
type WashTowerStatus = {
  washer: {
    state: string | null
    remainingMinutes: number | null
    totalMinutes: number | null
    course: string | null
  }
  dryer: {
    state: string | null
    remainingMinutes: number | null
    totalMinutes: number | null
    course: string | null
  }
  fetchedAt: string
}

async function getWashTowerStatus(): Promise<WashTowerStatus> {
  // ThinQ device discovery, state shape handling, time conversion을 내부에 숨긴다.
}
```

현재 프로젝트에는 이 평탄한 함수가 아직 없다. `route.ts`의 `applianceState()` 및 `app/page.tsx`의 minutes/course 처리 로직을 한 곳으로 모아 새 프로젝트의 서버 측 service에서 구현하는 것이 권장된다.

## 17. 핵심 handler 구조

현재 handler는 `/devices` 이후 모든 기기 state를 병렬 조회한 다음, group별 appliance를 만들고 summary를 덧붙인다.

```ts
const devicesResponse = await getDevices();
const stateResults = await Promise.all(devices.map(async (device) => ({
  device,
  state: await getDeviceState(device.deviceId),
})));

// groupId, DEVICE_WASHTOWER_WASHER/DRYER, state shape으로 group 조립
const washTowers = /* ... */.map((tower) => ({
  ...tower,
  washer: tower.washer && {
    ...tower.washer,
    summary: applianceState(tower.washer.state),
  },
  dryer: tower.dryer && {
    ...tower.dryer,
    summary: applianceState(tower.dryer.state),
  },
}));

return Response.json({
  connected: true,
  fetchedAt: new Date().toISOString(),
  devices: devicesResponse,
  washTowers,
});
```

## 18. Migration Checklist

- [ ] `lib/thinq/config.ts`, `client.ts`, `devices.ts`를 서버 코드로 가져온다.
- [ ] 새 프로젝트의 server-only 환경변수에 `THINQ_ACCESS_TOKEN`, `THINQ_CLIENT_ID`, `THINQ_API_KEY`를 추가한다.
- [ ] `THINQ_COUNTRY`와 `THINQ_BASE_URL` 기본값 또는 배포 환경변수를 확인한다.
- [ ] PAT/API key가 `NEXT_PUBLIC_` 변수나 브라우저 응답에 포함되지 않는지 확인한다.
- [ ] `/api/thinq/status` 또는 동등한 server endpoint를 만든다.
- [ ] `GET /devices`를 먼저 호출하고 `groupId`로 워시타워를 묶는다.
- [ ] `DEVICE_WASHTOWER_WASHER` 및 `DEVICE_WASHTOWER_DRYER`를 우선 처리한다.
- [ ] washer `response` 배열과 dryer `response` 객체를 모두 처리한다.
- [ ] `runState.currentState` 및 다섯 timer 필드를 null-safe하게 추출한다.
- [ ] 분 단위 값은 hour와 minute가 모두 number일 때만 계산한다.
- [ ] `remainingMinutes`를 elapsed time으로 재계산하지 않고 최신 API 값을 사용한다.
- [ ] total을 확정 종료시간으로 사용하지 않는다.
- [ ] 테스트 UI의 session summary를 복사하지 않고 snapshot 기반 분석기를 새로 만든다.
- [ ] 실제 워시타워에서 `POWER_OFF → active → END → POWER_OFF` 한 사이클을 검증한다.
- [ ] 배포 환경에서 `/api/thinq/status`의 외부 네트워크 접근과 환경변수를 확인한다.

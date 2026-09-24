# Home Dashboard

집 안의 태블릿에 표시하고 휴대폰에서 관리하는 개인 대시보드입니다.

## 로컬 실행 및 같은 Wi-Fi 기기 접속

```bash
npm run dev
```

개발 서버는 모든 네트워크 인터페이스(`0.0.0.0`)에서 수신합니다. 터미널에 표시되는 `Network` 주소 또는 개발 컴퓨터의 LAN IP를 사용해 같은 Wi-Fi의 태블릿·휴대폰에서 접속하세요.

예를 들어 개발 컴퓨터 IP가 `192.168.0.25`이면 다음 주소를 엽니다.

```text
http://192.168.0.25:3000/display
```

macOS에서는 Wi-Fi IP를 다음 명령으로 확인할 수 있습니다.

```bash
ipconfig getifaddr en0
```

접속이 되지 않으면 두 기기가 같은 Wi-Fi에 연결되었는지, macOS 방화벽이 Node.js의 들어오는 연결을 허용하는지 확인하세요. 포트 3000을 다른 프로그램이 사용 중이면 Next.js가 다른 포트를 표시하므로, 주소의 포트 번호를 함께 바꿔야 합니다.

## 환경변수

`.env.example`를 참고해 `.env.local`에 기존 Supabase 프로젝트 정보와 기상청 인증키를 추가합니다. 기상청 키는 **기상청 API 허브**의 초단기실황 API에서 발급한 `authKey`를 사용합니다.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_HOME_LATITUDE=
NEXT_PUBLIC_HOME_LONGITUDE=
KMA_API_KEY=
```

## 확인 명령

```bash
npm run lint
npm run build
```

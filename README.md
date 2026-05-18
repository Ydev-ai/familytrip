# 가족 여행 · 어반스트림 1박2일

모바일 청첩장 톤의 가족 여행 초대장. 일정·장소·가족·장보기·회비·체크리스트를 한 페이지에서 보고, admin 시크릿 URL로 모든 콘텐츠를 실시간 수정.

Next.js 16 · Tailwind v4 · Vercel KV · framer-motion · OpenStreetMap.

## 로컬 개발

```bash
bun install
bun run dev    # http://localhost:3000
```

dev 모드에서는 KV 환경변수가 없으면 in-memory fallback 으로 동작합니다. 서버 재시작하면 시드 데이터로 돌아갑니다.

admin 진입 (dev 기본 secret):
```
http://localhost:3000/admin/dev-secret-change-me-please-32chars
```

## Vercel 배포

### 옵션 A — GitHub 리포 + Vercel 연동 (권장)

1. GitHub에 새 리포 생성 (예: `family-trip-urban-stream`) 후 코드 push
2. [Vercel 대시보드](https://vercel.com/new) → "Import Git Repository" → 해당 리포 선택 → **Deploy**
3. 첫 deploy 후 **Storage** 탭 → **Create Database** → **KV (Upstash)** → 프로젝트에 연결
   - `KV_REST_API_URL` / `KV_REST_API_TOKEN` 자동 주입됨
4. **Settings → Environment Variables** 에서 `ADMIN_SECRET` 추가 (32자 이상)
5. Deployments → 가장 최근 deploy → **Redeploy** (env 반영)

이후 `git push` 만으로 자동 재배포.

### 옵션 B — Vercel CLI 로컬 직접 배포 (GitHub 없이)

```bash
bun add -g vercel
vercel login
cd /path/to/가족여행
vercel              # 첫 deploy (preview)
vercel --prod       # production
```

KV 연결 + `ADMIN_SECRET` 설정은 옵션 A 와 동일.

### 랜덤 admin secret 생성

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

이 secret 으로 admin URL 이 결정됩니다:
```
https://<deploy>.vercel.app/admin/<ADMIN_SECRET>
```

가족 전체에게 공유하는 건 메인 URL 만, admin URL 은 본인만 보관.

> ⚠️ `ADMIN_SECRET` 을 운영(`NODE_ENV=production`) 에 설정하지 않으면 admin 페이지는 **모두 404** 가 됩니다 (dev fallback 비활성). 배포 직전에 반드시 env 를 추가하고 redeploy 하세요.

## 페이지 구성

| anchor       | 한자 | 섹션         | 비고                                                       |
| ------------ | ---- | ------------ | ---------------------------------------------------------- |
| `#place`     | 所   | 모이는 곳    | OSM iframe 지도 + 카카오/네이버 외부 링크 + 주소 복사     |
| `#schedule`  | 日   | 1박 2일      | 첫째날/둘째날 2-column 타임라인                            |
| `#families`  | 家   | 함께 하는 사람들 | 가족별 카드 (색상 토큰) + 이름·헤드카운트                 |
| `#groceries` | 市   | 함께 사올 것 | 장보기 항목 + 담당 가족 + 예상/실 비용 + 구매 토글        |
| `#budget`    | 金   | 모이고 쓰는 돈 | 가족별 회비 납부 진행률 + 지출 + 잔액 자동 계산           |
| `#checklist` | 備   | 함께 챙길 것 | 누구나 토글 가능, 마지막 토글자 이름 표시                  |

햄버거 메뉴(우측 상단)로 섹션 anchor jump, sticky header + smooth scroll.

## 데이터 모델

단일 KV key `trip:current` 에 `Trip` JSON blob. 스키마는 [`src/lib/types.ts`](src/lib/types.ts).

| 엔드포인트                  | 메서드 | 인증        | 용도                       |
| --------------------------- | ------ | ----------- | -------------------------- |
| `/api/trip`                 | GET    | -           | 전체 데이터 fetch          |
| `/api/trip`                 | PUT    | `x-admin-key` | 전체 데이터 덮어쓰기 (admin) |
| `/api/trip/checklist`       | POST   | -           | 체크리스트 토글 (누구나)   |
| `/api/trip/grocery`         | POST   | -           | 장보기 구매 토글 (누구나)  |

`Budget.payments` / `Budget.expenses` 등 회비 영역은 admin PUT 으로만 수정. 잔액·납부 진행률은 client 가 derive.

## 디자인 시스템 — 한지·먹 × Apple precision

`src/app/globals.css` 에 토큰:
- **한지** (베이지 베이스): `hanji-50 ~ 400`
- **먹** (잉크): `ink-50 ~ 900`
- **단청** (청록 accent): `dancheong-500 ~ 700`
- **단풍** (주홍 accent / seal): `maple-500 ~ 700`
- **청자** (cool neutral): `celadon-500/600`
- **자목** (deep plum): `plum-500/600`
- **금박** (highlight): `gold-500/600`

폰트: Noto Serif KR (본문) + Gowun Batang (보조) + Nanum Pen Script (`.brush` 손글씨).

모션: Apple cubic-bezier `(0.32, 0.72, 0, 1)` — 부드러운 감속.

## 디렉토리

```
src/
├─ app/
│  ├─ page.tsx                    공개 페이지 (sections + NavHeader)
│  ├─ admin/[secret]/
│  │  ├─ page.tsx                 admin 게이트
│  │  └─ editor.tsx               편집 UI (모든 섹션)
│  └─ api/
│     ├─ trip/route.ts            GET 공개 / PUT admin
│     ├─ trip/checklist/route.ts  체크리스트 토글
│     └─ trip/grocery/route.ts    장보기 토글
├─ components/
│  ├─ nav-header.tsx              sticky + 햄버거 + anchor active
│  ├─ countdown.tsx               flip-up ticker
│  ├─ schedule-timeline.tsx
│  ├─ place-card.tsx              OSM iframe + 카카오/네이버/주소복사
│  ├─ family-cards.tsx
│  ├─ grocery-board.tsx
│  ├─ budget-board.tsx
│  ├─ checklist-board.tsx
│  └─ ink-art.tsx                 SVG 먹 일러스트
└─ lib/
   ├─ types.ts                    Trip schema + DEFAULT_TRIP (6가족 시드)
   ├─ store.ts                    KV read/write + normalize + memory fallback
   ├─ admin.ts                    constant-time key compare
   ├─ map.ts                      OSM iframe URL builder
   └─ swr-client.ts               useTrip hook (8s polling)
```

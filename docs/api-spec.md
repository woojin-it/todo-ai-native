# API 명세 (FastAPI)

| 항목 | 내용 |
| --- | --- |
| 문서 버전 | v2.4 (2026-11-24) |
| 기준 문서 | [prd.md](./prd.md) |
| 연관 문서 | [db-schema.md](./db-schema.md), [acceptance-criteria.md](./acceptance-criteria.md), [tasks.md](./tasks.md) |
| Base URL | `${VITE_API_BASE_URL}/api` (로컬: `http://localhost:8000/api`) |
| 데이터 형식 | 요청·응답 모두 `application/json; charset=utf-8`, 필드명 snake_case, 시각은 UTC ISO 8601(`Z`) |

## 1. 인증 (FR-007, NFR-004)

모든 `/api/todos*` 요청에는 `Authorization: Bearer <token>` 헤더가 있어야 한다. 검증 방식은 `AUTH_MODE` 환경 변수로 정한다.

| `AUTH_MODE` | 단계 | `user_id` 결정 방식 | 사용 가능 환경 |
| --- | --- | --- | --- |
| `dev` | 1~2단계 | 토큰 값을 서명 검증 없이 그대로 사용. 1~128자, 앞뒤 공백 제거 | 로컬, 비공개 환경만 (PRD D-4) |
| `supabase` | 3단계 | Supabase Auth JWT를 검증한 뒤 `sub` 클레임(UUID) 사용 | 모든 환경 |

- 헤더가 없거나, `Bearer` 형식이 아니거나, 토큰이 비어 있거나, JWT 검증에 실패하면 `401 UNAUTHENTICATED`.
- 인증 검사는 요청 본문 검증보다 **먼저** 실행한다. 인증 없는 잘못된 본문 요청은 422가 아니라 401이다.
- `AUTH_MODE`에 위 두 값 외의 값이 들어오면 앱 생성 시 `RuntimeError`로 시작을 막는다.
- FastAPI는 로그인·회원가입 엔드포인트를 제공하지 않는다. 3단계에서는 프론트가 Supabase Auth로 로그인하고 access token을 보낸다.

### 1-1. 저장소 접근 (PRD D-5)

- 백엔드는 `SUPABASE_URL`의 PostgREST(`/rest/v1/todos`)에 `apikey: <SUPABASE_SECRET_KEY>` 헤더로 접근한다.
- Secret Key는 RLS를 우회하므로 **모든 쿼리에 `user_id` 조건을 서버 코드에서 명시**한다. RLS는 2차 방어선이다.
- `SUPABASE_URL`과 `SUPABASE_SECRET_KEY`가 둘 다 없으면 In-Memory 저장소를 쓴다. 하나만 있으면 앱 생성 시 `RuntimeError`가 난다. Vercel(`VERCEL=1`)에서 둘 다 없어도 `RuntimeError`다.

## 2. 공통 규약

### 2-1. 에러 응답 (NFR-006)

모든 에러는 아래 형식으로 응답한다. `message`는 사용자에게 보여 줄 수 있는 한국어 문장이다.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "할 일 내용을 입력해 주세요.",
    "details": [{ "field": "text", "message": "공백만 입력할 수 없습니다." }]
  }
}
```

| 코드 | 상태 | 상황 | `details` |
| --- | --- | --- | --- |
| `UNAUTHENTICATED` | 401 | 토큰 없음, 형식 오류, dev 토큰 128자 초과, JWT 만료·서명 불일치 | `null` |
| `FORBIDDEN` | 403 | 다른 사용자 소유의 할 일 (PRD D-6) | `null` |
| `NOT_FOUND` | 404 | 존재하지 않는 할 일, 이미 삭제된 할 일 | `null` |
| `VALIDATION_ERROR` | 422 | 본문·경로 파라미터 검증 실패. FastAPI 기본 422 응답도 이 형식으로 변환 | `[{field, message}]` |
| `INTERNAL_ERROR` | 500 | DB 오류 등 예상하지 못한 오류. 내부 정보(SQL, 스택, 키)는 응답에 넣지 않음 | `null` |
| `BAD_REQUEST` | 400 | 본문이 UTF-8이 아니어서 해석할 수 없음 (프레임워크 수준) | `null` |
| `NOT_FOUND` | 404 | 정의되지 않은 경로 (프레임워크 수준) | `null` |
| `METHOD_NOT_ALLOWED` | 405 | 경로는 있지만 허용되지 않는 메서드 (프레임워크 수준) | `null` |

### 2-2. `TodoResponse`

```json
{
  "id": "b3b6b1b0-7e0a-4d9a-8b0a-1a2b3c4d5e6f",
  "text": "분기 보고서 초안 작성",
  "completed": false,
  "due_date": "2026-11-25",
  "category": "work",
  "priority": "high",
  "created_at": "2026-11-20T05:00:00Z",
  "updated_at": "2026-11-20T05:00:00Z"
}
```

- `user_id`는 응답에 포함하지 않는다.
- `due_date`는 마감일(`YYYY-MM-DD`) 또는 `null`(마감일 없음)이다. 시각과 시간대는 없다 (PRD D-8, FR-012).
- `category`는 `work`(업무), `personal`(개인), `study`(학습) 중 하나이며 항상 값이 있다 (PRD D-9, FR-013).
- `priority`는 `high`(높음), `medium`(보통), `low`(낮음) 중 하나이며 항상 값이 있다 (PRD D-11, FR-015).
- v2.1에서 `due_date`, v2.2에서 `category`, v2.4에서 `priority`를 추가했다. 기존 필드는 바뀌지 않았으므로 이전 클라이언트도 그대로 동작한다.
- 프론트 `src/api/todos.ts`가 `id`, `text`, `completed`, `due_date`(→ `dueDate`), `category`, `priority`를 `Todo` 타입으로 변환한다. `priority`가 없는 이전 서버 응답은 `medium`으로 본다.

### 2-3. 텍스트 검증 규칙 (FR-001, FR-004, FR-010)

| 규칙 | 내용 |
| --- | --- |
| 타입 | JSON 문자열만 허용(`StrictStr`). 숫자·`null`·배열은 422 |
| 공백 제거 | Python `str.strip()`으로 앞뒤 공백(탭·줄바꿈 포함)을 제거한 값을 저장한다 |
| 길이 | 공백 제거 후 1~100자(v2.3에서 500 → 100). 글자 수는 유니코드 코드 포인트 기준(Python `len`) |
| 오류 메시지 | 빈 값: "할 일 내용을 입력해 주세요." / 초과: "할 일은 100자 이하로 입력해 주세요.". 프론트 `src/todoText.ts`도 같은 문구·기준으로 요청 전에 미리 검사한다 |

### 2-4. 마감일 검증 규칙 (FR-012)

| 규칙 | 내용 |
| --- | --- |
| 형식 | JSON 문자열 `YYYY-MM-DD`(숫자 10자리와 하이픈)만 허용. 숫자 타임스탬프, `20261125`, 시각이 붙은 값은 422 |
| 실제 날짜 | `2026-02-30`처럼 존재하지 않는 날짜는 422 |
| 범위 | `2000-01-01` ~ `2100-12-31`. 지난 날짜도 허용(이미 늦은 일을 기록할 수 있게) |
| `null` | 생성 시 생략과 같음(마감일 없음). PATCH에서는 **마감일을 지운다** |
| 오류 메시지 | 형식: "마감일은 YYYY-MM-DD 형식이어야 합니다." / 없는 날짜: "존재하지 않는 날짜입니다." / 범위: "마감일은 2000-01-01부터 2100-12-31 사이여야 합니다." |

### 2-5. 카테고리 검증 규칙 (FR-013, FR-014)

| 규칙 | 내용 |
| --- | --- |
| 허용값 | `work`, `personal`, `study` (소문자 정확히 일치). 대소문자 변형, 빈 문자열, 숫자, 배열은 422 |
| 생성 | 생략하면 `personal`. `null`은 422 (카테고리는 필수 값, D-9) |
| 수정 | 생략하면 유지. `null`은 422 (`text`, `completed`와 같은 규칙) |
| 목록 필터 | `GET /api/todos?category=<값>`. 같은 허용값만 받고, 잘못된 값(빈 값 포함)은 422, `details[0].field`는 `category` |
| 오류 메시지 | "카테고리는 work, personal, study 중 하나여야 합니다." |

### 2-6. 우선순위 검증 규칙 (FR-015, FR-016)

| 규칙 | 내용 |
| --- | --- |
| 허용값 | `high`, `medium`, `low` (소문자 정확히 일치). `"High"`, `""`, `"urgent"`, `" medium"`(공백 포함), 숫자, 배열은 422 |
| 생성 | 생략하면 `medium`. `null`은 422 (우선순위는 필수 값, D-11) |
| 수정 | 생략하면 유지. `null`은 422 (`text`, `completed`, `category`와 같은 규칙) |
| 오류 위치 | 허용값이 아니면 `details[0].field`는 `priority`. PATCH의 `null`은 모델 수준에서 거부하므로 `field`가 빈 문자열이다(카테고리와 같음) |
| 오류 메시지 | "우선순위는 high, medium, low 중 하나여야 합니다." / PATCH `null`: "priority에는 null을 보낼 수 없습니다." |
| 정렬·필터 | 서버는 우선순위로 정렬하거나 거르지 않는다. `?priority=`, `?sort=` 파라미터는 없다 (D-12) |

추가로, 요청 본문에 정의되지 않은 필드가 있으면 422로 거부한다(`extra="forbid"`). 클라이언트 실수를 일찍 드러내기 위해서다.

## 3. 엔드포인트

### 3-1. `GET /api/health` — 상태 확인 (NFR-005)

- 인증: 필요 없음
- 응답 200: `{ "status": "ok" }`
- 배포 확인용이다. 저장소 연결은 검사하지 않는다.

### 3-2. `GET /api/todos` — 목록 조회 (FR-002, FR-008, NFR-007)

- 인증: 필수
- 쿼리 파라미터: `category`(선택, 2-5절). 생략하면 전체, 지정하면 그 카테고리만 반환한다 (FR-014). 소유자 조건은 항상 함께 적용한다
- 정렬: `created_at ASC, id ASC`. 같은 시각에 만든 항목의 순서를 고정하려고 `id`를 보조 키로 쓴다. 우선순위와 관계없이 생성순이다.
- 화면 정렬: 프론트는 이 목록을 받아 브라우저에서 우선순위순(높음 → 보통 → 낮음, 같은 우선순위 안은 생성순)으로 보여 준다 (FR-016, D-12). 서버 응답 순서에 의존하는 다른 클라이언트를 위해 서버 순서는 바꾸지 않는다
- 응답 200: `{ "items": [TodoResponse, ...] }`. 할 일이 없으면 `items: []`
- 에러: 401, 422(잘못된 `category`), 500

### 3-3. `POST /api/todos` — 생성 (FR-001, FR-010, FR-012, FR-013, FR-015)

- 인증: 필수
- 요청 본문: `{ "text": string, "due_date"?: string | null, "category"?: string, "priority"?: string }` (2-3절~2-6절 규칙). `due_date`를 생략하면 마감일 없음, `category`를 생략하면 `personal`, `priority`를 생략하면 `medium`. v2.4 프론트는 `priority`를 항상 보낸다
- 응답 201: 생성된 `TodoResponse`. `completed`는 항상 `false`, `created_at`과 `updated_at`은 같은 값
- 에러: 401, 422, 500

### 3-4. `PATCH /api/todos/{todo_id}` — 부분 수정 (FR-003, FR-004, FR-008, FR-010, FR-012, FR-013, FR-015)

- 인증: 필수
- 경로: `todo_id`는 UUID. 형식이 틀리면 422
- 요청 본문: `text`(string), `completed`(boolean), `due_date`(string | null), `category`(string), `priority`(string) 중 **최소 하나**. 하나도 없으면 422
- `text`, `completed`, `category`, `priority`에 `null`을 보내면 422다. `due_date`만 `null`을 허용하며, 마감일을 지운다는 뜻이다 (2-4절)
- `due_date`, `category`, `priority`를 생략하면 기존 값을 그대로 둔다. 우선순위를 바꿔도 `GET` 응답 순서(생성순)는 바뀌지 않는다
- 처리 순서: 대상 조회 → 없으면 404 → 소유자가 다르면 403 → 갱신 (`id`와 `user_id`를 함께 조건으로 사용)
- `updated_at`은 갱신 시각으로 바뀐다. 값이 같아도 요청이 성공하면 갱신한다.
- 응답 200: 갱신된 `TodoResponse`
- 에러: 401, 403, 404, 422, 500
- 프론트는 체크박스 토글(`{completed}`)과 텍스트 저장(`{text}`)에 모두 이 엔드포인트를 쓴다.

### 3-5. `DELETE /api/todos/{todo_id}` — 삭제 (FR-005, FR-008)

- 인증: 필수
- 처리 순서: 대상 조회 → 없으면 404 → 소유자가 다르면 403 → 삭제 (`id`와 `user_id`를 함께 조건으로 사용)
- 응답 204: 본문 없음
- 에러: 401, 403, 404, 422(UUID 형식 오류), 500
- 두 번째 삭제 요청은 404를 받는다. 프론트는 `NOT_FOUND`를 성공으로 처리한다(FR-005).

## 4. CORS

- 허용 Origin은 `CORS_ORIGINS`(쉼표 구분, 기본 `http://localhost:5173`)로 정한다.
- 허용 메서드: `GET, POST, PATCH, DELETE, OPTIONS`. 허용 헤더: `Authorization, Content-Type`.
- 와일드카드(`*`)는 쓰지 않는다.

## 5. 프론트엔드 호출 규약 (FR-011, NFR-006)

| 동작 | 호출 | 화면 갱신 전략 | 실패 시 |
| --- | --- | --- | --- |
| 첫 화면 | `GET /api/todos` | 로딩 표시 → 응답으로 목록 교체. 응답 전에는 추가 버튼 비활성화 | 오류 메시지 + "다시 시도" 버튼 |
| 추가 | `POST` | 응답을 받은 뒤 목록 끝에 추가(화면에서는 같은 우선순위 묶음의 맨 끝). 요청 중에는 추가 버튼 비활성화, 입력창 읽기 전용 | 입력값 유지 + 알림 |
| 토글 | `PATCH {completed}` | 낙관적 업데이트. 성공 응답으로 화면을 덮어쓰지 않음 | `completed`만 **서버가 마지막으로 확인한 값**으로 롤백(사용자가 그사이 다시 바꾸지 않은 경우만) + 알림 |
| 수정 | `PATCH {text?, due_date?, category?, priority?}` (바뀐 필드만) | 낙관적 업데이트. 성공 응답으로 화면을 덮어쓰지 않음 | 보낸 필드만 롤백(위와 같은 기준과 조건) + 알림 |
| 필터 | 요청 없음 | 받아 둔 전체 목록을 브라우저에서 거른다 (D-10). 완료 상태 필터(FR-017)도 같은 목록을 카테고리 → 상태 순서(AND)로 거른다. `?completed=` 파라미터는 없다 (D-13) | - |
| 정렬 | 요청 없음 | 필터 결과를 브라우저에서 항상 우선순위순으로 정렬한다. 상태로 저장하지 않는 파생 값이라 `todos` 상태는 생성순을 유지한다 (D-12) | - |
| 삭제 | `DELETE` | 먼저 제거 + 입력창 포커스 | `NOT_FOUND`는 성공 처리. 그 외에는 원래 위치에 복구 + 알림 |

- 인증 없는 요청이 깨진 JSON을 보내도 422가 아니라 401이다. FastAPI는 JSON 파싱을 인증보다 먼저 하므로, 에러 처리기에서 보호된 경로의 인증을 먼저 확인한다.
- 네트워크 실패는 `ApiError(code: "NETWORK_ERROR")`로 바꾸고 "서버에 연결할 수 없습니다."로 안내한다.
- 3단계에서 401을 받으면 로그인 화면으로 보낸다.

## 6. 요구사항 ↔ 엔드포인트

| ID | 엔드포인트·절 |
| --- | --- |
| FR-001 | `POST /api/todos`, 2-3 |
| FR-002 | `GET /api/todos` |
| FR-003 | `PATCH` (`completed`) |
| FR-004 | `PATCH` (`text`), 2-3 |
| FR-005 | `DELETE` |
| FR-006 | 별도 API 없음. 프론트가 `GET` 결과로 계산 (PRD D-7) |
| FR-007 | 1절 |
| FR-008 | 1-1절, `PATCH`·`DELETE` 처리 순서, `GET` 소유자 필터 |
| FR-009 | 모든 쓰기 엔드포인트는 저장소에 반영한 뒤 응답 |
| FR-010 | 2-3절 |
| FR-011 | 5절 |
| FR-012 | `POST`·`PATCH`의 `due_date`, 2-4절, `TodoResponse.due_date` |
| FR-013 | `POST`·`PATCH`의 `category`, 2-5절, `TodoResponse.category` |
| FR-014 | `GET /api/todos?category=`, 2-5절, 5절(필터) |
| FR-015 | `POST`·`PATCH`의 `priority`, 2-6절, `TodoResponse.priority` |
| FR-016 | 별도 API 없음. `GET`은 생성순을 유지하고 프론트가 정렬 (3-2절, 5절 정렬, D-12) |
| FR-017 | 별도 API 없음. 프론트가 `GET` 결과의 `completed`로 거른다 (5절 필터, D-13) |
| NFR-004 | 1절, 1-1절, 2-1절(`INTERNAL_ERROR` 정보 비노출), 4절 |
| NFR-005 | `GET /api/health` |
| NFR-006 | 2-1절, 5절 |
| NFR-007 | `GET /api/todos` (인덱스는 db-schema 2절) |

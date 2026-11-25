# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 매 세션 자동으로 읽는 프로젝트 지침입니다.
프로젝트 상태가 바뀌면(백엔드 추가, 폴더 구조 변경, 새 명령어 등) **같은 작업 안에서 이 파일도 함께 갱신**합니다.

## 1. 언어 정책 (Language Policy)

- 사용자에게 보여주는 모든 응답(설명, 계획, 진행 상황, 오류 분석, 테스트 결과, 최종 요약, 표·제목)은 한국어로 작성한다.
- 전문 용어는 필요하면 영어를 병기한다. 예: 상태 관리(State Management)
- 변수·함수·클래스·파일명은 영어, **코드 주석과 Docstring은 한국어**로 작성한다.
- README.md, `docs/` 문서, **Git 커밋 메시지는 한국어**로 작성한다.
- API 경로, 라이브러리 이름, 환경 변수, 명령어, 외부 API 명칭, 코드 블록 안의 문법은 원문을 유지한다.
- Subagent·Skill·MCP·Hook 결과는 한국어로 요약해 설명하되, 외부 도구의 원본 로그와 오류 메시지는 바꾸지 않는다.
- 사용자가 영어 출력을 명시적으로 요청하면 그 요청을 따른다.

## 2. 프로젝트 개요와 현재 상태

React + FastAPI + Supabase로 만들어 Vercel에 배포할 **ToDo List 웹앱**입니다. 현재 1단계(백엔드 + In-Memory 저장소 + dev 인증 + 프론트 연동), 마감일 기능(FR-012, T-60~T-64), 카테고리·필터 기능(FR-013·FR-014, T-70~T-74), 입력 검증 강화(v2.3, 1~100자 + 인라인 오류), 우선순위·정렬 기능(v2.4, FR-015·FR-016, T-80~T-83), 완료 상태 필터(v2.5, FR-017, T-90~T-93)까지 구현되어 있습니다.

| 영역 | 현재 상태 (작업 트리 기준) | 목표 |
| --- | --- | --- |
| `frontend/` | `src/api/`로 FastAPI와 연동. 로딩·오류·다시 시도 UI. 마감일 입력·표시·수정. 카테고리 선택·표시, 카테고리 필터. 우선순위 선택·표시, 화면 우선순위순 정렬. 완료 상태 필터(카테고리와 AND, 화면 전용) | 3단계에서 Supabase Auth 로그인 |
| `backend/` | FastAPI, Router/Service/Repository 계층, **In-Memory 저장소**(재시작하면 데이터 사라짐), dev 인증 | 2단계 Supabase 저장소 (8절 규칙) |
| `supabase/` | `migrations/0001~0003` SQL만 있음(미적용). `0001`은 `docs/db-schema.md`와 다름(`varchar(500)`, `due_date`·`category`·`priority` 없음) | T-21/T-22에서 문서와 맞춰 적용 |
| 인증 | dev 모드: Bearer 토큰 값을 그대로 `user_id`로 사용 (공개 배포 금지) | Supabase Auth JWT 검증 |
| 배포 | 없음 | `frontend/`, `backend/`를 각각 별도 Vercel 프로젝트로 배포 |

- `README.md`는 **목표 아키텍처** 기준으로 쓰여 있어 현재 상태와 다르다. 현재 상태는 이 표를 기준으로 판단한다.
- 다음 작업은 `docs/tasks.md`의 2단계(T-20 이후)다. 착수 전에 `docs/spec-review.md`의 Q-02, Q-03을 확인한다.

### 2-1. 문서

| 문서 | 내용 |
| --- | --- |
| `docs/prd.md` | 요구사항 `FR-001`~`FR-017`, `NFR-001`~`NFR-009`, 설계 결정 `D-1`~`D-13` (요구사항 ID의 기준 문서) |
| `docs/api-spec.md` | 엔드포인트, 인증 모드, 공통 에러 포맷, 텍스트 검증 규칙, 프론트 호출 규약 |
| `docs/db-schema.md` | `public.todos`, 마이그레이션 SQL `0001`~`0004`, RLS·권한 |
| `docs/acceptance-criteria.md` | 수용 기준 `AC-<ID>-<n>` (pytest 테스트 이름이 이 ID로 시작) |
| `docs/tasks.md` | 단계별 구현 작업 `T-xx`와 완료 조건 |
| `docs/spec-review.md` | 명세 간 누락·충돌 검토 결과 `R-xx`, 결정 필요 항목 `Q-xx` |
| `docs/ui-guidelines.md` | 디자인 토큰, 컴포넌트·반응형·접근성 규칙 (UI 작업 전 필독) |
| `README.md` | 목표 기술 스택, 환경 변수, Supabase 설정, Vercel 배포 절차 |

코드 주석과 테스트 이름에는 관련 요구사항 ID(`FR-xxx`, `NFR-xxx`)를 인용해 추적성을 유지한다.
구현은 `docs/tasks.md`의 단계 순서를 따르고, 명세를 바꾸면 `docs/spec-review.md`의 커버리지와 발견 사항도 갱신한다.

## 3. 기술 스택

| 영역 | 기술 | 버전/비고 |
| --- | --- | --- |
| Frontend | React + TypeScript | React 19.3, TypeScript 7.0 |
| 빌드 | Vite | 8.3, `@vitejs/plugin-react` |
| 린트 | oxlint (ESLint 아님) | 1.9x, 설정 `frontend/.oxlintrc.json` |
| 스타일 | 일반 CSS + CSS 사용자 정의 속성 | **UI 라이브러리 사용 금지** (CSS 프레임워크, 컴포넌트 키트 포함) |
| 폰트 | IBM Plex Sans KR | `frontend/index.html`에서 Google Fonts로 로드 |
| Backend (예정) | FastAPI, Pydantic, httpx | pytest로 테스트 |
| DB/Auth (예정) | Supabase (PostgreSQL, Auth, RLS) | 백엔드는 PostgREST(`/rest/v1`)로 접근 |
| 배포 (예정) | Vercel | 프론트 정적 호스팅, 백엔드 서버리스 함수 |
| 개발 환경 | Windows 11, Node 24, npm 11 | Bash(Git Bash)와 PowerShell 모두 사용 가능 |

새 런타임 의존성 추가는 꼭 필요할 때만 하고, 추가 이유를 사용자에게 설명한다.

## 4. 폴더 구조

```text
todo-ai-native2/
├── CLAUDE.md               # 이 파일
├── README.md               # 목표 아키텍처, 환경 변수, 배포 절차
├── docs/
│   ├── prd.md, api-spec.md, db-schema.md, acceptance-criteria.md, tasks.md, spec-review.md
│   └── ui-guidelines.md    # UI 디자인 규칙
├── backend/
│   ├── app/                # main.py, dependencies.py, core/, routers/, services/, repositories/, schemas/, models/ (8-1절)
│   ├── tests/              # conftest.py, test_todos_api.py (테스트 이름 = 수용 기준 ID)
│   ├── requirements.txt, requirements-dev.txt, pytest.ini, ruff.toml, .env.example
│   └── .venv/              # 로컬 가상환경 (커밋 금지)
├── frontend/
│   ├── index.html          # lang="ko", 폰트 로드, 페이지 제목
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── main.tsx        # 진입점 (StrictMode)
│   │   ├── App.tsx         # todos·loadState 상태, API 호출과 낙관적 업데이트, 화면 구성
│   │   ├── api/            # client.ts(ApiError, 인증 헤더), todos.ts(DTO 변환)
│   │   ├── env.d.ts        # VITE_* 환경 변수 타입
│   │   ├── types.ts        # Todo { id, text, completed, dueDate, category, priority }
│   │   ├── categories.ts   # Category 타입, 라벨(업무·개인·학습), 기본값, 필터별 개수 계산
│   │   ├── priorities.ts   # Priority 타입, 라벨(높음·보통·낮음), 기본값(보통), sortByPriority(안정 정렬)
│   │   ├── statuses.ts     # StatusFilter 타입(all·active·done), 라벨(전체·진행 중·완료), matchesStatus, countByStatus
│   │   ├── dueDate.ts      # 마감일 표시 규칙(오늘·지남), 현지 날짜 키, 허용 범위
│   │   ├── todoText.ts     # 할 일 텍스트 검증(1~100자, 서버와 같은 오류 문구)
│   │   ├── index.css       # 디자인 토큰 + 전체 스타일 (단일 파일)
│   │   └── components/
│   │       ├── TodoInput.tsx      # 입력창 + 카테고리 + 우선순위 + 마감일(선택) + 추가 버튼
│   │       ├── TodoItem.tsx       # 작업 카드, 카테고리·우선순위·마감 표시, 인라인 편집(텍스트·마감일·카테고리·우선순위)
│   │       ├── CategoryFilter.tsx # 카테고리 필터(전체·업무·개인·학습, aria-pressed)
│   │       ├── StatusFilter.tsx   # 완료 상태 필터(전체·진행 중·완료, aria-pressed)
│   │       ├── ProgressRing.tsx   # 원형 완료율 (작업당 호 한 칸 / 연속형)
│   │       ├── StatCard.tsx       # 통계 카드 한 칸 (전체·완료·미완료)
│   │       ├── PriorityBadge.tsx  # 우선순위 색상 배지 (글자 + 색)
│   │       └── EmptyState.tsx     # 빈 상태 안내
│   ├── .env.example        # VITE_API_BASE_URL, VITE_DEV_AUTH_TOKEN
│   ├── .oxlintrc.json
│   └── package.json
├── .claude/
│   ├── settings.json       # Hook(PreToolUse 위험 명령 차단, PostToolUse 린트) + permissions
│   ├── hooks/              # check_dangerous_commands.py, check_changed_files.py, tests/
│   └── agents/, commands/, skills/
├── lession/solution/.claude/   # 학습용 예제 (commands, skills, hooks). 실제 설정 아님
└── .omc/                   # OMC 로컬 상태 (.gitignore 대상, 커밋 금지)
```

백엔드를 추가할 때의 구조는 8-1절을 따른다.

## 5. 실행 명령어

### 5-1. Frontend (`frontend/`에서 실행)

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc -b 타입 검사 + vite build  (타입 검사는 이 명령으로 한다)
npm run lint      # oxlint
npm run preview   # 빌드 결과 미리보기
```

### 5-2. Backend (`backend/`에서 실행)

```bash
python -m venv .venv                               # 최초 1회 (.venv는 .gitignore 대상)
.venv/Scripts/python -m pip install -r requirements-dev.txt
.venv/Scripts/python -m uvicorn app.main:app --reload   # http://localhost:8000, 문서: /docs
.venv/Scripts/python -m pytest                     # 전체 테스트
.venv/Scripts/python -m pytest -k ac_fr_008        # 수용 기준 ID로 선택 실행
.venv/Scripts/ruff check .                         # Python 린트 (Ruff, requirements-dev.txt에 고정)
```

- macOS/Linux에서는 `.venv/Scripts/python` 대신 `.venv/bin/python`을 쓴다.
- 환경 변수는 `backend/.env.example` 참고. `--env-file .env`로 넘길 수 있다. 1단계에서는 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`를 비워 둔다(설정하면 아직 구현 전이라 시작 시 `RuntimeError`).
- 화면을 확인할 때는 백엔드를 먼저 띄운다. 백엔드가 없으면 프론트는 "할 일 목록을 불러오지 못했습니다" 오류 화면을 보여 준다.

## 6. 프론트엔드 아키텍처와 코딩 규칙

### 6-1. 상태 관리

- `App.tsx`가 단일 `todos: Todo[]` 상태를 소유하고, 하위 컴포넌트는 Props로 데이터와 이벤트 핸들러를 받는다.
- 파생 값(완료 개수, 완료율, 카테고리 결과 `categoryTodos`, 필터 결과 `filteredTodos`, 정렬 결과 `visibleTodos`, 완료율 대상 `progressTodos`, 필터별 개수)은 **상태로 따로 저장하지 않고** `todos`와 `filter`에서 계산한다.
- 화면 순서는 `visibleTodos = sortByPriority(filteredTodos)`(높음 → 보통 → 낮음, 같은 우선순위는 생성순, PRD D-12). **`todos` 상태는 생성순 그대로 둔다.** 삭제 복구 `splice` 위치, 추가(끝에 붙이기), `confirmedRef` 롤백이 생성순을 전제로 한다. `ProgressMeter`에는 `progressTodos`(카테고리 결과를 정렬한 목록. 상태 필터가 "전체"면 `visibleTodos`와 같음)를 넘긴다. 카테고리 개수는 `todos` 기준, 상태 개수는 `categoryTodos` 기준이다.
- 필터 상태 `filter`(`'all' | Category`)와 `statusFilter`(`'all' | 'active' | 'done'`)는 `App`이 가진다. 목록은 한 번만 받고 브라우저에서 카테고리 → 상태 순서(AND)로 거른다(PRD D-10, D-13). 완료율은 카테고리 결과 기준, 빈 상태는 두 필터 결과 기준이다.
- `TodoItem`은 편집에 필요한 로컬 상태(`isEditing`, `draft`, `draftDue`, `draftCategory`, `draftPriority`, `saveAttempted`)만 가진다.
- 상태 갱신은 함수형 업데이트(`setTodos((prev) => ...)`)와 불변 갱신(`map`, `filter`, 전개 연산자)으로 한다.
- 렌더링 중에 비순수 함수(`new Date()`, `Math.random()`)를 호출하지 않는다. 필요하면 `useState(() => ...)` 초기화 함수를 쓴다(oxlint `react(purity)` 경고 대상).
- 새 할 일 id는 서버가 발급한다. 그래서 추가는 응답을 받은 뒤 목록에 넣는다.

### 6-2. API 연동 규칙

- 호출은 `src/api/` 계층으로 모은다. `client.ts`는 Base URL, `Authorization: Bearer` 헤더, 공통 에러 포맷 → `ApiError(status, code, message)` 변환을 맡고, `todos.ts`는 서버 DTO(snake_case)를 `Todo`로 바꾼다.
- 상태는 `loadState`(`loading | ready | error`)로 관리하고, 오류는 `role="alert"` 알림으로 보여 준다.
- 동작별 업데이트 전략:

| 동작 | 전략 |
| --- | --- |
| 추가 | 서버 응답을 받은 뒤 목록에 추가 (id를 서버가 발급). 화면에서는 같은 우선순위 묶음의 맨 끝 |
| 토글/수정 | 낙관적 업데이트(Optimistic Update). 실패하면 바뀐 필드만 롤백 (`text`, `completed`, `dueDate`, `category`, `priority`) |
| 필터 | 요청 없음. 받아 둔 전체 목록을 거른다. 필터가 특정 카테고리면 추가 폼 기본값도 그 카테고리. 완료 상태 필터도 요청 없음(`?completed=` 없음). "완료" 필터에서 추가하면 상태 필터를 "전체"로 되돌린다 |
| 정렬 | 요청 없음. 필터 결과를 항상 우선순위순으로 정렬(토글 없음). 서버는 생성순 반환 |
| 삭제 | 먼저 목록에서 제거 + 입력창 포커스. `NOT_FOUND`는 성공으로 간주, 그 외 실패는 원래 위치에 복구 |

- 목록 조회 `useEffect`는 `ignore` 플래그로 StrictMode 이중 실행과 늦게 도착한 응답을 무시한다.
- 롤백 기준은 화면 상태가 아니라 `confirmedRef`(서버가 마지막으로 확인한 값)다. 화면 상태에는 아직 저장되지 않은 낙관적 값이 섞여 있어, 연속 클릭 후 둘 다 실패하면 서버에 없는 값으로 돌아간다.
- 토글·수정의 성공 응답으로 화면을 덮어쓰지 않는다. 늦게 온 응답이 사용자의 최신 선택을 되돌린다.
- 목록을 불러오기 전에는 추가 버튼을 비활성화한다(늦게 온 목록 응답이 방금 추가한 항목을 덮어쓰는 것을 막는다).
- 환경 변수: `VITE_API_BASE_URL`(기본 `http://localhost:8000`, `/api`는 붙이지 않음), `VITE_DEV_AUTH_TOKEN`.

### 6-3. 코드 스타일

- 세미콜론 없음, 작은따옴표, 들여쓰기 2칸, 여러 줄 객체·배열 끝에 쉼표(trailing comma).
- 컴포넌트는 `export default function 이름()` 형태로 쓰고, Props 타입은 같은 파일 위쪽에 `interface 이름Props`로 정의한다.
- 타입만 가져올 때는 `import type`을 쓴다(`verbatimModuleSyntax` 설정).
- 이벤트 타입은 `FormEvent`, `KeyboardEvent` 등을 `react`에서 타입으로 가져온다.

## 7. UI 디자인 규칙

상세 규칙은 `docs/ui-guidelines.md`에 있다. **UI를 바꾸면 이 문서도 같은 작업에서 갱신한다.**

### 7-1. 디자인 원칙

- 미니멀한 생산성 대시보드 스타일. 강조 요소는 **작업 수만큼 나뉜 원형 프로그레스 하나**뿐이고, 나머지는 조용하게 둔다.
- 색상 하나에 의미 하나. 그림자·그라데이션 같은 장식 대신 배경·테두리 차이로 상태를 구분한다. 우선순위 배지만 전용 토큰 색을 쓴다(spec-review R-47).
- 880px 이상은 2열(왼쪽 300px: 헤더 → 원형 → 통계 카드 / 오른쪽: "오늘의 작업" → 입력 폼 → 상태 필터 탭 → 작업 카드 목록), 그보다 좁으면 같은 순서의 1열(최대 600px). 왼쪽 정렬.

### 7-2. 디자인 토큰 (`src/index.css`의 `:root`)

- 색상은 **하드코딩하지 않고 토큰을 쓴다.** 새 색이 필요하면 토큰을 추가하고, 다크 모드 값도 함께 정의한다.
- 다크 모드는 `@media (prefers-color-scheme: dark)`에서 같은 토큰을 재정의한다.

| 토큰 | 용도 |
| --- | --- |
| `--paper`, `--surface` | 페이지 배경, 카드·입력창 배경 |
| `--ink` | 본문, 주요 버튼(추가·저장) |
| `--slate` | 보조 텍스트, 카드 안 고스트 버튼 |
| `--line`, `--line-strong`, `--track`, `--hover` | 테두리, 진행 막대 빈 칸, 호버 배경 |
| `--pine` | **완료 상태 전용** (체크박스, 취소선, 진행 칸) |
| `--focus` | **키보드 포커스 링 전용** |
| `--danger` | 삭제 버튼 호버·포커스, 오류 알림, 지난 마감("N일 지남") |
| `--priority-high/medium/low` (+`-bg`) | **우선순위 배지 전용** (호박색·남보라·회색) |

- 간격 `--space-1`~`--space-7`(4/8/12/16/24/32/48px), 글자 크기 `--text-sm`/`--text-md`/`--text-xl`(14/16/28px).
- 모서리 반경은 위계별로 다르게 쓴다: 카드 `--radius-card` 12px, 입력·버튼 `--radius-control` 8px, 진행 칸 `--radius-segment` 3px.
- 서체는 IBM Plex Sans KR 하나. 굵기는 400/500/700만 쓰고, 바뀌는 숫자에는 `tabular-nums`를 적용한다.
- 상태 클래스는 `is-` 접두사를 쓴다(`is-done`, `is-editing`). 버튼 변형은 `btn-primary`, `btn-ghost`, `btn-danger`.

### 7-3. 컴포넌트 규칙

- **ProgressRing**: 원형 + 가운데 퍼센트 + "N개 중 M개 완료" 문장. 작업 24개 이하는 작업 하나당 호 한 칸(화면 목록 순서), 초과하면 연속형 원. 원은 `aria-hidden`, 문장은 `aria-live="polite"`. 아래 `StatCard` 3칸(전체·완료·미완료)은 상태 필터와 무관하게 전체 목록 기준.
- **작업 카드(TodoItem)**: `--surface` 배경 + 1px 테두리, 그림자 없음. 완료하면 배경을 비우고(`--paper`가 비침) 텍스트를 `--slate` + `--pine` 취소선으로 바꾼다. 수정·삭제는 고스트 버튼.
- **입력 폼(TodoInput)**: 높이 48px 입력창 + 잉크색 "추가" 버튼. 텍스트는 `trim()` 후 1~100자. 잘못된 입력이면 버튼을 막지 않고, 제출 시 요청 대신 입력창 아래 `.field-error`(`role="alert"`, `aria-invalid`)로 이유를 보여 준다. 규칙·문구는 `src/todoText.ts` 한 곳에 두고 서버와 같게 유지한다(`maxLength`는 쓰지 않음, 코드 포인트 기준).
- **마감일(FR-012)**: 추가 폼 2줄에 "마감일 (선택)" 라벨 + `<input type="date">`. 카드에는 텍스트 아래 `<time>`으로 "M월 D일 마감" / "오늘 마감" / "N일 지남"(`--danger`, 미완료만). 편집 모드에서 날짜 수정과 "마감일 지우기". 날짜는 `YYYY-MM-DD` 문자열로 다루고 "오늘"은 현지 날짜(`dueDate.ts`의 `toDateKey`)로 판단한다. `toISOString()`은 UTC라 쓰지 않는다.
- **카테고리(FR-013·FR-014)**: 추가·편집 폼에 "카테고리" `<select>`(업무·개인·학습, 기본 개인). 카드에는 텍스트 아래 `.todo-meta` 줄에 카테고리 라벨(`--line` 테두리) → 마감 표시. **카테고리별 색은 쓰지 않는다.** 필터는 입력 폼과 목록 사이의 버튼 4개(`role="group"`, `aria-pressed`, 개수 표시). 편집으로 카테고리를 바꿔 현재 필터에서 빠지면 입력창으로 포커스를 옮긴다.
- **우선순위(FR-015·FR-016)**: 추가·편집 폼에서 카테고리 다음에 "우선순위" `<select>`(높음·보통·낮음, 기본 보통, 추가 후에도 선택 유지). Tab 순서는 입력 → 카테고리 → 우선순위 → 마감일 → 추가. 카드 `.todo-meta`는 카테고리 → 우선순위 배지(`PriorityBadge`, `.priority-badge.is-<값>`, `.sr-only` "우선순위 " 접두어) → 마감. **배지는 우선순위 전용 토큰 색 + 글자**로 표시하고(색만으로 구분하지 않음), 완료 시 강조를 해제한다(R-47). 우선순위를 바꾸면 카드가 같은 `key`로 이동하고 `returnFocus`가 옮겨진 카드의 "수정" 버튼으로 포커스를 돌려준다.
- **완료 상태 필터(FR-017)**: 카테고리 필터 바로 아래 줄(`.filters` 안 두 번째 `.filter-group`), 버튼 3개(전체·진행 중·완료, `aria-pressed`, 현재 카테고리 안의 개수). 카테고리 필터와 같은 스타일이고 새 색은 없다. 두 필터 줄 앞에 보이는 라벨(`.filter-label` "카테고리"/"상태", `aria-hidden`)로 구분한다. "진행 중"·"완료" 필터에서 체크해 카드가 빠지면 입력창으로 포커스를 옮긴다.
- **빈 상태**: 점선 칸 안에 다음 행동을 안내하는 문구를 넣는다. 필터 결과가 비면 "<카테고리> 할 일이 없습니다.", 상태 필터가 원인이면 "[<카테고리> 중 ]진행 중인/완료한 할 일이 없습니다." (`App.tsx`의 `emptyMessage`)
- 작업 카드와 입력 폼은 같은 토큰을 쓰고, 새 컴포넌트도 기존 토큰과 버튼 변형을 재사용한다.

### 7-4. 반응형

| 조건 | 동작 |
| --- | --- |
| `max-width: 600px` | 페이지 여백 축소 |
| `pointer: coarse` | 버튼·편집 입력 높이 44px (터치 대상 크기) |
| `max-width: 359px` | 카드의 수정·삭제 버튼을 다음 줄로 내림 (360px 이상은 한 줄 유지, NFR-002) |
| `prefers-reduced-motion: reduce` | 모든 전환 효과 끔 |

### 7-5. 접근성 (리팩터링 중에도 반드시 유지, NFR-001·NFR-003)

- 체크박스는 네이티브 `<input type="checkbox">` + `appearance: none`. 작업 텍스트는 `<label htmlFor>`로 연결한다.
- 모든 조작 요소는 `:focus-visible`에서 3px `--focus` 외곽선(offset 2px)을 표시한다. 텍스트 입력창만 offset 0 + 테두리도 `--focus`로 바꾼다. `outline: none`만 단독으로 쓰지 않는다.
- 수정·삭제 버튼의 `aria-label`에 작업 내용을 넣는다. 예: `"운동 30분" 삭제`
- 편집을 저장하거나 취소하면 해당 작업의 "수정" 버튼으로 포커스를 되돌린다(`TodoItem`의 `returnFocus`).
- 편집 중 Esc는 편집 취소. 삭제 후에는 새 할 일 입력창으로 포커스를 옮긴다(`App`의 `inputRef` → `TodoInput`).
- 시각적으로 숨긴 라벨은 `.sr-only` 클래스를 쓴다.

## 8. API 개발 규칙 (백엔드 구현 시)

### 8-1. 계층 구조

요청은 `routers → services → repositories` 순서로 흐르고, 계층마다 책임을 나눈다.

```text
backend/
├── app/
│   ├── main.py            # create_app(settings) 팩토리, 저장소는 app.state에 앱마다 하나
│   ├── dependencies.py    # 저장소·서비스 의존성 주입
│   ├── routers/todos.py   # HTTP 입출력 변환만 담당
│   ├── schemas/todo.py    # Pydantic 요청/응답 모델, 입력 검증
│   ├── services/          # 비즈니스 규칙 (소유권 검사, updated_at 갱신)
│   ├── repositories/      # TodoRepository Protocol + InMemory/Supabase 구현
│   ├── models/todo.py     # 불변 dataclass. 수정은 dataclasses.replace
│   └── core/              # config, auth(CurrentUserId), errors(AppError)
├── api/index.py           # Vercel 서버리스 진입점
├── tests/
└── requirements*.txt
```

- 라우터에 비즈니스 로직이나 DB 호출을 넣지 않는다.
- 인증은 `core/auth.py`의 `CurrentUserId` 의존성 한 곳에서만 처리한다. 인증 방식을 바꿀 때 이 파일만 교체하도록 한다.
- 저장소는 Protocol로 추상화한다. Supabase 환경 변수가 없으면 In-Memory, 있으면 Supabase 저장소를 쓴다. 둘 중 하나만 있으면 앱 생성 시 `RuntimeError`.

### 8-2. 엔드포인트 (Base: `/api`, `docs/prd.md` FR 기준)

| 메서드 · 경로 | 동작 | 성공 응답 | 요구사항 |
| --- | --- | --- | --- |
| `GET /api/todos` | 본인 목록, `created_at` 오름차순(우선순위 정렬 없음). 선택 쿼리 `?category=` | 200 `{ "items": [TodoResponse] }` | FR-002, FR-008, FR-014 |
| `POST /api/todos` | 생성 (`{ "text", "due_date"?, "category"?, "priority"? }`) | 201 `TodoResponse` | FR-001, FR-010, FR-012, FR-013, FR-015 |
| `PATCH /api/todos/{todo_id}` | 부분 수정 (`text`, `completed`, `due_date`, `category`, `priority` 중 최소 하나) | 200 `TodoResponse` | FR-003, FR-004, FR-012, FR-013, FR-015 |
| `DELETE /api/todos/{todo_id}` | 삭제 | 204 본문 없음 | FR-005 |

- `TodoResponse` = `{ id, text, completed, due_date, category, priority, created_at, updated_at }`. JSON 필드는 snake_case.
- `due_date`: `YYYY-MM-DD` 문자열만 허용(2000-01-01~2100-12-31, 실제 날짜). PATCH에서 **생략은 유지, `null`은 지우기**다. 스키마는 `model_fields_set`(`has_due_date`)으로 구분하고, 서비스는 `UNSET` 센티널을 받는다. `text`, `completed`의 `null`은 계속 422.
- `category`: `work`·`personal`·`study`만 허용(`models/todo.py`의 `Category`, 스키마의 `CategoryField`). 생성 시 생략하면 `personal`, `null`은 POST·PATCH 모두 422. 같은 `CategoryField`를 `GET ?category=` 쿼리 검증에도 쓰고, 오류 `details.field`에서 `query.` 접두사는 뺀다. 저장소 `list_by_user(user_id, category)`는 소유자 조건을 항상 함께 건다.
- `priority`: `high`·`medium`·`low`만 허용(`models/todo.py`의 `Priority`, 스키마의 `PriorityField`, `parse_priority`). 생성 시 생략하면 `medium`, `null`은 POST·PATCH 모두 422, PATCH 생략은 유지. 서버 정렬·`?priority=`·`?sort=`는 없다(정렬은 프론트, PRD D-12).
- DB는 `docs/db-schema.md`의 `0001`에 `category text not null default 'personal'` + `todos_category_valid`, `priority text not null default 'medium'` + `todos_priority_valid`를 문서로만 반영했다. 실제 적용은 T-21/T-22에서 승인 후.
- 검증: `text`는 `trim()` 후 1~100자(`schemas/todo.py`의 `TEXT_MAX_LENGTH`, 프론트 `todoText.ts`와 같은 값). `StrictStr`, `StrictBool`로 타입 강제 변환을 막는다.
- 페이지네이션·검색·단건 조회는 범위 밖이다(PRD 4-2).

### 8-3. 에러 처리

모든 에러는 `AppError` 하위 클래스를 raise해 아래 형식으로 응답한다.

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "할 일 내용을 입력해 주세요.", "details": null } }
```

| 코드 | 상태 | 상황 |
| --- | --- | --- |
| `UNAUTHENTICATED` | 401 | 토큰 없음·만료·서명 불일치 |
| `FORBIDDEN` | 403 | 다른 사용자 소유 리소스 |
| `NOT_FOUND` | 404 | 존재하지 않는 todo |
| `VALIDATION_ERROR` | 422 | 요청 본문 검증 실패 (FastAPI 기본 422도 이 형식으로 변환) |
| `INTERNAL_ERROR` | 500 | DB 오류 등 (내부 정보는 응답에 노출하지 않음) |

### 8-4. 보안

- 모든 쿼리는 `user_id` 조건을 명시한다. `update`·`delete`는 `id`와 `user_id`를 함께 조건으로 쓴다(FR-008).
- RLS는 이중 방어선이다. Secret Key(`service_role`)는 RLS를 우회하므로 서버 측 소유자 필터를 빼먹으면 안 된다.
- `SUPABASE_SECRET_KEY`는 백엔드 환경 변수로만 쓰고, 프론트엔드(`VITE_*`)나 저장소에 넣지 않는다(NFR-004).
- 시각은 UTC로 저장·응답한다.
- `dev` 인증(토큰 값을 그대로 user_id로 사용)은 로컬 개발 전용이다. 공개 배포 전에 Supabase JWT 검증으로 바꾼다.

## 9. 테스트 정책

### 9-1. 공통

- 작업을 마치기 전에 가능한 범위에서 아래 검사를 **실제로 실행**하고 결과를 보고한다. 실행하지 못한 검사는 못 했다고 밝힌다.
- 테스트와 검증 항목에는 관련 요구사항 ID를 붙인다.

### 9-1-1. Hook과 권한 규칙 (`.claude/settings.json`)

**위험 명령 차단 (PreToolUse, `Bash|PowerShell`)**: `.claude/hooks/check_dangerous_commands.py`가 실행 전에 명령을 검사한다.

| 판단 | 대상 예 | 동작 |
| --- | --- | --- |
| 차단 `deny` | `git push --force`, `git reset --hard`, `git clean -f`, `rm -rf`, `Remove-Item -Recurse -Force`, `rd /s /q`, `DROP`·`TRUNCATE`·WHERE 없는 `DELETE`, `supabase db reset`, `.env`·`db정보.txt`·키 파일 읽기·복사·커밋, `env`·`printenv`, 비밀 환경 변수 출력 | 사유가 Claude에게 전달된다. 우회하지 말고 사용자에게 위험과 이유를 설명한 뒤 직접 실행을 요청한다 |
| 확인 `ask` | `rm -r`, `--force-with-lease`, `git checkout -- .`, `psql -f`, WHERE 있는 `DELETE`, `curl -X DELETE`, `curl ... \| sh`, 변수로 정한 명령 이름, 인코딩·난독화된 명령, 인라인 코드의 삭제 API, `source .env` | 사용자 승인 창이 뜬다 |
| 통과 | 그 밖의 명령 | 아무것도 출력하지 않는다(자동 승인 아님). 아래 `permissions`와 평소 승인 정책을 따른다 |

- 명령 조합(`;` `&&` `\|\|` `\|` `&`), 따옴표, 명령 치환(`$(...)`, 백틱), heredoc, `bash -c`·`eval`·`powershell -Command`·`-EncodedCommand`, `sudo`·`env`·`xargs`·`timeout` 래퍼, `docker exec`·`ssh`·`find -exec` 안의 명령까지 풀어서 검사한다.
- 입력 JSON을 해석하지 못하거나, 검사기에 오류가 나거나, Python을 찾지 못하면 통과시키지 않고 `ask`를 낸다.
- 패턴 검사로 모든 우회를 막을 수는 없다. 그래서 `permissions.deny`(강제 푸시, `rm -rf`, `.env` 읽기 등)와 `permissions.ask`(`git push`, `rm -r`, `psql` 등)를 이중 방어선으로 둔다.
- 검사 규칙을 바꾸면 `python -m unittest discover -s .claude/hooks/tests -v`(프로젝트 루트)로 판단 표와 Hook 입출력을 확인한다. 위험 명령은 실제로 실행하지 않고 모의 JSON 입력으로만 시험한다.
- `settings.json`의 Hook 설정은 세션 시작 시 읽힌다. 바꾼 뒤에는 `/hooks`에서 확인하거나 세션을 다시 시작한다.

**자동 린트 (PostToolUse, `Edit|Write`)**

- Edit·Write 후 PostToolUse Hook이 `.claude/hooks/check_changed_files.py`로 **바뀐 파일 하나만** 검사한다. JS/TS는 그 파일의 `package.json`에 설정된 린터(oxlint, `--deny-warnings`), Python은 Ruff(`backend/.venv` 우선).
- 문제가 있으면 종료 코드 2로 린터 원본 출력을 보고한다. 보고를 받으면 같은 작업 안에서 고친다. 린터가 설치되지 않았으면 안내만 남기고 막지 않는다.
- Ruff 설정은 `backend/ruff.toml`(`src = ["."]`)이다. Hook은 프로젝트 루트에서 Ruff를 실행하므로, 이 설정이 없으면 `app`을 서드파티로 보고 import 순서(I001)를 잘못 보고한다.
- 여러 번에 나눠 편집하면 중간 상태(선언만 하고 아직 쓰지 않은 변수 등)에서 경고가 날 수 있다. 마지막 편집 후 경고가 남지 않으면 된다.
- 명령은 `python3` → `python` → `py` 중 실제로 Python 3.9 이상이 실행되는 것을 고른다(Windows의 `python3` Store 스텁 회피, macOS/Linux 지원).

### 9-2. Frontend

- 테스트 러너가 없다. 필수 검사는 `npm run build`(타입 검사)와 `npm run lint`(경고 0건 유지).
- UI·동작을 바꾸면 브라우저에서 CRUD 5가지(추가, 조회, 수정, 삭제, 완료 토글)와 키보드 흐름(Tab 순서, Esc 취소, 포커스 복귀)을 확인한다.
- 자동 확인 방법: `frontend/public/`에 임시 HTML 하네스를 두고, 같은 출처 iframe 안의 앱을 DOM 이벤트로 조작한다.
  - 입력값은 `HTMLInputElement.prototype`의 `value` setter를 호출하고 `input` 이벤트를 발생시켜야 React에 반영된다. 제출은 `form.requestSubmit()`.
  - 작업 카드는 `.todo-list > li`로 선택한다. `ProgressMeter`도 `<li>`를 쓰므로 `li`만으로 선택하면 개수가 틀린다.
  - Edge를 `--remote-debugging-port`로 띄우고 Node 내장 `WebSocket`으로 CDP에 붙으면, 실제 Tab·Esc 키 입력(`Input.dispatchKeyEvent`)과 다크 모드(`Emulation.setEmulatedMedia`)를 검증할 수 있다.
  - CDP `Fetch` 도메인으로 요청을 붙잡아 두면 "응답 전 재클릭" 같은 경쟁 조건을 재현할 수 있다. PATCH·DELETE는 CORS 사전 요청(`OPTIONS`)이 먼저 나가므로, 붙잡힌 요청 중 `OPTIONS`는 바로 통과시켜야 한다.
  - API 연동 E2E는 백엔드를 8000이 아닌 포트(예: 8099)로 띄우고, 프론트는 `VITE_API_BASE_URL`, 백엔드는 `CORS_ORIGINS`를 그 포트에 맞춘다.
  - 검증이 끝나면 하네스 파일을 삭제하고, 띄운 서버를 종료한다.
- 테스트 러너를 도입하면(예: Vitest + Testing Library) 이 절을 갱신한다.

### 9-3. Backend

- pytest로 API 테스트를 작성한다. 엔드포인트마다 정상 경로와 401/403/404/422 경로를 모두 검사한다.
- 테스트 함수 이름에 요구사항 ID를 넣는다. 예: `test_fr_008_other_user_todo_is_forbidden` → `pytest -k fr_008`로 선택 실행.
- 테스트마다 `create_app()`으로 새 앱을 만들어 저장소를 격리한다. 사용자 헤더(`USER_A`, `USER_B`)와 에러 포맷 검사 헬퍼(`assert_error`)는 `tests/conftest.py`에 둔다.
- 기본 실행은 In-Memory 저장소로 한다. 실제 Supabase 테스트는 `TEST_SUPABASE=1`일 때만 실행하고, 테스트 전용 사용자 행만 삭제한다.

## 10. Git 및 보안 규칙

- 브랜치: `main`(배포 가능), `feature/*`(기능 개발). 커밋·푸시는 사용자가 요청할 때만 한다.
- 커밋 메시지는 한국어, Conventional Commits 접두사를 쓴다. 예: `feat: 작업 카드 UI 개선`, `docs: CLAUDE.md 갱신`
- 커밋 금지: `.env`(`.env.example`만 허용), `.omc/`, `node_modules/`, `dist/`, 그리고 루트의 `db정보.txt`(접속 정보로 보이는 파일. 내용을 출력하거나 외부로 보내지 않는다)

## 11. 개발 환경 주의 사항

- **Windows 헤드리스 캡처**: Headless Chrome/Edge는 약 500px보다 좁은 창을 제대로 렌더링하지 못한다. 모바일 너비(390px 등)는 `--window-size`가 아니라 같은 출처 페이지 안의 해당 너비 `<iframe>`으로 캡처한다. CDP의 `Emulation.setDeviceMetricsOverride`로는 340px도 정상 확인됐다.
- 헤드리스 `--screenshot`와 `--virtual-time-budget`만 쓰면 동작 시퀀스 도중에 캡처될 수 있다. 하네스가 완료 신호(`document.title` 등)를 남기면 CDP로 그 신호를 기다린 뒤 캡처한다.
- 사용자가 이미 띄워 둔 개발 서버(5173, 5174 등)는 종료하지 않는다. 검증용 서버는 다른 포트(예: `--port 5199 --strictPort`)로 띄우고, 끝나면 종료한다.
- 임시 파일(스크린샷, 스크립트)은 프로젝트 밖 스크래치 디렉터리에 둔다.

## 12. 작업 원칙과 보고 형식

### 12-1. 작업 순서

1. **시작 전**: 관련 코드와 문서(`docs/prd.md`, UI 작업이면 `docs/ui-guidelines.md`)를 읽고, 바꿀 대상과 영향 범위를 파악한다. 복잡한 작업은 한국어로 계획을 먼저 쓴다.
2. **작업 중**: 기존 구조와 코딩 규칙을 유지하고, 불필요한 파일 변경을 최소화한다. CRUD 동작과 7-5절 접근성 동작을 깨뜨리지 않는다.
3. **완료 후**: 변경 파일을 확인하고, 9절 검사를 실행하고, 영향받는 문서(이 파일, `docs/ui-guidelines.md`, `README.md`)를 갱신한다.

### 12-2. 최종 보고 형식 (한국어)

- **작업 요약**: 무엇을 했는지
- **변경 파일**: 파일별 변경 내용과 이유
- **검증 결과**: 실행한 검사와 결과, 실행하지 못한 검사
- **남은 작업**: 미완료 항목, 사용자가 확인하거나 결정할 사항

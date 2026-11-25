# 구현 TASKS

| 항목 | 내용 |
| --- | --- |
| 문서 버전 | v2.4 (2026-11-24) |
| 기준 문서 | [prd.md](./prd.md), [api-spec.md](./api-spec.md), [db-schema.md](./db-schema.md), [acceptance-criteria.md](./acceptance-criteria.md) |
| 표기 | **완료 조건**은 통과해야 할 AC ID. **선행**은 먼저 끝나야 할 Task ID |

단계 번호는 PRD D-1과 같다(0단계는 착수 전 보완 작업).

**진행 상황 (2026-11-20)**: T-01, 1단계 전체(T-10~T-17, T-30~T-35), 마감일 기능(T-60~T-64), 카테고리·필터 기능(T-70~T-74) 완료. 우선순위·정렬 기능(T-80~T-83) 구현 완료, 브라우저 E2E(T-84)는 별도 검증 대기. 백엔드 pytest 131건 통과. 마감일·카테고리 DB 반영은 T-21/T-22에서 승인 후 진행. T-02와 2단계 이후는 미착수. 단계 안에서 선행 관계가 없는 Task는 병렬로 진행할 수 있다.
각 단계는 끝날 때 앱이 동작하는 상태여야 하고, 단계마다 NFR-009(품질 게이트)를 통과해야 한다.

## 0단계 — 명세 결함 보완 (현재 프론트)

| ID | 작업 | 관련 ID | 선행 | 완료 조건 |
| --- | --- | --- | --- | --- |
| T-01 | 추가 버튼을 눌러 추가한 뒤 입력창으로 포커스 이동 (버튼이 비활성화되며 포커스를 잃는 문제) | NFR-003 | - | AC-NFR-003-3 |
| T-02 | `.gitignore`에 `db정보.txt` 추가, README "현재 상태" 문구를 실제 상태로 수정 | NFR-004 | - | spec-review R-07, R-08 해소 |

## 1단계 — 백엔드 + In-Memory 저장소 + dev 인증 (1-A: API)

| ID | 작업 | 관련 ID | 선행 | 완료 조건 |
| --- | --- | --- | --- | --- |
| T-10 | `backend/` 구조 생성: `create_app(settings)`, `core/config.py`(환경 변수 검증), `requirements*.txt`, `pytest.ini`. HEAD 커밋의 코드를 참고 | NFR-004, NFR-009 | - | AC-FR-007-3, AC-NFR-004-1 |
| T-11 | `core/errors.py`: `AppError` 계층, 공통 에러 핸들러, FastAPI 422 변환(`details`에 `field`) | NFR-006 | T-10 | AC-NFR-006-1 |
| T-12 | `core/auth.py`: dev Bearer 인증 `CurrentUserId` | FR-007 | T-10 | AC-FR-007-1, AC-FR-007-2 |
| T-13 | `schemas/todo.py`: `StrictStr`/`StrictBool`, trim 후 1~100자(v2.3), `extra="forbid"`, PATCH 최소 1필드 | FR-010 | T-10 | AC-FR-010-1~4 |
| T-14 | `models/`, `repositories/`: `TodoRepository` Protocol + `InMemoryTodoRepository` | FR-002, FR-009 | T-10 | - |
| T-15 | `services/todo_service.py`: 소유권 검사(404 → 403), `updated_at` 갱신, `clock` 주입 | FR-003, FR-004, FR-005, FR-008 | T-11, T-14 | AC-FR-008-1, AC-FR-008-2, AC-FR-008-3 |
| T-16 | `routers/todos.py` + `GET /api/health` + CORS | FR-001~FR-005, NFR-005 | T-12, T-13, T-15 | AC-FR-001-3, AC-FR-002-1/2/4, AC-FR-003-2, AC-FR-004-6, AC-FR-005-2, AC-FR-007-5 |
| T-17 | pytest: `conftest.py`(`USER_A`, `USER_B`, `assert_error`), 모든 `[API]` 기준 테스트 | NFR-009 | T-16 | AC-NFR-009-2 |

### 1-B: 프론트 API 연동 (1단계에 포함)

| ID | 작업 | 관련 ID | 선행 | 완료 조건 |
| --- | --- | --- | --- | --- |
| T-30 | `src/api/client.ts`(`ApiError`, `NETWORK_ERROR`), `src/api/todos.ts`(DTO 변환), `.env.example` | FR-007, NFR-006 | T-16 | - |
| T-31 | `App.tsx`: `loadState`, 첫 조회(`ignore` 플래그), 로딩·오류·다시 시도 UI. `ui-guidelines.md`에 로딩·오류 컴포넌트 규칙 추가 | FR-002, FR-011, NFR-008 | T-30 | AC-FR-002-3, AC-FR-011-1/2/3, AC-NFR-008-2 |
| T-32 | 추가: 응답 후 반영, 요청 중 버튼 비활성화, 실패 시 입력 유지 + 알림 | FR-001, FR-011 | T-31 | AC-FR-001-1/2/4, AC-NFR-003-3 |
| T-33 | 토글·수정: 낙관적 업데이트, 바뀐 필드만 조건부 롤백 | FR-003, FR-004, NFR-006 | T-31 | AC-FR-003-1/3, AC-FR-004-1~5, AC-NFR-006-2 |
| T-34 | 삭제: 먼저 제거, `NOT_FOUND`는 성공, 그 외에는 원래 위치에 복구 | FR-005, NFR-006 | T-31 | AC-FR-005-1/3/4 |
| T-35 | UI 회귀 검증: 접근성·반응형·완료율 기준을 하네스로 확인, 라이트·다크 캡처 | NFR-001~NFR-003, NFR-008, NFR-009, FR-006 | T-32~T-34 | AC-FR-006-*, AC-NFR-001-*, AC-NFR-002-*, AC-NFR-003-*, AC-NFR-008-1, AC-NFR-009-1 |

## 2단계 — Supabase 영속 저장 (dev 인증 유지)

| ID | 작업 | 관련 ID | 선행 | 완료 조건 |
| --- | --- | --- | --- | --- |
| T-20 | Supabase MCP를 읽기 전용으로 연결하고 `vibedb`의 project ref와 `public` 테이블을 조회. 기존 `todos`와 충돌하는지 확인(SQL 변경 없음) | FR-009 | - | spec-review Q-02 해소 |
| T-21 | `supabase/migrations/0001~0003` 작성 (db-schema 2~3절) | FR-008, FR-009, FR-010, NFR-004 | T-20 | - |
| T-22 | 마이그레이션 적용 (사용자 승인 후) | FR-009 | T-21 | AC-FR-008-5, AC-FR-009-3, AC-FR-010-5 |
| T-23 | `SupabaseTodoRepository`: httpx로 PostgREST 호출, `order=created_at.asc,id.asc`, 모든 쿼리에 `user_id` 조건, UTC 변환, 실패 시 `INTERNAL_ERROR` | FR-002, FR-008, FR-009, NFR-004 | T-14, T-22 | AC-NFR-004-3 |
| T-24 | `TEST_SUPABASE=1`이면 같은 API 테스트를 Supabase 저장소로도 실행. 테스트 사용자 행만 정리. 화면에서 새로고침 후 유지 확인 | FR-008, FR-009, NFR-009 | T-17, T-23 | AC-FR-008-4, AC-FR-009-1, AC-FR-009-2 |
| T-25 | 성능 측정 (500건, 20회, p95) | NFR-007 | T-23 | AC-NFR-007-1 |

## 3단계 — Supabase Auth

| ID | 작업 | 관련 ID | 선행 | 완료 조건 |
| --- | --- | --- | --- | --- |
| T-40 | 로그인 방식 결정 (spec-review Q-01) | FR-007 | - | 결정 기록 |
| T-41 | `AUTH_MODE=supabase`: JWT 검증(JWKS), `sub` → `user_id`. `core/auth.py`만 교체 | FR-007, NFR-004 | T-40 | AC-FR-007-4 |
| T-42 | 프론트: Supabase Auth 클라이언트, 로그인·로그아웃 화면, access token 전송, 401 처리 | FR-007, FR-011 | T-41 | AC-FR-007-4 (화면 흐름) |
| T-43 | `0004_user_id_to_uuid.sql` 적용 (dev 데이터 건수 확인 후 삭제 승인) | FR-008 | T-41 | AC-FR-008-4 재통과 |

## 4단계 — 배포

| ID | 작업 | 관련 ID | 선행 | 완료 조건 |
| --- | --- | --- | --- | --- |
| T-50 | 백엔드 Vercel 설정(`vercel.json`, `api/index.py`, `.python-version`)과 환경 변수 등록 | NFR-005 | T-23 | - |
| T-51 | 프론트 Vercel 배포, `VITE_API_BASE_URL` 설정, 백엔드 `CORS_ORIGINS` 갱신 | NFR-005 | T-50 | AC-NFR-005-1 |
| T-52 | 보안 점검: 프론트 번들에 Secret Key가 없는지, `AUTH_MODE=supabase`인지 확인. **3단계가 끝나기 전에는 공개 배포 금지** (PRD D-4) | NFR-004 | T-43, T-51 | AC-NFR-004-2, AC-NFR-004-4 |

## 기능 추가 — 마감일 (FR-012, v2.1)

1단계 구조(In-Memory) 위에 추가한다. DB 반영은 2단계 T-21/T-22에 포함되며 별도 승인 없이 실행하지 않는다.

| ID | 작업 | 관련 ID | 선행 | 완료 조건 |
| --- | --- | --- | --- | --- |
| T-60 | 백엔드: 모델·스키마에 `due_date` 추가, 2-4절 검증, PATCH에서 생략(유지)과 `null`(삭제) 구분 | FR-012 | T-16 | AC-FR-012-1~4 |
| T-61 | 백엔드 테스트: AC-FR-012-1~4 + 기존 CRUD 회귀 | FR-012, NFR-009 | T-60 | AC-NFR-009-2 |
| T-62 | 프론트: `Todo.dueDate`, DTO 변환, 추가 폼 날짜 입력, 카드 마감 표시(오늘·지남), 편집 모드 날짜 수정·지우기 | FR-012, NFR-001, NFR-002 | T-60 | AC-FR-012-5~7 |
| T-63 | 프론트: 마감일 수정도 낙관적 업데이트 + 서버 확인 값 롤백 | FR-012, NFR-006 | T-62 | AC-FR-012-8 |
| T-64 | UI 회귀 검증(E2E, 390px·340px, 다크 모드), `ui-guidelines.md` 갱신 | FR-012, NFR-008 | T-62, T-63 | AC-FR-012-5~8, AC-NFR-002-* |

## 기능 추가 — 카테고리·필터 (FR-013, FR-014, v2.2)

마감일과 같이 1단계 구조(In-Memory) 위에 추가한다. DB 반영은 T-21/T-22에 포함되며 별도 승인 없이 실행하지 않는다.

| ID | 작업 | 관련 ID | 선행 | 완료 조건 |
| --- | --- | --- | --- | --- |
| T-70 | 백엔드: 모델·스키마에 `category` 추가(기본 `personal`, 2-5절 검증), `GET ?category=` 필터, 저장소 `list_by_user`에 카테고리 조건 | FR-013, FR-014, FR-008 | T-60 | AC-FR-013-1~3, AC-FR-014-1~3 |
| T-71 | 백엔드 테스트: AC-FR-013-1~3, AC-FR-014-1~3 + 기존 CRUD·마감일 회귀 | FR-013, FR-014, NFR-009 | T-70 | AC-NFR-009-2 |
| T-72 | 프론트: `Todo.category`, DTO 변환, 추가·편집 폼 카테고리 선택, 카드 카테고리 표시, 카테고리 수정 롤백 | FR-013, NFR-001, NFR-006 | T-70 | AC-FR-013-4~5 |
| T-73 | 프론트: 카테고리 필터(개수, `aria-pressed`), 필터 기준 완료율·빈 상태, 필터별 추가 기본값 | FR-014, FR-006 | T-72 | AC-FR-014-4~6 |
| T-74 | UI 회귀 검증(E2E, 390px·340px, 다크 모드), `ui-guidelines.md` 갱신 | FR-013, FR-014, NFR-008 | T-72, T-73 | AC-FR-013-4~5, AC-FR-014-4~6, AC-NFR-002-* |

## 기능 추가 — 우선순위·정렬 (FR-015, FR-016, v2.4)

카테고리와 같이 1단계 구조(In-Memory) 위에 추가한다. DB 반영은 T-21/T-22에 포함되며 별도 승인 없이 실행하지 않는다. 배포는 백엔드를 먼저 한다(spec-review R-42).

| ID | 작업 | 관련 ID | 선행 | 완료 조건 |
| --- | --- | --- | --- | --- |
| T-80 | 백엔드: 모델·스키마에 `priority` 추가(기본 `medium`, 2-6절 검증, PATCH 생략=유지·`null`=422), 서비스·라우터 전달. 목록 순서는 생성순 유지 | FR-015, FR-016 | T-70 | AC-FR-015-1~4, AC-FR-016-1 |
| T-81 | 백엔드 테스트: AC-FR-015-1~4, AC-FR-016-1 + 응답 키 집합, 기존 CRUD·마감일·카테고리 회귀 | FR-015, FR-016, NFR-009 | T-80 | AC-NFR-009-2 |
| T-82 | 프론트: `src/priorities.ts`, `Todo.priority`, DTO 변환, 추가·편집 폼 우선순위 선택, 카드 우선순위 표시, 우선순위 수정 롤백 | FR-015, NFR-001, NFR-006 | T-80 | AC-FR-015-5~6 |
| T-83 | 프론트: `visibleTodos = sortByPriority(filteredTodos)` 파생 정렬(상태 저장 없음), 완료율 칸 순서, 카드 이동 후 포커스 | FR-016, FR-006, NFR-003 | T-82 | AC-FR-016-2~6 |
| T-84 | UI 회귀 검증(E2E, Tab 순서, 390px·340px, 다크 모드) | FR-015, FR-016, NFR-002, NFR-003, NFR-008 | T-82, T-83 | AC-FR-015-5~6, AC-FR-016-2~6, AC-NFR-002-*, AC-NFR-003-4 |
| T-85 | 문서 갱신: PRD v2.4, api-spec, db-schema, AC, spec-review(R-36~R-42), ui-guidelines, CLAUDE.md | FR-015, FR-016 | T-80 | spec-review 9절 |

## 기능 추가 — 완료 상태 필터 (FR-017, v2.5)

화면 전용 기능이다(PRD D-13). API·DB 변경이 없어 백엔드 작업과 배포 순서 제약이 없다.

| ID | 작업 | 관련 ID | 선행 | 완료 조건 |
| --- | --- | --- | --- | --- |
| T-90 | 프론트: `src/statuses.ts`(타입·라벨·`matchesStatus`·`countByStatus`), `StatusFilter` 컴포넌트, `App`의 `statusFilter` 상태와 AND 파생 목록(`categoryTodos` → `filteredTodos` → `visibleTodos`), 카테고리 기준 완료율(`progressTodos`) | FR-017, FR-006 | T-83 | AC-FR-017-1~4 |
| T-91 | 프론트: 상태 필터에서 토글 시 입력창 포커스, "완료" 필터에서 추가 시 "전체"로 복귀, 조합별 빈 상태 문구 | FR-017, NFR-003 | T-90 | AC-FR-017-5~6 |
| T-92 | 회귀 검증: `pytest` 전체(API 변경 없음 확인), UI E2E(CRUD·카테고리·우선순위·마감일·Tab 순서), 390px·340px, 다크 모드 | FR-017, NFR-002, NFR-003, NFR-008, NFR-009 | T-90, T-91 | AC-FR-017-1~6, AC-NFR-003-4, AC-NFR-009-* |
| T-93 | 문서 갱신: PRD v2.5, api-spec, AC, spec-review(R-43~R-46), ui-guidelines, CLAUDE.md | FR-017 | T-90 | spec-review 8·9절 |

## 요구사항 → Task 추적표

| ID | Task |
| --- | --- |
| FR-001 | T-16, T-32 |
| FR-002 | T-14, T-16, T-23, T-31 |
| FR-003 | T-15, T-16, T-33 |
| FR-004 | T-15, T-16, T-33 |
| FR-005 | T-15, T-16, T-34 |
| FR-006 | T-35 (현재 구현 회귀 검증) |
| FR-007 | T-12, T-30, T-40~T-42 |
| FR-008 | T-15, T-21, T-23, T-24, T-43 |
| FR-009 | T-14, T-20~T-24 |
| FR-010 | T-13, T-21 |
| FR-011 | T-31, T-32, T-42 |
| FR-012 | T-21, T-60~T-64 |
| FR-013 | T-21, T-70~T-72, T-74 |
| FR-014 | T-70, T-71, T-73, T-74 |
| FR-015 | T-21, T-80~T-82, T-84, T-85 |
| FR-016 | T-80, T-81, T-83~T-85 |
| FR-017 | T-90~T-93 |
| NFR-001~003 | T-01, T-35, T-84, T-92 |
| NFR-004 | T-02, T-10, T-21, T-23, T-41, T-52 |
| NFR-005 | T-16, T-50, T-51 |
| NFR-006 | T-11, T-30, T-33, T-34 |
| NFR-007 | T-25 |
| NFR-008 | T-31, T-35 |
| NFR-009 | T-10, T-17, T-24, T-35 |

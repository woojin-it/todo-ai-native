# todo-ai-native

React, FastAPI, Supabase, Vercel로 만드는 ToDo List 웹 애플리케이션입니다.

> 현재 상태: **프론트엔드만 동작합니다.** React + Vite 화면에서 할 일 추가·조회·수정·삭제·완료 토글을 할 수 있지만,
> 목록은 React 상태에만 있어 **새로고침하면 사라집니다.** `backend/`, `supabase/`는 아직 빈 디렉터리입니다.

## 실행 방법

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # 타입 검사(tsc -b) + 프로덕션 빌드
npm run lint      # oxlint (경고 0건 유지)
```

## 프로젝트 목적

- 할 일을 추가, 조회, 수정, 완료 처리, 삭제(CRUD)할 수 있는 ToDo List 서비스를 만듭니다.
- 프론트엔드(React)와 백엔드(FastAPI)를 나누고, 데이터 저장과 사용자 인증은 Supabase에 맡깁니다.
- 각 사용자는 자기 할 일만 보고 수정할 수 있어야 합니다(서버 측 소유자 검사 + Supabase RLS).
- Vercel에 배포해 브라우저에서 바로 쓸 수 있게 합니다.
- 작은 단위의 브랜치와 커밋으로 기능을 하나씩 추가합니다. 요구사항과 작업 순서는 `docs/`를 따릅니다.

## 기술 스택

| 영역 | 기술 | 역할 |
| --- | --- | --- |
| Frontend | React + TypeScript, Vite | 사용자 화면, 백엔드 API 호출 |
| Backend | FastAPI (Python), Pydantic | REST API(`/api/*`), 입력 검증, 비즈니스 로직 |
| Database / Auth | Supabase (PostgreSQL, Supabase Auth, RLS) | 할 일 데이터 저장, 사용자 인증 |
| Deployment | Vercel | 프론트엔드 정적 호스팅, FastAPI 서버리스 함수 |
| Test / Lint | pytest, Ruff / oxlint | 백엔드 테스트·린트, 프론트엔드 린트 |

## 초기 디렉터리 구조

```text
todo-ai-native/
├── frontend/                # React 앱 (Vite) — React 상태만으로 CRUD 동작
├── backend/                 # FastAPI 앱 — 비어 있음, 1단계에서 생성
├── supabase/                # DB 마이그레이션 SQL — 비어 있음, 2단계에서 생성
├── docs/                    # 설계 문서
│   ├── prd.md               # 요구사항 (FR-xxx, NFR-xxx)과 설계 결정
│   ├── api-spec.md          # API 엔드포인트, 에러 포맷
│   ├── db-schema.md         # todos 테이블, RLS·권한
│   ├── acceptance-criteria.md  # 수용 기준 (AC-xxx)
│   ├── tasks.md             # 단계별 구현 작업 (T-xx)
│   ├── spec-review.md       # 명세 검토 결과, 결정 필요 항목
│   └── ui-guidelines.md     # 디자인 토큰, UI·접근성 규칙
├── lession/                 # 학습 자료 (강의 문서, 예제 설정)
├── vercel.json              # Vercel 라우팅: /api/* → backend, 그 외 → frontend
├── .gitignore
├── CLAUDE.md                # Claude Code 작업 지침
└── README.md
```

기능을 구현하면서 만들 하위 구조(계획)는 다음과 같습니다.

```text
frontend/                    # (구현됨, api/는 백엔드 연동 때 추가)
├── index.html
├── public/favicon.svg
└── src/
    ├── main.tsx             # 진입점 (StrictMode)
    ├── App.tsx              # todos 상태, 추가·토글·수정·삭제, 화면 구성
    ├── types.ts             # Todo { id, text, completed }
    ├── todoText.ts          # 텍스트 검증 (trim 후 1~100자, 서버와 같은 문구)
    ├── index.css            # 디자인 토큰 + 전체 스타일
    ├── components/          # TodoInput(입력 폼), TodoItem(작업 카드·인라인 편집)
    └── api/                 # (예정) 백엔드 API 호출

backend/
├── app/
│   ├── main.py              # FastAPI 앱 생성
│   ├── routers/             # HTTP 입출력 (todos)
│   ├── schemas/             # Pydantic 요청/응답 모델
│   ├── services/            # 비즈니스 규칙 (소유권 검사 등)
│   ├── repositories/        # 저장소 (In-Memory → Supabase)
│   ├── models/              # 도메인 모델
│   └── core/                # 설정, 인증, 공통 에러
├── tests/                   # pytest
└── requirements.txt

supabase/
└── migrations/              # 0001_create_todos.sql 등
```

## 브랜치 전략

- `main`: 배포 가능한 안정 브랜치
- `feature/*`: 기능 개발 브랜치

> 현재 이 디렉터리는 **아직 Git 저장소로 초기화되지 않았습니다**(`.git` 없음). `git init` 후 `main` 브랜치에서 시작합니다.

## 다음 단계

1. Git 저장소 초기화와 첫 커밋
2. `docs/tasks.md`의 1단계: FastAPI 백엔드(In-Memory 저장소) + React 프론트엔드 연동 (프론트 화면은 완료)
3. 2단계: Supabase 테이블·RLS 적용과 저장소 교체
4. 3단계: Supabase Auth 로그인
5. Vercel 배포

# DB 스키마 (Supabase / PostgreSQL)

| 항목 | 내용 |
| --- | --- |
| 문서 버전 | v2.4 (2026-11-24) |
| 기준 문서 | [prd.md](./prd.md), [api-spec.md](./api-spec.md) |
| 연관 문서 | [acceptance-criteria.md](./acceptance-criteria.md), [tasks.md](./tasks.md) |
| 마이그레이션 위치 | `supabase/migrations/` (파일 번호 순서대로 SQL Editor에서 실행) |
| 대상 프로젝트 | `vibedb` (식별자와 기존 테이블은 아직 확인하지 못함, T-20) |

## 1. 개요

앱이 소유하는 테이블은 `public.todos` 하나다. 스키마는 인증 단계(PRD D-1)에 따라 두 단계로 바뀐다.

| 단계 | `user_id` | `auth.users` 연결 | 이유 |
| --- | --- | --- | --- |
| 2단계 (dev 인증) | `text` | 없음 | dev 토큰은 UUID가 아니다 (PRD D-3) |
| 3단계 (Supabase Auth) | `uuid` | FK, `on delete cascade` | JWT `sub`가 `auth.users.id`다 |

```text
auth.users (Supabase 관리, 직접 수정하지 않음)
    │ 1          ※ 3단계부터 연결
    │
    │ N
public.todos
```

## 2. `public.todos` (2단계)

| 컬럼 | 타입 | 제약 | 관련 ID |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, `default gen_random_uuid()` | FR-001 |
| `user_id` | `text` | NOT NULL, 1~128자 | FR-007, FR-008 |
| `text` | `text` | NOT NULL, 공백만 불가, 100자 이하 | FR-010 |
| `completed` | `boolean` | NOT NULL, `default false` | FR-003 |
| `due_date` | `date` | NULL 허용(마감일 없음), 2000-01-01~2100-12-31 | FR-012 |
| `category` | `text` | NOT NULL, `default 'personal'`, `work`·`personal`·`study` 중 하나 | FR-013, FR-014 |
| `priority` | `text` | NOT NULL, `default 'medium'`, `high`·`medium`·`low` 중 하나 | FR-015, FR-016 |
| `created_at` | `timestamptz` | NOT NULL, `default now()` | FR-002 |
| `updated_at` | `timestamptz` | NOT NULL, `default now()`, 트리거로 갱신 | FR-004 |

### 2-1. `0001_create_todos.sql`

```sql
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  text text not null,
  completed boolean not null default false,
  due_date date,
  category text not null default 'personal',
  priority text not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint todos_user_id_length check (char_length(user_id) between 1 and 128),
  constraint todos_text_not_blank check (char_length(btrim(text, E' \t\r\n')) > 0),
  constraint todos_text_max_length check (char_length(text) <= 100),
  constraint todos_due_date_range check (due_date between date '2000-01-01' and date '2100-12-31'),
  constraint todos_category_valid check (category in ('work', 'personal', 'study')),
  constraint todos_priority_valid check (priority in ('high', 'medium', 'low'))
);

-- 본인 목록을 생성 순서로 조회 (FR-002, NFR-007)
create index if not exists todos_user_id_created_at_idx
  on public.todos (user_id, created_at, id);

-- updated_at 자동 갱신 (FR-004)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists todos_set_updated_at on public.todos;
create trigger todos_set_updated_at
  before update on public.todos
  for each row execute function public.set_updated_at();
```

- `due_date`는 시각 없는 `date` 타입이다(PRD D-8). `timestamptz`를 쓰면 UTC 변환 때문에 날짜가 하루 밀릴 수 있다.
- **v2.1 변경 이력**: `due_date` 컬럼과 범위 제약을 `0001`에 추가했다. `0001`은 아직 어떤 DB에도 적용하지 않았으므로(T-22 미착수) 별도 마이그레이션을 만들지 않았다. 이미 적용된 환경이 있다면 `alter table public.todos add column due_date date` + 제약 추가로 처리한다.
- **v2.3 변경 이력**: `todos_text_max_length`를 500 → 100자로 줄였다(문서만). 저장소의 `supabase/migrations/0001_create_todos.sql`은 아직 `varchar(500)`이고 `due_date`·`category`도 없어 이 문서와 다르다. T-21/T-22에서 승인을 받아 맞춘다. 이미 적용된 DB라면 101자 이상 행을 먼저 확인한 뒤 `alter table public.todos drop constraint if exists todos_text_max_length, add constraint todos_text_max_length check (char_length(text) <= 100)`으로 처리한다.
- **v2.2 변경 이력**: `category` 컬럼과 `todos_category_valid` 제약을 `0001`에 추가했다. 같은 이유로 별도 마이그레이션을 만들지 않았다. 이미 적용된 환경이라면 아래 SQL로 처리한다. `default 'personal'`과 `not null`을 한 문장에 넣으면 기존 행이 모두 `personal`로 채워지고 마감일 등 다른 값은 그대로 남는다.

  ```sql
  alter table public.todos
    add column if not exists category text not null default 'personal',
    add constraint todos_category_valid check (category in ('work', 'personal', 'study'));
  ```

- **v2.4 변경 이력**: `priority` 컬럼과 `todos_priority_valid` 제약을 `0001`에 추가했다(문서만, PRD D-11). 저장소의 `supabase/migrations/*.sql`은 이번 작업에서 바꾸지 않았고, T-21/T-22에서 승인을 받아 맞춘다. 이미 적용된 환경이라면 아래 SQL로 처리한다. `default 'medium'`과 `not null`을 한 문장에 넣으면 기존 행이 모두 `medium`으로 채워지고 다른 값은 그대로 남는다(기존 데이터 보존).

  ```sql
  alter table public.todos
    add column if not exists priority text not null default 'medium',
    add constraint todos_priority_valid check (priority in ('high', 'medium', 'low'));
  ```

- 우선순위 정렬은 브라우저에서 하므로(PRD D-12) 우선순위 인덱스는 만들지 않는다. 조회 순서는 기존 `(user_id, created_at, id)` 인덱스를 그대로 쓴다.
- 카테고리 필터 전용 인덱스는 만들지 않는다. 조회는 항상 `user_id`로 먼저 좁히고, 화면은 전체 목록을 받아 거르므로(PRD D-10) 기존 `(user_id, created_at, id)` 인덱스로 충분하다.
- `text` 타입에 `char_length` 제약을 건 것은 `varchar(100)`보다 오류 원인(공백/길이)을 제약 이름으로 구분하기 쉽기 때문이다.
- 서버 검증(api-spec 2-3)이 1차 방어선이고, 이 제약은 API를 우회한 쓰기에 대한 최종 방어선이다.
- `updated_at`은 Supabase 저장소에서는 트리거가 정한다. In-Memory 저장소에서는 서비스 계층이 직접 갱신한다(테스트에서 `clock` 주입).

## 3. 권한과 RLS (FR-008, NFR-004)

### 3-1. `0002_enable_rls.sql`

```sql
alter table public.todos enable row level security;

-- 2단계: auth.uid()는 uuid이므로 text로 바꿔 비교한다.
create policy todos_select_own on public.todos
  for select to authenticated using ((select auth.uid())::text = user_id);
create policy todos_insert_own on public.todos
  for insert to authenticated with check ((select auth.uid())::text = user_id);
create policy todos_update_own on public.todos
  for update to authenticated
  using ((select auth.uid())::text = user_id)
  with check ((select auth.uid())::text = user_id);
create policy todos_delete_own on public.todos
  for delete to authenticated using ((select auth.uid())::text = user_id);
```

### 3-2. `0003_grant_service_role.sql`

```sql
-- 백엔드(Secret Key = service_role)가 PostgREST로 접근할 권한
grant select, insert, update, delete on public.todos to service_role;

-- 브라우저용 키(anon)로는 직접 접근하지 못하게 한다
revoke all on public.todos from anon;
```

- `service_role`은 RLS를 우회한다. 따라서 소유자 격리의 1차 책임은 백엔드 코드에 있다(api-spec 1-1).
- RLS 정책은 앞으로 프론트가 Supabase 클라이언트로 직접 접근하는 경우에 대비한 안전망이다.
- `0003`이 빠지면 API가 `permission denied`로 500을 반환할 수 있다.

## 4. 요구사항 ↔ 스키마

| ID | 스키마 요소 |
| --- | --- |
| FR-001 | INSERT, `id` 기본값, `completed` 기본값 |
| FR-002 | `(user_id, created_at, id)` 인덱스 |
| FR-003 | `completed` UPDATE |
| FR-004 | `text` UPDATE, `todos_set_updated_at` 트리거 |
| FR-005 | DELETE |
| FR-007, FR-008 | `user_id` 컬럼, RLS 정책 4개, `anon` 권한 회수 |
| FR-009 | 테이블 자체 |
| FR-010 | `todos_text_not_blank`, `todos_text_max_length` |
| FR-012 | `due_date` 컬럼, `todos_due_date_range` |
| FR-013, FR-014 | `category` 컬럼, `todos_category_valid` |
| FR-015, FR-016 | `priority` 컬럼, `todos_priority_valid` (정렬용 인덱스 없음, D-12) |
| NFR-004 | 3절 전체 |
| NFR-007 | 인덱스 |

## 5. 3단계 전환: `0004_user_id_to_uuid.sql` (초안)

3단계(Supabase Auth) 착수 시 적용한다. dev 데이터는 테스트용이므로 이전하지 않는다(PRD 10절).

```sql
-- 1) UUID 형식이 아닌 dev 데이터 삭제 (실행 전 건수 확인 필수)
delete from public.todos
where user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 2) 정책이 컬럼을 참조하므로 먼저 삭제
drop policy todos_select_own on public.todos;
drop policy todos_insert_own on public.todos;
drop policy todos_update_own on public.todos;
drop policy todos_delete_own on public.todos;

-- 3) 타입 변경 + FK
alter table public.todos drop constraint todos_user_id_length;
alter table public.todos alter column user_id type uuid using user_id::uuid;
alter table public.todos
  add constraint todos_user_id_fkey foreign key (user_id)
  references auth.users (id) on delete cascade;

-- 4) 정책 재생성 (형 변환 없이 비교)
create policy todos_select_own on public.todos
  for select to authenticated using ((select auth.uid()) = user_id);
-- insert / update / delete도 같은 형태로 재생성
```

## 6. 범위 밖 (기록용)

- 사용자 지정 정렬 → `position` 컬럼 (PRD 4-2)
- 휴지통(소프트 삭제) → `deleted_at` 컬럼

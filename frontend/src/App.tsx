import { useRef, useState } from 'react'
import type { Todo, TodoChanges } from './types.ts'
import type { Priority } from './priorities.ts'
import { countByStatus, matchesStatus } from './statuses.ts'
import type { StatusFilter as StatusFilterValue } from './statuses.ts'
import TodoInput from './components/TodoInput.tsx'
import TodoItem from './components/TodoItem.tsx'
import ProgressRing from './components/ProgressRing.tsx'
import StatCard from './components/StatCard.tsx'
import StatusFilter from './components/StatusFilter.tsx'
import EmptyState from './components/EmptyState.tsx'

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

/** 현지 날짜를 YYYY-MM-DD로 만든다. toISOString()은 UTC라 쓰지 않는다. */
function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** 필터 결과가 비었을 때의 안내 문구 (상태 필터가 원인인지에 따라 다르다) */
const EMPTY_MESSAGES: Record<StatusFilterValue, { title: string; description: string }> = {
  all: {
    title: '아직 할 일이 없습니다',
    description: '위 입력창에 할 일을 적고 Enter를 누르면 여기에 표시됩니다.',
  },
  active: {
    title: '진행 중인 할 일이 없습니다',
    description: '모두 완료했습니다. 새 할 일을 추가하면 여기에 표시됩니다.',
  },
  done: {
    title: '완료한 할 일이 없습니다',
    description: '할 일을 체크하면 여기에 모입니다.',
  },
}

/**
 * My ToDo 대시보드. 할 일 목록은 이 컴포넌트의 React 상태에만 있다.
 * 백엔드·DB 연동 전 단계라 새로고침하면 목록이 사라진다.
 * 데스크톱은 2열(왼쪽 오늘의 진행, 오른쪽 오늘의 작업), 모바일은 1열.
 */
export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all')
  // 렌더링 중 new Date()를 호출하지 않도록 초기화 함수로 한 번만 만든다
  const [today] = useState(() => new Date())
  const inputRef = useRef<HTMLInputElement>(null)

  // 파생 값: 상태로 따로 저장하지 않고 todos와 필터에서 계산한다
  const counts = countByStatus(todos)
  const visibleTodos = todos.filter((todo) => matchesStatus(todo, statusFilter))

  // 추가: 목록 끝에 미완료 상태로 붙인다 (FR-001, FR-015)
  function addTodo(text: string, priority: Priority) {
    const newTodo: Todo = { id: crypto.randomUUID(), text, completed: false, priority }
    setTodos((prev) => [...prev, newTodo])
    // "완료" 필터에서는 새 할 일이 보이지 않으므로 "전체"로 되돌린다 (FR-017)
    if (statusFilter === 'done') setStatusFilter('all')
  }

  // 완료 토글 (FR-003)
  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    )
    // "진행 중"·"완료" 필터에서는 카드가 목록에서 빠지므로 입력창으로 포커스를 옮긴다 (NFR-003)
    if (statusFilter !== 'all') inputRef.current?.focus()
  }

  // 수정: 바뀐 필드만 반영한다 (FR-004, FR-015)
  function updateTodo(id: string, changes: TodoChanges) {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, ...changes } : todo)))
  }

  // 삭제 후 새 할 일 입력창으로 포커스를 옮긴다 (FR-005, NFR-003)
  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
    inputRef.current?.focus()
  }

  const emptyMessage = EMPTY_MESSAGES[todos.length === 0 ? 'all' : statusFilter]

  return (
    <main className="app">
      <div className="sidebar">
        <header className="app-header">
          <h1 className="app-title">My ToDo</h1>
          <time className="app-date" dateTime={toDateKey(today)}>
            {dateFormatter.format(today)}
          </time>
        </header>

        <section className="overview" aria-labelledby="overview-title">
          <h2 id="overview-title" className="sr-only">
            오늘의 진행
          </h2>
          <ProgressRing todos={todos} />
          <dl className="stats">
            <StatCard label="전체" value={counts.all} />
            <StatCard label="완료" value={counts.done} marker="done" />
            <StatCard label="미완료" value={counts.active} marker="active" />
          </dl>
        </section>
      </div>

      <section className="tasks" aria-labelledby="tasks-title">
        <h2 id="tasks-title" className="section-title">
          오늘의 작업
        </h2>

        <TodoInput onAdd={addTodo} inputRef={inputRef} />

        <StatusFilter value={statusFilter} onChange={setStatusFilter} />

        {visibleTodos.length === 0 ? (
          <EmptyState title={emptyMessage.title} description={emptyMessage.description} />
        ) : (
          <ul className="todo-list" aria-labelledby="tasks-title">
            {visibleTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onUpdate={updateTodo}
                onDelete={deleteTodo}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

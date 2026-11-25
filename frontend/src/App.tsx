import { useRef, useState } from 'react'
import type { Todo } from './types.ts'
import TodoInput from './components/TodoInput.tsx'
import TodoItem from './components/TodoItem.tsx'

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

/**
 * My ToDo 화면. 할 일 목록은 이 컴포넌트의 React 상태에만 있다.
 * 백엔드·DB 연동 전 단계라 새로고침하면 목록이 사라진다.
 */
export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  // 렌더링 중 new Date()를 호출하지 않도록 초기화 함수로 한 번만 만든다
  const [today] = useState(() => new Date())
  const inputRef = useRef<HTMLInputElement>(null)

  // 추가: 목록 끝에 미완료 상태로 붙인다 (FR-001)
  function addTodo(text: string) {
    const newTodo: Todo = { id: crypto.randomUUID(), text, completed: false }
    setTodos((prev) => [...prev, newTodo])
  }

  // 완료 토글 (FR-003)
  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    )
  }

  // 텍스트 수정 (FR-004)
  function updateTodo(id: string, text: string) {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, text } : todo)))
  }

  // 삭제 후 새 할 일 입력창으로 포커스를 옮긴다 (FR-005, NFR-003)
  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
    inputRef.current?.focus()
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">My ToDo</h1>
        <time className="app-date" dateTime={toDateKey(today)}>
          {dateFormatter.format(today)}
        </time>
      </header>

      <TodoInput onAdd={addTodo} inputRef={inputRef} />

      {todos.length === 0 ? (
        <p className="empty-state">할 일이 없습니다. 위 입력창에 할 일을 적고 Enter를 누르세요.</p>
      ) : (
        <ul className="todo-list" aria-label="할 일 목록">
          {todos.map((todo) => (
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
    </main>
  )
}

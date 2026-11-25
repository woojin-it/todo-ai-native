import { useState } from 'react'
import type { ChangeEvent, FormEvent, RefObject } from 'react'
import { validateTodoText, visibleTextError } from '../todoText.ts'
import { DEFAULT_PRIORITY, PRIORITIES, PRIORITY_LABELS, parsePriority } from '../priorities.ts'
import type { Priority } from '../priorities.ts'

interface TodoInputProps {
  /** 검증을 통과한(앞뒤 공백 제거된) 텍스트와 우선순위로 할 일을 추가한다. */
  onAdd: (text: string, priority: Priority) => void
  /** 삭제 후 포커스 이동에 쓰도록 App이 넘겨 주는 입력창 ref (NFR-003) */
  inputRef: RefObject<HTMLInputElement | null>
}

/**
 * 새 할 일 입력 폼 (FR-001, FR-015). 1줄 입력창, 2줄 우선순위 + 추가 버튼.
 * Tab 순서: 입력 → 우선순위 → 추가. 잘못된 입력이면 버튼을 막지 않고 제출 시 이유를 보여 준다.
 */
export default function TodoInput({ onAdd, inputRef }: TodoInputProps) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<Priority>(DEFAULT_PRIORITY)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const error = visibleTextError(text, submitAttempted)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // 추가 버튼으로 제출해도 포커스는 입력창에 둔다 (NFR-003)
    inputRef.current?.focus()

    if (validateTodoText(text) !== null) {
      setSubmitAttempted(true)
      return
    }
    onAdd(text.trim(), priority)
    // 텍스트만 비우고 우선순위는 유지한다 (연속 입력 편의)
    setText('')
    setSubmitAttempted(false)
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="new-todo" className="sr-only">
        새 할 일
      </label>
      <input
        id="new-todo"
        ref={inputRef}
        className="text-input"
        type="text"
        placeholder="할 일을 입력하세요"
        autoComplete="off"
        value={text}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.target.value)}
        aria-invalid={error !== null}
        aria-describedby={error !== null ? 'new-todo-error' : undefined}
      />
      {error !== null && (
        <p id="new-todo-error" className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-row">
        <div className="field">
          <label htmlFor="new-todo-priority" className="field-label">
            우선순위
          </label>
          <select
            id="new-todo-priority"
            className="select-input"
            value={priority}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setPriority(parsePriority(event.target.value))}
          >
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-add">
          추가
        </button>
      </div>
    </form>
  )
}

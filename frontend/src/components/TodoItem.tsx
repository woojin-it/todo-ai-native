import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import type { Todo, TodoChanges } from '../types.ts'
import { validateTodoText, visibleTextError } from '../todoText.ts'
import { PRIORITIES, PRIORITY_LABELS, parsePriority } from '../priorities.ts'
import type { Priority } from '../priorities.ts'
import PriorityBadge from './PriorityBadge.tsx'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onUpdate: (id: string, changes: TodoChanges) => void
  onDelete: (id: string) => void
}

/** 작업 카드: 완료 토글(FR-003), 우선순위 배지(FR-015), 인라인 편집(FR-004), 삭제(FR-005) */
export default function TodoItem({ todo, onToggle, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)
  const [draftPriority, setDraftPriority] = useState<Priority>(todo.priority)
  const [saveAttempted, setSaveAttempted] = useState(false)

  const editButtonRef = useRef<HTMLButtonElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  // 편집을 끝낸 직후에만 "수정" 버튼으로 포커스를 되돌린다 (NFR-003)
  const returnFocus = useRef(false)

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    } else if (returnFocus.current) {
      returnFocus.current = false
      editButtonRef.current?.focus()
    }
  }, [isEditing])

  const checkboxId = `todo-${todo.id}`
  const editInputId = `edit-${todo.id}`
  const editPriorityId = `edit-priority-${todo.id}`
  const errorId = `edit-error-${todo.id}`
  const error = visibleTextError(draft, saveAttempted)

  function startEditing() {
    setDraft(todo.text)
    setDraftPriority(todo.priority)
    setSaveAttempted(false)
    setIsEditing(true)
  }

  function finishEditing() {
    returnFocus.current = true
    setIsEditing(false)
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (validateTodoText(draft) !== null) {
      setSaveAttempted(true)
      editInputRef.current?.focus()
      return
    }
    // 바뀐 필드만 모은다. 바뀐 것이 없으면 갱신하지 않는다 (FR-004)
    const changes: TodoChanges = {}
    const nextText = draft.trim()
    if (nextText !== todo.text) changes.text = nextText
    if (draftPriority !== todo.priority) changes.priority = draftPriority
    if (Object.keys(changes).length > 0) {
      onUpdate(todo.id, changes)
    }
    finishEditing()
  }

  // 편집 중 Esc는 편집 취소 (FR-004). 입력창과 우선순위 선택 모두에서 처리한다
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      finishEditing()
    }
  }

  if (isEditing) {
    return (
      <li className="todo-item is-editing">
        <form className="edit-form" onSubmit={handleSave} noValidate>
          <label htmlFor={editInputId} className="sr-only">
            {`"${todo.text}" 수정`}
          </label>
          <input
            id={editInputId}
            ref={editInputRef}
            className="text-input edit-input"
            type="text"
            autoComplete="off"
            value={draft}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={error !== null}
            aria-describedby={error !== null ? errorId : undefined}
          />
          {error !== null && (
            <p id={errorId} className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-row">
            <div className="field">
              <label htmlFor={editPriorityId} className="field-label">
                우선순위
              </label>
              <select
                id={editPriorityId}
                className="select-input"
                value={draftPriority}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setDraftPriority(parsePriority(event.target.value))}
                onKeyDown={handleKeyDown}
              >
                {PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {PRIORITY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <div className="edit-actions">
              <button type="submit" className="btn btn-primary">
                저장
              </button>
              <button type="button" className="btn btn-ghost" onClick={finishEditing}>
                취소
              </button>
            </div>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className={todo.completed ? 'todo-item is-done' : 'todo-item'}>
      <input
        id={checkboxId}
        className="todo-check"
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <div className="todo-body">
        <label htmlFor={checkboxId} className="todo-text">
          {todo.text}
        </label>
        <div className="todo-meta">
          <PriorityBadge priority={todo.priority} />
        </div>
      </div>
      <div className="todo-actions">
        <button
          ref={editButtonRef}
          type="button"
          className="btn btn-ghost"
          onClick={startEditing}
          aria-label={`"${todo.text}" 수정`}
        >
          수정
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-danger"
          onClick={() => onDelete(todo.id)}
          aria-label={`"${todo.text}" 삭제`}
        >
          삭제
        </button>
      </div>
    </li>
  )
}

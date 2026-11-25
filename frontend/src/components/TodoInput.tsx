import { useState } from 'react'
import type { ChangeEvent, FormEvent, RefObject } from 'react'
import { validateTodoText, visibleTextError } from '../todoText.ts'

interface TodoInputProps {
  /** 검증을 통과한(앞뒤 공백 제거된) 텍스트로 할 일을 추가한다. */
  onAdd: (text: string) => void
  /** 삭제 후 포커스 이동에 쓰도록 App이 넘겨 주는 입력창 ref (NFR-003) */
  inputRef: RefObject<HTMLInputElement | null>
}

/** 새 할 일 입력 폼 (FR-001). 잘못된 입력이면 버튼을 막지 않고 제출 시 이유를 보여 준다. */
export default function TodoInput({ onAdd, inputRef }: TodoInputProps) {
  const [text, setText] = useState('')
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const error = visibleTextError(text, submitAttempted)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // 추가 버튼으로 제출해도 포커스는 입력창에 둔다 (NFR-003)
    inputRef.current?.focus()

    if (validateTodoText(text) !== null) {
      setSubmitAttempted(true)
      return
    }
    onAdd(text.trim())
    setText('')
    setSubmitAttempted(false)
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="new-todo" className="sr-only">
        새 할 일
      </label>
      <div className="todo-form-row">
        <input
          id="new-todo"
          ref={inputRef}
          className="text-input"
          type="text"
          placeholder="할 일을 입력하세요"
          autoComplete="off"
          value={text}
          onChange={handleChange}
          aria-invalid={error !== null}
          aria-describedby={error !== null ? 'new-todo-error' : undefined}
        />
        <button type="submit" className="btn btn-primary">
          추가
        </button>
      </div>
      {error !== null && (
        <p id="new-todo-error" className="field-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

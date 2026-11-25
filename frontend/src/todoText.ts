// 할 일 텍스트 검증 규칙 (FR-001, FR-004, FR-010).
// 문구와 기준은 docs/api-spec.md 2-3절(서버 검증)과 같게 유지한다.

export const TEXT_MAX_LENGTH = 100

export const EMPTY_TEXT_MESSAGE = '할 일 내용을 입력해 주세요.'
export const TOO_LONG_TEXT_MESSAGE = `할 일은 ${TEXT_MAX_LENGTH}자 이하로 입력해 주세요.`

/** 글자 수를 유니코드 코드 포인트 기준으로 센다(서버의 Python len과 같은 기준). */
export function countChars(text: string): number {
  return [...text].length
}

/** 앞뒤 공백을 제거한 텍스트가 규칙에 맞으면 null, 아니면 오류 문구를 돌려준다. */
export function validateTodoText(text: string): string | null {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return EMPTY_TEXT_MESSAGE
  }
  const length = countChars(trimmed)
  if (length > TEXT_MAX_LENGTH) {
    return `${TOO_LONG_TEXT_MESSAGE} (현재 ${length}자)`
  }
  return null
}

/**
 * 화면에 보여 줄 오류 문구.
 * 빈 값은 제출을 시도한 뒤에만, 100자 초과는 입력하는 즉시 보여 준다(ui-guidelines 입력 검증 오류).
 */
export function visibleTextError(text: string, submitAttempted: boolean): string | null {
  const error = validateTodoText(text)
  if (error === EMPTY_TEXT_MESSAGE && !submitAttempted) {
    return null
  }
  return error
}

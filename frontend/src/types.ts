import type { Priority } from './priorities.ts'

/** 할 일 한 건. 지금은 React 상태에만 있고 서버·DB에 저장하지 않는다. */
export interface Todo {
  id: string
  text: string
  completed: boolean
  /** 우선순위 (FR-015). 기본값은 'medium' */
  priority: Priority
}

/** 편집으로 바꿀 수 있는 필드. 바뀐 필드만 담는다 (FR-004, FR-015) */
export type TodoChanges = Partial<Pick<Todo, 'text' | 'priority'>>

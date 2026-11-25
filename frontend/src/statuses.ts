// 완료 상태 필터 (FR-017). 화면 전용이며 받아 둔 목록을 브라우저에서 거른다.
import type { Todo } from './types.ts'

export type StatusFilter = 'all' | 'active' | 'done'

export const STATUS_FILTERS: readonly StatusFilter[] = ['all', 'active', 'done']

export const STATUS_LABELS: Record<StatusFilter, string> = {
  all: '전체',
  active: '진행 중',
  done: '완료',
}

export function matchesStatus(todo: Todo, filter: StatusFilter): boolean {
  if (filter === 'active') return !todo.completed
  if (filter === 'done') return todo.completed
  return true
}

/** 통계 카드용 개수: 전체, 완료, 미완료 */
export function countByStatus(todos: Todo[]): Record<StatusFilter, number> {
  const done = todos.filter((todo) => todo.completed).length
  return { all: todos.length, active: todos.length - done, done }
}

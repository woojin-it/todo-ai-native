// 우선순위 (FR-015). 값은 서버 API와 같은 영문 코드, 화면 라벨은 한국어.

export type Priority = 'high' | 'medium' | 'low'

/** 선택 상자·배지에 쓰는 순서: 높음 → 보통 → 낮음 */
export const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low']

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

export const DEFAULT_PRIORITY: Priority = 'medium'

/** select 값 같은 문자열을 Priority로 좁힌다. 모르는 값이면 기본값 */
export function parsePriority(value: string): Priority {
  return (PRIORITIES as readonly string[]).includes(value) ? (value as Priority) : DEFAULT_PRIORITY
}

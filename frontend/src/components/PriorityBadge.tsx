import { PRIORITY_LABELS } from '../priorities.ts'
import type { Priority } from '../priorities.ts'

interface PriorityBadgeProps {
  priority: Priority
}

/**
 * 우선순위 배지 (FR-015). 색과 함께 "높음" 같은 글자로 상태를 말한다(색만으로 구분하지 않음).
 * 스크린 리더는 "우선순위 높음"으로 읽는다.
 */
export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`priority-badge is-${priority}`}>
      <span className="sr-only">우선순위 </span>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

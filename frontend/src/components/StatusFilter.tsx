import { STATUS_FILTERS, STATUS_LABELS } from '../statuses.ts'
import type { StatusFilter as StatusFilterValue } from '../statuses.ts'

interface StatusFilterProps {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
}

/**
 * 완료 상태 필터 탭 (FR-017): 전체 · 진행 중 · 완료.
 * 목록 내용을 거르는 토글 버튼 묶음이라 fieldset(그룹 이름은 legend) + aria-pressed로 선택 상태를 알린다.
 */
export default function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <fieldset className="filter-group">
      <legend className="sr-only">완료 상태 필터</legend>
      {STATUS_FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          className={filter === value ? 'filter-btn is-selected' : 'filter-btn'}
          aria-pressed={filter === value}
          onClick={() => onChange(filter)}
        >
          {STATUS_LABELS[filter]}
        </button>
      ))}
    </fieldset>
  )
}

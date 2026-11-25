import type { Todo } from '../types.ts'

/** 이 개수까지는 작업 하나당 호(arc) 한 칸, 넘으면 연속형 원으로 바꾼다 */
const MAX_SEGMENTS = 24
const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
/** 칸 사이 간격 (원둘레 길이 단위) */
const GAP = 3

interface ProgressRingProps {
  /** 화면 목록 순서의 할 일. 12시 방향부터 시계 방향으로 칸 하나가 카드 하나와 짝을 이룬다. */
  todos: Todo[]
}

/**
 * 원형 완료율 (대시보드의 유일한 강조 요소).
 * 원은 장식이라 aria-hidden, 옆 문장을 aria-live로 읽어 준다 (NFR-001).
 */
export default function ProgressRing({ todos }: ProgressRingProps) {
  const total = todos.length
  const done = todos.filter((todo) => todo.completed).length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const segmented = total > 0 && total <= MAX_SEGMENTS

  let summary = '할 일을 추가하면 완료율이 표시됩니다.'
  if (total > 0) {
    summary = done === total ? `${total}개 모두 완료` : `${total}개 중 ${done}개 완료`
  }

  const step = total > 0 ? CIRCUMFERENCE / total : CIRCUMFERENCE
  const gap = total > 1 ? GAP : 0
  const segmentLength = step - gap

  return (
    <div className="ring-wrap">
      <div className="ring">
        <svg className="ring-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <g transform="rotate(-90 60 60)">
            {segmented ? (
              todos.map((todo, index) => (
                <circle
                  key={todo.id}
                  className={todo.completed ? 'ring-segment is-done' : 'ring-segment'}
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  strokeDasharray={`${segmentLength} ${CIRCUMFERENCE - segmentLength}`}
                  strokeDashoffset={-(index * step + gap / 2)}
                />
              ))
            ) : (
              <>
                <circle className="ring-segment" cx="60" cy="60" r={RADIUS} />
                {done > 0 && (
                  <circle
                    className="ring-segment is-done"
                    cx="60"
                    cy="60"
                    r={RADIUS}
                    strokeDasharray={`${(CIRCUMFERENCE * percent) / 100} ${CIRCUMFERENCE}`}
                  />
                )}
              </>
            )}
          </g>
        </svg>
        <span className="ring-percent" aria-hidden="true">
          {percent}
          <span className="ring-percent-unit">%</span>
        </span>
      </div>
      <p className={total === 0 ? 'ring-summary is-empty' : 'ring-summary'} aria-live="polite">
        {summary}
        {total > 0 && <span className="sr-only">{`, 완료율 ${percent}%`}</span>}
      </p>
    </div>
  )
}

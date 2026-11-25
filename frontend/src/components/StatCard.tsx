interface StatCardProps {
  label: string
  value: number
  /** 원형 프로그레스의 칸 색과 짝을 이루는 범례 표시. 없으면 표시하지 않는다 */
  marker?: 'done' | 'active'
}

/** 통계 카드 한 칸. 부모의 <dl> 안에서 라벨(dt)과 값(dd) 한 쌍을 그린다. */
export default function StatCard({ label, value, marker }: StatCardProps) {
  return (
    <div className="stat-card">
      <dt className="stat-label">
        {marker && <span className={`stat-marker is-${marker}`} aria-hidden="true" />}
        {label}
      </dt>
      <dd className="stat-value">{value}</dd>
    </div>
  )
}

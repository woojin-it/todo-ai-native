interface EmptyStateProps {
  title: string
  description: string
}

/** 목록이 비었을 때 다음 행동을 안내하는 칸 (FR-002) */
export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <svg className="empty-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <rect x="9" y="7" width="30" height="34" rx="5" />
        <path d="M16 18h16M16 25h16M16 32h9" />
      </svg>
      <p className="empty-title">{title}</p>
      <p className="empty-description">{description}</p>
    </div>
  )
}

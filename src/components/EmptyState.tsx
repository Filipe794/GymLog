import { Icon } from './Icon'

type EmptyStateProps = { title: string; description: string; actionLabel?: string; onAction?: () => void }

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return <section className="empty-state"><div className="empty-icon"><Icon name="dumbbell" size={28} /></div><h2>{title}</h2><p>{description}</p>{actionLabel && <button className="button-primary" onClick={onAction}><Icon name="plus" size={18} />{actionLabel}</button>}</section>
}

import { navigationItems } from '../data/navigation'
import type { Section } from '../types'
import { Icon } from './Icon'

type SidebarProps = {
  activeSection: Section
  onNavigate: (section: Section) => void
}

export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">M</span><span>my<span>academy</span></span></div>
      <nav className="sidebar-nav" aria-label="Navegação principal">
        {navigationItems.map((item) => (
          <button className={`nav-item ${activeSection === item.id ? 'active' : ''}`} key={item.id} onClick={() => onNavigate(item.id)}>
            <Icon name={item.icon} size={19} /><span>{item.label}</span>
          </button>
        ))}
      </nav>
      <p className="sidebar-footer">Seu progresso, no seu ritmo.</p>
    </aside>
  )
}

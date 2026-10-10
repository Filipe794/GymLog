import { navigationItems } from '../data/navigation'
import type { Section } from '../types'
import { Icon } from './Icon'

type SidebarProps = {
  activeSection: Section
  onNavigate: (section: Section) => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ activeSection, onNavigate, isOpen, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="brand"><span className="brand-mark">M</span><span>my<span>academy</span></span></div>
      <button className="mobile-menu-close" type="button" aria-label="Fechar menu" onClick={onClose}><Icon name="close" size={20} /></button>
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

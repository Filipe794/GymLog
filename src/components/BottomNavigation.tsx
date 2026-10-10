import { navigationItems } from '../data/navigation'
import type { Section } from '../types'
import { Icon } from './Icon'

type BottomNavigationProps = {
  activeSection: Section
  onNavigate: (section: Section) => void
}

export function BottomNavigation({ activeSection, onNavigate }: BottomNavigationProps) {
  return <nav className="bottom-nav" aria-label="Navegação mobile">
    {navigationItems.map((item) => <button className={`bottom-nav-item ${activeSection === item.id ? 'active' : ''}`} key={item.id} onClick={() => onNavigate(item.id)}><Icon name={item.icon} size={20} /><span>{item.label}</span></button>)}
  </nav>
}

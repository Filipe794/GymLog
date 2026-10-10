import { navigationItems } from '../data/navigation'
import type { Section } from '../types'
import { Icon } from './Icon'

type TopBarProps = {
  activeSection: Section
  onSignOut: () => void
  signingOut: boolean
  showSignOut: boolean
}

export function TopBar({ activeSection, onSignOut, signingOut, showSignOut }: TopBarProps) {
  const currentPage = navigationItems.find((item) => item.id === activeSection)
  return <header className="top-bar"><div className="mobile-menu"><Icon name="menu" /></div><div><p className="eyebrow">QUINTA-FEIRA, 09 OUT 2026</p><h1>{currentPage?.label}</h1></div><div className="profile-actions"><div className="profile-avatar" aria-label="Perfil">FC</div>{showSignOut && <button className="logout-button" type="button" onClick={onSignOut} disabled={signingOut} aria-label="Sair da conta" title="Sair da conta"><Icon name="logout" size={17} /><span>{signingOut ? 'Saindo...' : 'Sair'}</span></button>}</div></header>
}

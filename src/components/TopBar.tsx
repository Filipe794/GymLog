import { navigationItems } from '../data/navigation'
import type { Section } from '../types'
import { Icon } from './Icon'

type TopBarProps = {
  activeSection: Section
  onMenuToggle: () => void
  mobileMenuOpen: boolean
  onSignOut: () => void
  signingOut: boolean
  showSignOut: boolean
  username?: string | null
  onProfile: () => void
}

export function TopBar({ activeSection, onMenuToggle, mobileMenuOpen, onSignOut, signingOut, showSignOut, username, onProfile }: TopBarProps) {
  const currentPage = navigationItems.find((item) => item.id === activeSection)
  const initials = username ? username.slice(0, 2).toUpperCase() : '??'
  return <header className="top-bar"><button className="mobile-menu" type="button" onClick={onMenuToggle} aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileMenuOpen}><Icon name={mobileMenuOpen ? 'close' : 'menu'} /></button><div><p className="eyebrow">QUINTA-FEIRA, 09 OUT 2026</p><h1>{currentPage?.label}</h1></div><div className="profile-actions"><button className="profile-avatar" type="button" onClick={onProfile} aria-label="Abrir perfil" title="Abrir perfil">{initials}</button>{showSignOut && <button className="logout-button" type="button" onClick={onSignOut} disabled={signingOut} aria-label="Sair da conta" title="Sair da conta"><Icon name="logout" size={17} /><span>{signingOut ? 'Saindo...' : 'Sair'}</span></button>}</div></header>
}

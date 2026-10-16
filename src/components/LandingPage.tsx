import { useState } from 'react'
import { navigationItems } from '../data/navigation'
import { Icon } from './Icon'

type AuthMode = 'login' | 'signup'

type LandingPageProps = {
  onAuth: (mode: AuthMode) => void
  message?: string
}

const features = [
  { icon: 'dumbbell' as const, title: 'Organização dos treinos', description: 'Separe suas rotinas, cadastre exercícios e consulte a estrutura do seu treinamento sempre que precisar.' },
  { icon: 'up' as const, title: 'Registro de desempenho', description: 'Registre séries, repetições e cargas durante as sessões, mantendo cada treino documentado.' },
  { icon: 'chart' as const, title: 'Acompanhamento da evolução', description: 'Consulte registros anteriores e use seu histórico para acompanhar a progressão do seu desempenho.' },
  { icon: 'calendar' as const, title: 'Histórico centralizado', description: 'Mantenha os treinos realizados em um único lugar, sem depender de anotações dispersas.' },
]

export function LandingPage({ onAuth, message }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const currentYear = new Date().getFullYear()

  const navigateTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const openAuth = (mode: AuthMode) => {
    setMenuOpen(false)
    onAuth(mode)
  }

  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <a className="landing-brand" href="#inicio" onClick={() => navigateTo('inicio')}>
          <span className="brand-mark">G</span>
          <span>Gym<span>Log</span></span>
        </a>
        <button className="landing-menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
        <nav className={`landing-nav ${menuOpen ? 'open' : ''}`} aria-label="Navegação da página">
          <button type="button" onClick={() => navigateTo('inicio')}>Início</button>
          <button type="button" onClick={() => navigateTo('funcionalidades')}>Funcionalidades</button>
          <button type="button" onClick={() => navigateTo('como-funciona')}>Como funciona</button>
          <button type="button" onClick={() => navigateTo('beneficios')}>Benefícios</button>
          <div className="landing-nav-actions">
            <button className="landing-button landing-button-ghost" type="button" onClick={() => openAuth('login')}>Entrar</button>
            <button className="landing-button landing-button-dark" type="button" onClick={() => openAuth('signup')}>Criar conta</button>
          </div>
        </nav>
      </header>

      <main>
        {message && <p className="landing-account-message" role="status">{message}</p>}
        <section className="landing-hero landing-container" id="inicio">
          <div className="landing-hero-copy">
            <p className="landing-kicker"><span /> ORGANIZAÇÃO QUE MOVE VOCÊ</p>
            <h1>Seus treinos organizados. <em>Sua evolução em foco.</em></h1>
            <p className="landing-hero-text">Organize seus treinos, registre suas séries e acompanhe seu progresso em um só lugar. Mais controle para transformar sua rotina em consistência.</p>
            <div className="landing-hero-actions">
              <button className="landing-button landing-button-accent" type="button" onClick={() => openAuth('signup')}>Começar agora <Icon name="arrow" size={17} /></button>
              <button className="landing-button landing-button-link" type="button" onClick={() => openAuth('login')}>Já tenho uma conta</button>
            </div>
            <p className="landing-trust"><Icon name="check" size={16} /> Seu espaço pessoal de treinamento</p>
          </div>
          <div className="landing-preview" aria-label="Prévia ilustrativa do dashboard de treinos">
            <div className="preview-glow" />
            <div className="preview-window">
              <div className="preview-window-bar"><span /><span /><span /><small>PRÉVIA ILUSTRATIVA</small></div>
              <div className="preview-body">
                <div className="preview-sidebar"><b>M</b><i /><i /><i /><i /></div>
                <div className="preview-content">
                  <p className="preview-overline">QUINTA-FEIRA, 09 OUT 2026</p>
                  <h2>Bom treino, vamos evoluir?</h2>
                  <div className="preview-stats"><span><small>Treinos</small><strong>24</strong></span><span><small>Sessões</small><strong>18</strong></span><span className="preview-stat-highlight"><small>Consistência</small><strong>86%</strong></span></div>
                  <div className="preview-panel"><div className="preview-panel-heading"><b>Meus treinos</b><small>Ver todos</small></div><div className="preview-workout active"><strong>A</strong><span><b>Força e potência</b><small>5 exercícios · 42 min</small></span><Icon name="arrow" size={14} /></div><div className="preview-workout"><strong>B</strong><span><b>Parte superior</b><small>6 exercícios · 48 min</small></span><Icon name="arrow" size={14} /></div><div className="preview-workout"><strong>C</strong><span><b>Condicionamento</b><small>4 exercícios · 35 min</small></span><Icon name="arrow" size={14} /></div></div>
                </div>
              </div>
            </div>
            <span className="preview-note">Exemplo de visualização</span>
          </div>
        </section>

        <section className="landing-section landing-container" id="funcionalidades">
          <div className="landing-section-heading"><p className="landing-kicker">FEITO PARA SUA ROTINA</p><h2>Tudo o que você precisa para treinar com mais clareza.</h2><p>Do planejamento ao histórico, mantenha as informações importantes do seu treino sempre à mão.</p></div>
          <div className="landing-feature-grid">{features.map((feature) => <article className="landing-feature-card" key={feature.title}><span className="landing-feature-icon"><Icon name={feature.icon} size={21} /></span><h3>{feature.title}</h3><p>{feature.description}</p><span className="landing-card-arrow"><Icon name="arrow" size={17} /></span></article>)}</div>
        </section>

        <section className="landing-how landing-section" id="como-funciona">
          <div className="landing-container"><div className="landing-section-heading centered"><p className="landing-kicker">COMO FUNCIONA</p><h2>Uma rotina mais simples começa aqui.</h2><p>Três passos para colocar organização no centro do seu treino.</p></div><div className="landing-steps"><article><strong>01</strong><span><Icon name="plus" size={20} /></span><h3>Crie sua conta</h3><p>Cadastre-se para acessar seu espaço pessoal de treinamento.</p></article><article><strong>02</strong><span><Icon name="dumbbell" size={20} /></span><h3>Organize seus treinos</h3><p>Cadastre os exercícios e organize suas rotinas de treinamento.</p></article><article><strong>03</strong><span><Icon name="chart" size={20} /></span><h3>Registre e acompanhe</h3><p>Registre séries, repetições e cargas para consultar sua evolução.</p></article></div></div>
        </section>

        <section className="landing-benefits landing-section landing-container" id="beneficios">
          <div className="landing-benefits-copy"><p className="landing-kicker">MENOS DISPERSÃO, MAIS FOCO</p><h2>Mais organização para treinar com propósito.</h2><p>Quando seus dados estão organizados, fica mais fácil entender sua rotina e continuar construindo consistência, no seu ritmo.</p><button className="landing-button landing-button-dark" type="button" onClick={() => openAuth('signup')}>Organizar meu treino <Icon name="arrow" size={17} /></button></div>
          <ul className="landing-benefits-list"><li><Icon name="check" size={18} /><span><b>Informações centralizadas</b><small>Seus treinos reunidos em um único espaço.</small></span></li><li><Icon name="check" size={18} /><span><b>Consulta prática</b><small>Acesse sua rotina pelo navegador quando precisar.</small></span></li><li><Icon name="check" size={18} /><span><b>Histórico organizado</b><small>Reveja sessões e registros anteriores.</small></span></li><li><Icon name="check" size={18} /><span><b>Mais clareza na evolução</b><small>Use seus próprios registros para acompanhar seu caminho.</small></span></li></ul>
        </section>

        <section className="landing-cta landing-container"><div><p className="landing-kicker">SEU PRÓXIMO PASSO</p><h2>Sua próxima evolução começa com organização.</h2><p>Crie sua conta, organize sua rotina e comece a registrar seus treinos.</p></div><div className="landing-cta-actions"><button className="landing-button landing-button-accent" type="button" onClick={() => openAuth('signup')}>Criar minha conta <Icon name="arrow" size={17} /></button><button className="landing-button landing-button-light" type="button" onClick={() => openAuth('login')}>Entrar na minha conta</button></div></section>
      </main>

      <footer className="landing-footer landing-container"><div><a className="landing-brand" href="#inicio" onClick={() => navigateTo('inicio')}><span className="brand-mark">G</span><span>Gym<span>Log</span></span></a><p>Organize seus treinos. Acompanhe sua evolução.</p></div><div className="landing-footer-links"><div><b>Navegação</b><button type="button" onClick={() => navigateTo('funcionalidades')}>Funcionalidades</button><button type="button" onClick={() => navigateTo('como-funciona')}>Como funciona</button><button type="button" onClick={() => navigateTo('beneficios')}>Benefícios</button></div><div><b>Acesso</b><button type="button" onClick={() => openAuth('login')}>Entrar</button><button type="button" onClick={() => openAuth('signup')}>Criar conta</button></div></div><div className="landing-footer-bottom"><span>© {currentYear} GymLog. Todos os direitos reservados.</span><span>Feito para evoluir no seu ritmo.</span></div></footer>
    </div>
  )
}

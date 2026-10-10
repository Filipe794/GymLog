import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Icon } from './Icon'

type AuthPanelProps = {
  initialMode?: 'login' | 'signup'
  onBack?: () => void
}

export function AuthPanel({ initialMode = 'login', onBack }: AuthPanelProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const result = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) setMessage(result.error.message)
    else if (isSignUp) setMessage('Conta criada. Verifique seu e-mail para confirmar o acesso.')
    setLoading(false)
  }

  return <div className="auth-page"><form className="auth-card" onSubmit={submit}><div className="brand"><span className="brand-mark">M</span><span>my<span>academy</span></span></div>{onBack && <button type="button" className="auth-back" onClick={onBack}>← Voltar para a página inicial</button>}<div><p className="eyebrow">{isSignUp ? 'CRIAR CONTA' : 'ENTRAR'}</p><h1>{isSignUp ? 'Comece sua evolução' : 'Bem-vindo de volta'}</h1><p className="auth-description">Acesse seus treinos e sessões com segurança.</p></div><label>E-mail<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Senha<div className="password-field"><input type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}><Icon name={showPassword ? 'eye-off' : 'eye'} size={18} /></button></div></label>{message && <p className="auth-message">{message}</p>}<button className="button-primary auth-submit" disabled={loading}>{loading ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}</button><button type="button" className="auth-switch" onClick={() => { setIsSignUp(!isSignUp); setMessage(''); setShowPassword(false) }}>{isSignUp ? 'Já tenho uma conta' : 'Criar uma conta'}</button></form></div>
}

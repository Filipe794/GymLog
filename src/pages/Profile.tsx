import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

type ProfileProps = {
  user: User
  username: string | null
  loading: boolean
  onSaveUsername: (username: string) => Promise<void>
  onDeleteAccount: (confirmation: string) => Promise<void>
}

const usernamePattern = /^[\p{L}\p{N}._-]{3,30}$/u

export function Profile({ user, username, loading, onSaveUsername, onDeleteAccount }: ProfileProps) {
  const [draftUsername, setDraftUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!loading) setDraftUsername(username ?? '')
  }, [loading, username])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedUsername = draftUsername.trim()
    if (!normalizedUsername) {
      setFeedback({ type: 'error', text: 'Informe um nome de usuário.' })
      return
    }
    if (!usernamePattern.test(normalizedUsername)) {
      setFeedback({ type: 'error', text: 'Use de 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado.' })
      return
    }

    setSaving(true)
    setFeedback(null)
    try {
      await onSaveUsername(normalizedUsername)
      setFeedback({ type: 'success', text: 'Username atualizado com sucesso.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      setFeedback({
        type: 'error',
        text: message.includes('duplicate') || message.includes('unique') || message.includes('23505')
          ? 'Esse nome de usuário já está em uso.'
          : `Não foi possível salvar as alterações: ${message}`,
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault()
    if (deleteConfirmation !== 'EXCLUIR MINHA CONTA') {
      setDeleteError('Digite exatamente: EXCLUIR MINHA CONTA')
      return
    }

    setDeleting(true)
    setDeleteError('')
    try {
      await onDeleteAccount(deleteConfirmation)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Não foi possível excluir a conta.')
      setDeleting(false)
    }
  }

  const closeDeleteModal = () => {
    if (deleting) return
    setDeleteModalOpen(false)
    setDeleteConfirmation('')
    setDeleteError('')
  }

  return <div className="profile-page">
    <div className="section-heading"><div><p className="eyebrow">SUA CONTA</p><h2>Perfil</h2><p className="section-description">Gerencie seus dados pessoais e preferências.</p></div></div>
    <div className="profile-grid">
      <section className="profile-card">
        <div className="profile-card-heading"><div className="profile-large-avatar">{(username ?? 'Usuário').slice(0, 2).toUpperCase()}</div><div><h3>{username ?? 'Usuário'}</h3><p>Perfil pessoal</p></div></div>
        <form className="profile-form" onSubmit={save}>
          <label>Nome de usuário<input type="text" value={draftUsername} onChange={(event) => setDraftUsername(event.target.value)} minLength={3} maxLength={30} pattern="[\p{L}\p{N}._-]{3,30}" disabled={loading || saving} autoComplete="username" /></label>
          <label>E-mail<input type="email" value={user.email ?? ''} readOnly /></label>
          {feedback && <p className={`profile-feedback ${feedback.type}`} role="alert">{feedback.text}</p>}
          <button className="button-primary" type="submit" disabled={loading || saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button>
        </form>
      </section>
      <section className="profile-card account-management danger-zone"><p className="eyebrow">ZONA DE PERIGO</p><h3>Excluir conta permanentemente</h3><p>Essa ação é permanente. Sua conta e os treinos, exercícios, sessões e perfil associados serão excluídos e não poderão ser recuperados.</p><button className="danger-button" type="button" onClick={() => { setDeleteError(''); setDeleteModalOpen(true) }}>Excluir minha conta</button></section>
    </div>
    {deleteModalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDeleteModal() }}><form className="profile-delete-modal" onSubmit={deleteAccount}><div className="form-header"><div><p className="eyebrow">ZONA DE PERIGO</p><h2>Confirmar exclusão</h2></div><button type="button" className="close-button" onClick={closeDeleteModal} disabled={deleting} aria-label="Fechar"><span aria-hidden="true">×</span></button></div><p className="delete-warning">Ao continuar, sua conta será excluída definitivamente. Você perderá o acesso e todos os dados de treino associados serão removidos. Essa ação não pode ser desfeita.</p><label>Para confirmar, digite <strong>EXCLUIR MINHA CONTA</strong><input type="text" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" disabled={deleting} /></label>{deleteError && <p className="profile-feedback error" role="alert">{deleteError}</p>}<div className="form-actions"><button type="button" className="button-secondary" onClick={closeDeleteModal} disabled={deleting}>Cancelar</button><button type="submit" className="danger-button" disabled={deleting}>{deleting ? 'Excluindo...' : 'Confirmar exclusão definitiva'}</button></div></form></div>}
  </div>
}

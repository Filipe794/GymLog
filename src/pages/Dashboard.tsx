import { useEffect, useMemo, useState } from 'react'
import type { Section, WorkoutSession } from '../types'
import { EmptyState } from '../components/EmptyState'
import { fetchRemoteSessions } from '../services/sessionsService'
import { getExerciseRows, formatDate } from '../services/progressService'

function startOfWeek() {
  const date = new Date()
  const day = date.getDay()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  return date
}

export function Dashboard({ onNavigate, userId }: { onNavigate: (section: Section) => void; userId?: string }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    fetchRemoteSessions(userId).then(setSessions).catch((loadError: Error) => {
      setError(loadError.message)
      console.error('Não foi possível carregar o dashboard.', loadError)
    })
  }, [userId])

  const weekSessions = useMemo(() => sessions.filter((session) => new Date(session.finishedAt ?? session.startedAt) >= startOfWeek()), [sessions])
  const rows = useMemo(() => getExerciseRows(sessions), [sessions])
  const totalVolume = rows.reduce((sum, row) => sum + row.totalVolume, 0)
  const recentSessions = sessions.slice(0, 4)
  const latestRows = rows.filter((row) => row.sessionMaxLoad !== null).sort((a, b) => new Date(a.session.finishedAt ?? a.session.startedAt).getTime() - new Date(b.session.finishedAt ?? b.session.startedAt).getTime()).slice(-5)
  const latestLoad = latestRows.length ? latestRows[latestRows.length - 1].sessionMaxLoad : null
  const previousLoad = latestRows.length > 1 ? latestRows[latestRows.length - 2].sessionMaxLoad : null
  const loadDelta = latestLoad !== null && previousLoad !== null ? latestLoad - previousLoad : null
  const recentCutoff = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const frequency = sessions.filter((session) => new Date(session.finishedAt ?? session.startedAt) >= recentCutoff).length / 4

  return <div className="dashboard-page">
    <div className="welcome"><p className="eyebrow">VISÃO GERAL</p><h2>Olá, Filipe <span>👋</span></h2><p>Seu acompanhamento baseado nos registros reais do Supabase.</p></div>
    {error && <div className="remote-error" role="alert"><strong>Não foi possível carregar seus indicadores.</strong><span>{error}</span></div>}
    <div className="stats-grid"><div className="stat-card accent"><span>Treinos concluídos na semana</span><strong>{weekSessions.length}</strong><small>de segunda até hoje</small></div><div className="stat-card"><span>Frequência de treino</span><strong>{sessions.length ? `${frequency.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}/sem` : '—'}</strong><small>média das últimas 4 semanas</small></div><div className="stat-card"><span>Volume registrado</span><strong>{totalVolume ? `${totalVolume.toLocaleString('pt-BR')}` : '—'}</strong><small>kg em todas as séries válidas</small></div></div>
    <div className="dashboard-grid"><section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">ATIVIDADE</p><h3>Sessões recentes</h3></div><button className="text-button" onClick={() => onNavigate('history')}>Ver histórico</button></div>{recentSessions.length ? <div className="recent-list">{recentSessions.map((session) => <button className="recent-item" key={session.id} onClick={() => onNavigate('history')}><span className="workout-badge">{session.workoutId}</span><span><strong>{session.workoutName}</strong><small>{formatDate(session.finishedAt ?? session.startedAt)} · {session.exercises.length} exercícios</small></span></button>)}</div> : <div className="history-inline-empty">Nenhuma sessão concluída registrada.</div>}</section><section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">PROGRESSÃO</p><h3>Resumo de carga</h3></div><button className="text-button" onClick={() => onNavigate('reports')}>Relatórios</button></div><div className="dashboard-highlight"><strong>{latestLoad === null ? '—' : `${latestLoad} kg`}</strong><span>última carga máxima registrada</span><small>{loadDelta === null ? 'Ainda não há duas medições comparáveis.' : `${loadDelta >= 0 ? '+' : ''}${loadDelta} kg em relação ao registro anterior`}</small></div></section></div>
    {!sessions.length && <EmptyState title="Tudo pronto para começar" description="Finalize seu primeiro treino para acompanhar frequência, volume e progressão." actionLabel="Ir para treinos" onAction={() => onNavigate('workouts')} />}
  </div>
}

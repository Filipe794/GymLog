import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { loadCompletedSessions } from '../storage/sessionsStorage'
import type { WorkoutSession } from '../types'
import { fetchRemoteSessions } from '../services/sessionsService'

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })
}

function sessionDuration(session: WorkoutSession) {
  if (!session.finishedAt) return 'Sessão incompleta'
  const minutes = Math.max(1, Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000))
  return `${minutes} min`
}

function workoutIndicator(session: WorkoutSession) {
  if (session.workoutId === 'A' || session.workoutId === 'B' || session.workoutId === 'C') return session.workoutId
  const initial = session.workoutName.trim().charAt(0).toUpperCase()
  return initial || 'T'
}

type ExerciseHistoryRow = {
  session: WorkoutSession
  exercise: WorkoutSession['exercises'][number]
  sessionMaxLoad: number | null
  validSets: number
  totalVolume: number
}

function getExerciseRows(sessions: WorkoutSession[]): ExerciseHistoryRow[] {
  return sessions.flatMap((session) => session.exercises.map((exercise) => {
    const validSets = exercise.sets.filter((set) => typeof set.weightKg === 'number' && typeof set.reps === 'number' && set.weightKg >= 0 && set.reps >= 0)
    const loads = validSets.map((set) => set.weightKg as number)
    return {
      session,
      exercise,
      sessionMaxLoad: loads.length ? Math.max(...loads) : null,
      validSets: validSets.length,
      totalVolume: validSets.reduce((total, set) => total + (set.weightKg as number) * (set.reps as number), 0),
    }
  }))
}

export function History({ userId }: { userId?: string }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>(loadCompletedSessions)
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState('all')
  const [period, setPeriod] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    fetchRemoteSessions(userId).then((remoteSessions) => {
      setSessions(remoteSessions)
      setError('')
    }).catch((loadError: Error) => {
      setError(loadError.message)
      console.error('Não foi possível carregar o histórico do Supabase.', loadError)
    })
  }, [userId])

  const exerciseOptions = useMemo(() => {
    const options = new Map<string, { id: string; name: string }>()
    for (const row of getExerciseRows(sessions)) if (!options.has(row.exercise.exerciseId)) options.set(row.exercise.exerciseId, { id: row.exercise.exerciseId, name: row.exercise.name })
    return [...options.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [sessions])
  const filteredSessions = useMemo(() => sessions.filter((session) => {
    const date = new Date(session.finishedAt ?? session.startedAt)
    const matchesExercise = selectedExerciseId === 'all' || session.exercises.some((exercise) => exercise.exerciseId === selectedExerciseId)
    const cutoff = period === 'all' ? null : new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000)
    const matchesPeriod = !cutoff || date >= cutoff
    return matchesExercise && matchesPeriod
  }), [period, selectedExerciseId, sessions])
  const filteredRows = useMemo(() => getExerciseRows(filteredSessions).filter((row) => selectedExerciseId === 'all' || row.exercise.exerciseId === selectedExerciseId).sort((a, b) => new Date(a.session.finishedAt ?? a.session.startedAt).getTime() - new Date(b.session.finishedAt ?? b.session.startedAt).getTime()), [filteredSessions, selectedExerciseId])
  const chartRows = filteredRows.filter((row) => row.sessionMaxLoad !== null)
  const maxChartLoad = chartRows.length ? Math.max(...chartRows.map((row) => row.sessionMaxLoad as number)) : 0

  if (selectedSession) return <SessionDetails session={selectedSession} onClose={() => setSelectedSession(null)} />
  if (sessions.length === 0) return <EmptyState title="Seu histórico está vazio" description="Os treinos concluídos aparecerão aqui para você acompanhar sua jornada." />

  return <div className="history-page">
    {error && <div className="remote-error" role="alert"><strong>Não foi possível carregar o histórico.</strong><span>{error}</span></div>}
    <div className="section-heading"><div><p className="eyebrow">HISTÓRICO E PROGRESSÃO</p><h2>Seu histórico</h2><p className="section-description">Compare somente os registros reais das sessões concluídas.</p></div></div>
    <div className="history-filters">
      <label>Exercício<select value={selectedExerciseId} onChange={(event) => setSelectedExerciseId(event.target.value)}><option value="all">Todos os exercícios</option>{exerciseOptions.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}</select></label>
      <label>Período<select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Todo o período</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Último ano</option></select></label>
    </div>
    <Progression rows={filteredRows} chartRows={chartRows} maxChartLoad={maxChartLoad} selectedExerciseId={selectedExerciseId} />
    <div className="history-section-title"><h3>Sessões</h3><span>{filteredSessions.length} encontradas</span></div>
    {filteredSessions.length ? <div className="history-list">{[...filteredSessions].sort((a, b) => new Date(b.finishedAt ?? b.startedAt).getTime() - new Date(a.finishedAt ?? a.startedAt).getTime()).map((session) => <button className="history-card" key={session.id} onClick={() => setSelectedSession(session)}><span className="workout-badge">{workoutIndicator(session)}</span><span className="history-card-main"><strong>{session.workoutName}</strong><small>{session.focus}</small><small>{formatDate(session.finishedAt ?? session.startedAt)}</small></span><span className="history-card-end"><small>{sessionDuration(session)}</small><Icon name="arrow" size={17} /></span></button>)}</div> : <div className="history-inline-empty">Nenhuma sessão concluída corresponde aos filtros.</div>}
  </div>
}

function Progression({ rows, chartRows, maxChartLoad, selectedExerciseId }: { rows: ExerciseHistoryRow[]; chartRows: ExerciseHistoryRow[]; maxChartLoad: number; selectedExerciseId: string }) {
  const totalVolume = rows.reduce((total, row) => total + row.totalVolume, 0)
  const maxLoad = chartRows.length ? Math.max(...chartRows.map((row) => row.sessionMaxLoad as number)) : null
  const exerciseName = selectedExerciseId === 'all' ? 'Todos os exercícios' : rows[0]?.exercise.name ?? 'Exercício sem histórico'
  return <section className="progression-panel"><div className="progression-heading"><div><p className="eyebrow">ANÁLISE REAL</p><h3>{exerciseName}</h3></div><small>Estimativa de força não calculada</small></div><div className="progression-metrics"><div><span>Carga máxima registrada</span><strong>{maxLoad === null ? '—' : `${maxLoad} kg`}</strong><small>maior carga em uma série</small></div><div><span>Volume total</span><strong>{totalVolume ? `${totalVolume.toLocaleString('pt-BR')} kg` : '—'}</strong><small>séries × repetições × carga</small></div><div><span>Registros comparáveis</span><strong>{chartRows.length}</strong><small>sessões com carga e repetições</small></div></div><div className="progression-chart-heading"><strong>Evolução da carga máxima por sessão</strong><span>Não representa estimativa de força</span></div>{chartRows.length ? <div className="progression-chart">{chartRows.map((row) => <div className="progression-point" key={`${row.session.id}-${row.exercise.exerciseId}`}><div className="progression-bar-wrap"><div className="progression-bar" style={{ height: `${Math.max(8, ((row.sessionMaxLoad as number) / maxChartLoad) * 100)}%` }} title={`${row.sessionMaxLoad} kg`} /></div><strong>{row.sessionMaxLoad} kg</strong><small>{new Date(row.session.finishedAt ?? row.session.startedAt).toLocaleDateString('pt-BR')}</small></div>)}</div> : <div className="history-inline-empty">Não há carga e repetições preenchidas para gerar a evolução.</div>}<div className="progression-table-wrap"><table className="progression-table"><thead><tr><th>Data</th><th>Exercício</th><th>Séries válidas</th><th>Repetições</th><th>Volume</th><th>Carga máxima</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.session.id}-${row.exercise.exerciseId}`}><td>{new Date(row.session.finishedAt ?? row.session.startedAt).toLocaleDateString('pt-BR')}</td><td>{row.exercise.name}</td><td>{row.validSets}</td><td>{row.exercise.sets.filter((set) => typeof set.reps === 'number').map((set) => set.reps).join(', ') || '—'}</td><td>{row.totalVolume ? `${row.totalVolume.toLocaleString('pt-BR')} kg` : '—'}</td><td>{row.sessionMaxLoad === null ? '—' : `${row.sessionMaxLoad} kg`}</td></tr>)}</tbody></table></div></section>
}

function SessionDetails({ session, onClose }: { session: WorkoutSession; onClose: () => void }) {
  return <div className="history-page"><button className="back-link" onClick={onClose}><Icon name="arrow" size={17} />Voltar para histórico</button><div className="details-heading"><p className="eyebrow">DETALHES DA SESSÃO</p><h2>{session.workoutName} <span>·</span> {session.focus}</h2><p className="section-description">{formatDate(session.finishedAt ?? session.startedAt)} · {sessionDuration(session)}</p></div><div className="session-details-list">{session.exercises.map((exercise, index) => <article className="details-exercise" key={exercise.exerciseId}><div><span className="exercise-order">{String(index + 1).padStart(2, '0')}</span><div><h3>{exercise.name}</h3><p>{exercise.muscleGroup}</p></div></div><div className="details-sets">{exercise.sets.map((set, setIndex) => <span key={set.id}>Série {setIndex + 1}: <strong>{set.weightKg ?? '—'} kg × {set.reps ?? '—'}</strong></span>)}</div></article>)}</div></div>
}

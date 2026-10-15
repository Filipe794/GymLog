import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { WorkoutSessionView } from '../components/WorkoutSession'
import { createSession, loadActiveSession, loadCompletedSessions, saveAbandonedSession, saveActiveSession, saveCompletedSessions, clearActiveSession } from '../storage/sessionsStorage'
import { loadWorkouts, saveWorkouts } from '../storage/workoutsStorage'
import { saveRemoteSession } from '../services/sessionsService'
import {
  createRemoteWorkout, fetchExerciseLibrary, fetchRemoteWorkouts, initializeRemoteWorkouts,
  replaceWorkoutExercises, saveRemoteExercise, updateRemoteWorkout,
} from '../services/workoutsService'
import type { Exercise, Workout, WorkoutSession } from '../types'

const emptyExercise: Omit<Exercise, 'id'> = { name: '', sets: 3, reps: '8–12', muscleGroup: '', notes: '' }

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function Workouts({ userId }: { userId?: string }) {
  const [workouts, setWorkouts] = useState<Workout[]>(loadWorkouts)
  const [library, setLibrary] = useState<Exercise[]>([])
  const [activeWorkoutId, setActiveWorkoutId] = useState('')
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [exerciseToArchive, setExerciseToArchive] = useState<Exercise | null>(null)
  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [isAddingWorkout, setIsAddingWorkout] = useState(false)
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(loadActiveSession)
  const [completedSessions, setCompletedSessions] = useState<WorkoutSession[]>(loadCompletedSessions)
  const [isSessionView, setIsSessionView] = useState(Boolean(activeSession))
  const [remoteError, setRemoteError] = useState('')

  const activeWorkout = workouts.find((workout) => workout.id === activeWorkoutId) ?? workouts.find((workout) => !workout.archivedAt) ?? null
  const activeWorkouts = workouts.filter((workout) => !workout.archivedAt)
  const archivedWorkouts = workouts.filter((workout) => workout.archivedAt)

  useEffect(() => {
    if (!userId) return
    Promise.all([initializeRemoteWorkouts(userId), fetchExerciseLibrary()]).then(([remoteWorkouts, remoteLibrary]) => {
      setWorkouts(remoteWorkouts)
      setLibrary(remoteLibrary)
      setRemoteError('')
    }).catch((error: Error) => {
      setRemoteError(error.message)
      console.error('Não foi possível sincronizar treinos e exercícios.', error)
    })
  }, [userId])

  useEffect(() => {
    if (!activeWorkoutId && activeWorkouts[0]) setActiveWorkoutId(activeWorkouts[0].id)
  }, [activeWorkoutId, activeWorkouts])

  const persist = async (nextWorkouts: Workout[]) => {
    setWorkouts(nextWorkouts)
    saveWorkouts(nextWorkouts)
    if (!userId) return
    try {
      const remote = await fetchRemoteWorkouts()
      setWorkouts(remote)
      setRemoteError('')
    } catch (error) {
      setRemoteError((error as Error).message)
    }
  }

  const saveWorkout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name')).trim()
    const focus = String(data.get('focus')).trim() || 'Treino personalizado'
    if (!name) return
    try {
      if (userId && !editingWorkout) {
        const created = await createRemoteWorkout(userId, name, focus)
        setWorkouts((current) => [...current, created])
        setActiveWorkoutId(created.id)
      } else {
        const next = editingWorkout
          ? workouts.map((workout) => workout.id === editingWorkout.id ? { ...workout, name, focus } : workout)
          : [...workouts, { id: createId('workout'), name, focus, exercises: [] }]
        if (editingWorkout && userId) await updateRemoteWorkout(next.find((workout) => workout.id === editingWorkout.id) as Workout)
        await persist(next)
      }
      setEditingWorkout(null)
      setIsAddingWorkout(false)
    } catch (error) {
      setRemoteError((error as Error).message)
    }
  }

  const saveExercise = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeWorkout) return
    const data = new FormData(event.currentTarget)
    const exercise: Exercise = {
      id: editingExercise?.id ?? createId('exercise'),
      name: String(data.get('name')).trim(),
      sets: Number(data.get('sets')),
      reps: String(data.get('reps')).trim(),
      muscleGroup: String(data.get('muscleGroup')).trim(),
      notes: String(data.get('notes')).trim(),
      archivedAt: editingExercise?.archivedAt ?? null,
    }
    if (!exercise.name || !exercise.muscleGroup || !exercise.reps || exercise.sets < 1) return
    try {
      const saved = userId ? await saveRemoteExercise(userId, exercise) : exercise
      const nextExercises = editingExercise
        ? activeWorkout.exercises.map((item) => item.id === exercise.id ? saved : item)
        : [...activeWorkout.exercises, saved]
      const next = workouts.map((workout) => workout.id === activeWorkout.id ? { ...workout, exercises: nextExercises } : workout)
      if (userId) await replaceWorkoutExercises(activeWorkout.id, nextExercises)
      await persist(next)
      setLibrary((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved])
      setEditingExercise(null)
      setIsAddingExercise(false)
    } catch (error) {
      setRemoteError((error as Error).message)
    }
  }

  const addLibraryExercise = async (exercise: Exercise) => {
    if (!activeWorkout || exercise.archivedAt) return
    const nextExercises = activeWorkout.exercises.some((item) => item.id === exercise.id)
      ? activeWorkout.exercises
      : [...activeWorkout.exercises, exercise]
    const next = workouts.map((workout) => workout.id === activeWorkout.id ? { ...workout, exercises: nextExercises } : workout)
    if (userId) await replaceWorkoutExercises(activeWorkout.id, nextExercises)
    await persist(next)
  }

  const archiveExercise = async (exercise: Exercise) => {
    try {
      const archived = { ...exercise, archivedAt: new Date().toISOString() }
      if (userId) await saveRemoteExercise(userId, archived)
      setLibrary((current) => current.map((item) => item.id === exercise.id ? archived : item))
      const nextWorkouts = workouts.map((workout) => ({
        ...workout,
        exercises: workout.exercises.map((item) => item.id === exercise.id ? archived : item),
      }))
      setWorkouts(nextWorkouts)
      saveWorkouts(nextWorkouts)
      setExerciseToArchive(null)
    } catch (error) {
      setRemoteError((error as Error).message)
    }
  }

  const restoreExercise = async (exercise: Exercise) => {
    try {
      const restored = { ...exercise, archivedAt: null }
      if (userId) await saveRemoteExercise(userId, restored)
      setLibrary((current) => current.map((item) => item.id === exercise.id ? restored : item))
      const nextWorkouts = workouts.map((workout) => ({
        ...workout,
        exercises: workout.exercises.map((item) => item.id === exercise.id ? restored : item),
      }))
      setWorkouts(nextWorkouts)
      saveWorkouts(nextWorkouts)
    } catch (error) {
      setRemoteError((error as Error).message)
    }
  }

  const archiveWorkout = async (workout: Workout) => {
    const nextWorkout = { ...workout, archivedAt: new Date().toISOString() }
    if (userId) await updateRemoteWorkout(nextWorkout)
    await persist(workouts.map((item) => item.id === workout.id ? nextWorkout : item))
  }

  const restoreWorkout = async (workout: Workout) => {
    const restored = { ...workout, archivedAt: null }
    if (userId) await updateRemoteWorkout(restored)
    await persist(workouts.map((item) => item.id === workout.id ? restored : item))
  }

  const startSession = () => {
    if (!activeWorkout || activeWorkout.archivedAt) return
    if (activeSession) {
      setIsSessionView(true)
      return
    }
    const session = createSession(activeWorkout)
    setActiveSession(session)
    saveActiveSession(session)
    if (userId) saveRemoteSession(userId, session).catch((error) => setRemoteError(error.message))
    setIsSessionView(true)
  }

  if (isSessionView && activeSession) return <WorkoutSessionView
    session={activeSession}
    history={completedSessions}
    onChange={(nextSession) => {
      setActiveSession(nextSession)
      saveActiveSession(nextSession)
      if (userId) saveRemoteSession(userId, nextSession).catch((error) => setRemoteError(error.message))
    }}
    onFinish={async () => {
      const completed = { ...activeSession, status: 'completed' as const, finishedAt: new Date().toISOString() }
      try {
        if (userId) await saveRemoteSession(userId, completed)
        const nextSessions = [...completedSessions, completed]
        setCompletedSessions(nextSessions)
        saveCompletedSessions(nextSessions)
        clearActiveSession(); setActiveSession(null); setIsSessionView(false)
      } catch (error) {
        setRemoteError((error as Error).message)
      }
    }}
    onAbandon={async () => {
      const abandoned = { ...activeSession, status: 'abandoned' as const, finishedAt: new Date().toISOString() }
      try {
        if (userId) await saveRemoteSession(userId, abandoned)
        saveAbandonedSession(abandoned)
        clearActiveSession(); setActiveSession(null); setIsSessionView(false)
      } catch (error) {
        setRemoteError((error as Error).message)
      }
    }}
    onCancel={() => setIsSessionView(false)}
  />

  if (!activeWorkouts.length) return <div className="workouts-page"><div className="section-heading"><div><p className="eyebrow">ROTINA DE TREINOS</p><h2>Organize sua semana</h2></div><button className="button-primary" onClick={() => setIsAddingWorkout(true)}><Icon name="plus" size={18} />Criar treino</button></div><EmptyState title="Você ainda não tem treinos" description="Crie seu primeiro treino personalizado para começar sua evolução." actionLabel="Criar primeiro treino" onAction={() => setIsAddingWorkout(true)} />{isAddingWorkout && <WorkoutForm workout={null} onSave={saveWorkout} onClose={() => setIsAddingWorkout(false)} />}</div>

  return <div className="workouts-page">
    {remoteError && <div className="remote-error" role="alert"><strong>Não foi possível sincronizar.</strong><span>{remoteError}</span></div>}
    <div className="section-heading"><div><p className="eyebrow">ROTINA DE TREINOS</p><h2>Organize sua semana</h2><p className="section-description">Crie divisões próprias e reutilize sua biblioteca de exercícios.</p></div><button className="button-primary" onClick={() => setIsAddingWorkout(true)}><Icon name="plus" size={18} />Novo treino</button></div>
    <div className="workout-tabs" role="tablist" aria-label="Treinos">{activeWorkouts.map((workout) => <button className={`workout-tab ${activeWorkout?.id === workout.id ? 'active' : ''}`} key={workout.id} onClick={() => setActiveWorkoutId(workout.id)} role="tab" aria-selected={activeWorkout?.id === workout.id}><span>{workout.name}</span><small>{workout.exercises.length} exercícios</small></button>)}</div>
    {activeWorkout && <><div className="workout-summary"><div><span className="workout-badge">{activeWorkout.name.slice(0, 1).toUpperCase()}</span><div><h3>{activeWorkout.focus}</h3><p>{activeWorkout.exercises.length} exercícios planejados</p></div></div><div className="workout-summary-actions"><button className="text-button" onClick={() => { setEditingWorkout(activeWorkout); setIsAddingWorkout(false) }}>Editar treino</button><button className="text-button" onClick={() => archiveWorkout(activeWorkout)}>Arquivar</button><button className="text-button" onClick={() => setIsAddingExercise(true)}><Icon name="plus" size={16} />Adicionar exercício</button><button className="button-primary start-button" disabled={!activeWorkout.exercises.length} onClick={startSession}>Iniciar treino<Icon name="arrow" size={16} /></button></div></div>
    <div className="exercise-list">{activeWorkout.exercises.filter((exercise) => !exercise.archivedAt).map((exercise, index) => <article className="exercise-card" key={exercise.id}><div className="exercise-order">{String(index + 1).padStart(2, '0')}</div><div className="exercise-info"><h3>{exercise.name}</h3><div className="exercise-meta"><span>{exercise.muscleGroup}</span><span>{exercise.sets} séries</span><span>{exercise.reps} repetições</span></div>{exercise.notes && <p className="exercise-notes">{exercise.notes}</p>}</div><div className="exercise-actions"><button onClick={() => { setEditingExercise(exercise); setIsAddingExercise(false) }} aria-label="Editar exercício"><Icon name="edit" size={16} /></button><button className="danger" onClick={() => setExerciseToArchive(exercise)} aria-label="Arquivar exercício"><Icon name="trash" size={16} /></button></div></article>)}</div><section className="archived-section"><h3>Exercícios arquivados</h3>{library.filter((exercise) => exercise.archivedAt).length ? library.filter((exercise) => exercise.archivedAt).map((exercise) => <div className="archived-row" key={exercise.id}><span>{exercise.name}</span><button className="text-button" onClick={() => restoreExercise(exercise)}>Restaurar</button></div>) : <p>Nenhum exercício arquivado.</p>}</section></>}
    <section className="archived-section"><h3>Treinos arquivados</h3>{archivedWorkouts.length ? archivedWorkouts.map((workout) => <div className="archived-row" key={workout.id}><span>{workout.name}</span><button className="text-button" onClick={() => restoreWorkout(workout)}>Restaurar</button></div>) : <p>Nenhum treino arquivado.</p>}</section>
    {(isAddingWorkout || editingWorkout) && <WorkoutForm workout={editingWorkout} onSave={saveWorkout} onClose={() => { setEditingWorkout(null); setIsAddingWorkout(false) }} />}
    {(isAddingExercise || editingExercise) && <ExerciseForm exercise={editingExercise} library={library} onChoose={addLibraryExercise} onSave={saveExercise} onClose={() => { setEditingExercise(null); setIsAddingExercise(false) }} />}
    {exerciseToArchive && <ArchiveExerciseDialog exercise={exerciseToArchive} onConfirm={() => archiveExercise(exerciseToArchive)} onClose={() => setExerciseToArchive(null)} />}
  </div>
}

function ArchiveExerciseDialog({ exercise, onConfirm, onClose }: { exercise: Exercise; onConfirm: () => void; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="archive-exercise-title"><p className="eyebrow">ARQUIVAR EXERCÍCIO</p><h2 id="archive-exercise-title">Arquivar “{exercise.name}”?</h2><p>Ele permanecerá nos treinos e no histórico, mas não poderá ser adicionado a novos treinos até ser restaurado.</p><div className="form-actions"><button type="button" className="button-secondary" onClick={onClose}>Cancelar</button><button type="button" className="danger-button" onClick={onConfirm}>Arquivar exercício</button></div></section></div>
}

function WorkoutForm({ workout, onSave, onClose }: { workout: Workout | null; onSave: (event: React.FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return <div className="modal-backdrop"><form className="exercise-form" onSubmit={onSave}><div className="form-header"><div><p className="eyebrow">{workout ? 'EDITAR TREINO' : 'NOVO TREINO'}</p><h2>{workout ? 'Atualizar treino' : 'Criar treino'}</h2></div><button type="button" className="close-button" onClick={onClose}><Icon name="close" size={20} /></button></div><label>Nome<input name="name" required defaultValue={workout?.name} placeholder="Ex.: Força superior" /></label><label>Foco <span>(opcional)</span><input name="focus" defaultValue={workout?.focus} placeholder="Ex.: Peito e tríceps" /></label><div className="form-actions"><button type="button" className="button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button-primary">Salvar</button></div></form></div>
}

function ExerciseForm({ exercise, library, onChoose, onSave, onClose }: { exercise: Exercise | null; library: Exercise[]; onChoose: (exercise: Exercise) => void; onSave: (event: React.FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  const available = useMemo(() => library.filter((item) => !item.archivedAt && item.id !== exercise?.id), [exercise?.id, library])
  return <div className="modal-backdrop"><form className="exercise-form" onSubmit={onSave}><div className="form-header"><div><p className="eyebrow">{exercise ? 'EDITAR EXERCÍCIO' : 'BIBLIOTECA DE EXERCÍCIOS'}</p><h2>{exercise ? 'Atualizar exercício' : 'Adicionar exercício'}</h2></div><button type="button" className="close-button" onClick={onClose}><Icon name="close" size={20} /></button></div>{!exercise && available.length > 0 && <div className="library-picker"><strong>Adicionar existente</strong>{available.map((item) => <button type="button" key={item.id} onClick={() => { onChoose(item); onClose() }}>{item.name} · {item.muscleGroup}</button>)}</div>}<label>Nome<input name="name" required defaultValue={exercise?.name} /></label><div className="form-grid"><label>Séries<input name="sets" required min="1" type="number" defaultValue={exercise?.sets ?? emptyExercise.sets} /></label><label>Repetições<input name="reps" required defaultValue={exercise?.reps ?? emptyExercise.reps} /></label></div><label>Grupo muscular<input name="muscleGroup" required defaultValue={exercise?.muscleGroup} /></label><label>Observações <span>(opcional)</span><textarea name="notes" defaultValue={exercise?.notes} rows={3} /></label><div className="form-actions"><button type="button" className="button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button-primary">{exercise ? 'Salvar alterações' : 'Criar exercício'}</button></div></form></div>
}

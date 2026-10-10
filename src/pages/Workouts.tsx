import { useEffect, useState } from 'react'
import { loadWorkouts, saveWorkouts } from '../storage/workoutsStorage'
import { createSession, loadActiveSession, loadCompletedSessions, saveActiveSession, saveCompletedSessions, clearActiveSession } from '../storage/sessionsStorage'
import { saveRemoteSession } from '../services/sessionsService'
import type { Exercise, Workout, WorkoutSession } from '../types'
import { Icon } from '../components/Icon'
import { WorkoutSessionView } from '../components/WorkoutSession'
import { initializeRemoteWorkouts, replaceRemoteWorkouts } from '../services/workoutsService'

const emptyExercise: Omit<Exercise, 'id'> = {
  name: '',
  sets: 3,
  reps: '8–12',
  muscleGroup: '',
  notes: '',
}

function createExerciseId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `exercise-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function Workouts({ userId }: { userId?: string }) {
  const [workouts, setWorkouts] = useState<Workout[]>(loadWorkouts)
  const [activeWorkoutId, setActiveWorkoutId] = useState<Workout['id']>('A')
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(loadActiveSession)
  const [completedSessions, setCompletedSessions] = useState<WorkoutSession[]>(loadCompletedSessions)
  const [isSessionView, setIsSessionView] = useState(Boolean(activeSession))
  const [remoteError, setRemoteError] = useState('')
  const activeWorkout = workouts.find((workout) => workout.id === activeWorkoutId) ?? workouts[0]

  useEffect(() => {
    if (!userId) return
    initializeRemoteWorkouts(userId).then((remoteWorkouts) => {
      setWorkouts(remoteWorkouts)
      setRemoteError('')
    }).catch((error: Error) => {
      setRemoteError(error.message)
      console.error('Não foi possível inicializar os treinos do Supabase.', error)
    })
  }, [userId])

  if (isSessionView && activeSession) {
    return <WorkoutSessionView
      session={activeSession}
      history={completedSessions}
      onChange={(nextSession) => {
        setActiveSession(nextSession)
        saveActiveSession(nextSession)
        if (userId) saveRemoteSession(userId, nextSession).catch((error) => console.warn('Não foi possível salvar a sessão no Supabase.', error))
      }}
      onFinish={() => {
        const completedSession = { ...activeSession, status: 'completed' as const, finishedAt: new Date().toISOString() }
        const nextSessions = [...completedSessions, completedSession]
        setCompletedSessions(nextSessions)
        saveCompletedSessions(nextSessions)
        if (userId) saveRemoteSession(userId, completedSession).catch((error) => console.warn('Não foi possível concluir a sessão no Supabase.', error))
        clearActiveSession()
        setActiveSession(null)
        setIsSessionView(false)
      }}
      onCancel={() => setIsSessionView(false)}
    />
  }

  const updateExercises = (exercises: Exercise[]) => {
    const nextWorkouts = workouts.map((workout) => workout.id === activeWorkout.id ? { ...workout, exercises } : workout)
    setWorkouts(nextWorkouts)
    saveWorkouts(nextWorkouts)
    if (userId) replaceRemoteWorkouts(userId, nextWorkouts).then((remoteWorkouts) => {
      setWorkouts(remoteWorkouts)
      setRemoteError('')
    }).catch((error: Error) => {
      setRemoteError(error.message)
      console.error('Não foi possível salvar os treinos no Supabase.', error)
    })
  }

  const saveExercise = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const exercise: Exercise = {
      id: editingExercise?.id ?? createExerciseId(),
      name: String(data.get('name')).trim(),
      sets: Number(data.get('sets')),
      reps: String(data.get('reps')).trim(),
      muscleGroup: String(data.get('muscleGroup')).trim(),
      notes: String(data.get('notes')).trim(),
    }
    if (!exercise.name || !exercise.muscleGroup || !exercise.reps || exercise.sets < 1) return
    updateExercises(editingExercise ? activeWorkout.exercises.map((item) => item.id === exercise.id ? exercise : item) : [...activeWorkout.exercises, exercise])
    closeEditor()
  }

  const removeExercise = (exerciseId: string) => {
    if (window.confirm('Remover este exercício do treino?')) updateExercises(activeWorkout.exercises.filter((exercise) => exercise.id !== exerciseId))
  }

  const moveExercise = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= activeWorkout.exercises.length) return
    const exercises = [...activeWorkout.exercises]
    const [moved] = exercises.splice(index, 1)
    exercises.splice(nextIndex, 0, moved)
    updateExercises(exercises)
  }

  const closeEditor = () => {
    setEditingExercise(null)
    setIsAdding(false)
  }

  const startSession = () => {
    if (activeSession) {
      setIsSessionView(true)
      return
    }
    const session = createSession(activeWorkout)
    setActiveSession(session)
    saveActiveSession(session)
    if (userId) saveRemoteSession(userId, session).catch((error) => console.warn('Não foi possível iniciar a sessão no Supabase.', error))
    setIsSessionView(true)
  }

  return (
    <div className="workouts-page">
      {remoteError && <div className="remote-error" role="alert"><strong>Não foi possível sincronizar com o Supabase.</strong><span>{remoteError}</span></div>}
      <div className="section-heading">
        <div>
          <p className="eyebrow">ROTINA DE TREINOS</p>
          <h2>Organize sua semana</h2>
          <p className="section-description">Edite os exercícios e mantenha seu treino sempre atualizado.</p>
        </div>
        <button className="button-primary add-workout-button" onClick={() => { setIsAdding(true); setEditingExercise(null) }}><Icon name="plus" size={18} />Adicionar exercício</button>
      </div>

      <div className="workout-tabs" role="tablist" aria-label="Treinos">
        {workouts.map((workout) => <button className={`workout-tab ${activeWorkout.id === workout.id ? 'active' : ''}`} key={workout.id} onClick={() => setActiveWorkoutId(workout.id)} role="tab" aria-selected={activeWorkout.id === workout.id}><span>{workout.name}</span><small>{workout.exercises.length} exercícios</small></button>)}
      </div>

      <div className="workout-summary"><div><span className="workout-badge">{activeWorkout.id}</span><div><h3>{activeWorkout.focus}</h3><p>{activeWorkout.exercises.length} exercícios planejados</p></div></div><div className="workout-summary-actions"><button className="text-button" onClick={() => setIsAdding(true)}><Icon name="plus" size={16} />Adicionar</button><button className="button-primary start-button" onClick={startSession}>{activeSession ? 'Continuar sessão' : 'Iniciar treino'}<Icon name="arrow" size={16} /></button></div></div>

      <div className="exercise-list">
        {activeWorkout.exercises.map((exercise, index) => <article className="exercise-card" key={exercise.id}>
          <div className="exercise-order">{String(index + 1).padStart(2, '0')}</div>
          <div className="exercise-info"><h3>{exercise.name}</h3><div className="exercise-meta"><span>{exercise.muscleGroup}</span><span>{exercise.sets} séries</span><span>{exercise.reps} repetições</span></div>{exercise.notes && <p className="exercise-notes">{exercise.notes}</p>}</div>
          <div className="exercise-actions"><button title="Mover para cima" aria-label="Mover para cima" disabled={index === 0} onClick={() => moveExercise(index, -1)}><Icon name="up" size={16} /></button><button title="Mover para baixo" aria-label="Mover para baixo" disabled={index === activeWorkout.exercises.length - 1} onClick={() => moveExercise(index, 1)}><Icon name="down" size={16} /></button><button title="Editar exercício" aria-label="Editar exercício" onClick={() => { setEditingExercise(exercise); setIsAdding(false) }}><Icon name="edit" size={16} /></button><button className="danger" title="Remover exercício" aria-label="Remover exercício" onClick={() => removeExercise(exercise.id)}><Icon name="trash" size={16} /></button></div>
        </article>)}
      </div>

      {(isAdding || editingExercise) && <ExerciseForm exercise={editingExercise} onSave={saveExercise} onClose={closeEditor} />}
    </div>
  )
}

type ExerciseFormProps = { exercise: Exercise | null; onSave: (event: React.FormEvent<HTMLFormElement>) => void; onClose: () => void }

function ExerciseForm({ exercise, onSave, onClose }: ExerciseFormProps) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><form className="exercise-form" onSubmit={onSave}><div className="form-header"><div><p className="eyebrow">{exercise ? 'EDITAR EXERCÍCIO' : 'NOVO EXERCÍCIO'}</p><h2>{exercise ? 'Atualizar exercício' : 'Adicionar exercício'}</h2></div><button type="button" className="close-button" onClick={onClose} aria-label="Fechar"><Icon name="close" size={20} /></button></div><label>Nome do exercício<input name="name" required defaultValue={exercise?.name} placeholder="Ex.: Supino reto" /></label><div className="form-grid"><label>Séries planejadas<input name="sets" required min="1" type="number" defaultValue={exercise?.sets ?? emptyExercise.sets} /></label><label>Faixa de repetições<input name="reps" required defaultValue={exercise?.reps ?? emptyExercise.reps} placeholder="Ex.: 8–12" /></label></div><label>Grupo muscular<input name="muscleGroup" required defaultValue={exercise?.muscleGroup} placeholder="Ex.: Peito" /></label><label>Observações <span>(opcional)</span><textarea name="notes" defaultValue={exercise?.notes} placeholder="Ex.: Aumentar carga quando completar a faixa." rows={3} /></label><div className="form-actions"><button type="button" className="button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button-primary">{exercise ? 'Salvar alterações' : 'Adicionar exercício'}</button></div></form></div>
}

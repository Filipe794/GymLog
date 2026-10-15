import type { SessionSet, Workout, WorkoutSession } from '../types'
import { useState } from 'react'
import { Icon } from './Icon'

type WorkoutSessionProps = {
  session: WorkoutSession
  history: WorkoutSession[]
  onChange: (session: WorkoutSession) => void
  onFinish: () => void | Promise<void>
  onAbandon: () => void | Promise<void>
  onCancel: () => void
}

function lastExerciseSession(history: WorkoutSession[], exerciseId: string, currentId: string) {
  const matches = history
    .filter((session) => session.id !== currentId && session.status === 'completed')
    .flatMap((session) => session.exercises.filter((exercise) => exercise.exerciseId === exerciseId))
  return matches[matches.length - 1]
}

export function WorkoutSessionView({ session, history, onChange, onFinish, onAbandon, onCancel }: WorkoutSessionProps) {
  const [finishing, setFinishing] = useState(false)
  const updateExercise = (exerciseId: string, update: (exercise: WorkoutSession['exercises'][number]) => WorkoutSession['exercises'][number]) => {
    onChange({ ...session, exercises: session.exercises.map((exercise) => exercise.exerciseId === exerciseId ? update(exercise) : exercise) })
  }

  const updateSet = (exerciseId: string, setId: string, field: keyof Pick<SessionSet, 'weightKg' | 'reps'>, value: string) => {
    updateExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => set.id === setId ? { ...set, [field]: value === '' ? null : Number(value) } : set),
    }))
  }

  const addSet = (exerciseId: string) => updateExercise(exerciseId, (exercise) => ({
    ...exercise,
    sets: [...exercise.sets, { id: `set-${Date.now()}`, weightKg: null, reps: null }],
  }))

  const removeSet = (exerciseId: string, setId: string) => updateExercise(exerciseId, (exercise) => exercise.sets.length <= 1 ? exercise : { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) })
  const toggleCompleted = (exerciseId: string) => updateExercise(exerciseId, (exercise) => ({ ...exercise, completed: !exercise.completed }))
  const completedCount = session.exercises.filter((exercise) => exercise.completed).length
  const finish = async () => {
    if (finishing) return
    setFinishing(true)
    try {
      await onFinish()
    } finally {
      setFinishing(false)
    }
  }
  const abandon = async () => {
    if (finishing) return
    setFinishing(true)
    try {
      await onAbandon()
    } finally {
      setFinishing(false)
    }
  }

  return <div className="session-page">
    <div className="session-header"><button className="back-link" onClick={onCancel}><Icon name="arrow" size={17} />Voltar para treinos</button><p className="eyebrow">SESSÃO EM ANDAMENTO</p><h2>{session.workoutName} <span>·</span> {session.focus}</h2><p className="session-started">Iniciada em {new Date(session.startedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p></div>
    <div className="session-progress"><div><strong>{completedCount}/{session.exercises.length}</strong><span> exercícios concluídos</span></div><div className="session-actions"><button className="button-secondary" disabled={finishing} onClick={abandon}>Abandonar treino</button><button className="button-primary" disabled={finishing} onClick={finish}>{finishing ? 'Salvando...' : 'Finalizar treino'}</button></div></div>
    <div className="session-exercises">{session.exercises.map((exercise, index) => {
      const previous = lastExerciseSession(history, exercise.exerciseId, session.id)
      return <article className={`session-exercise ${exercise.completed ? 'completed' : ''}`} key={exercise.exerciseId}>
        <div className="session-exercise-heading"><div><span className="exercise-order">{String(index + 1).padStart(2, '0')}</span><div><h3>{exercise.name}</h3><p>{exercise.muscleGroup} · planejado: {exercise.plannedSets} séries de {exercise.plannedReps}</p></div></div><button className={`complete-button ${exercise.completed ? 'is-complete' : ''}`} onClick={() => toggleCompleted(exercise.exerciseId)}>{exercise.completed ? 'Concluído' : 'Marcar concluído'}</button></div>
        {previous && <p className="previous-result">Última vez: {previous.sets.filter((set) => set.weightKg !== null || set.reps !== null).map((set) => `${set.weightKg ?? '—'} kg × ${set.reps ?? '—'}`).join('  ·  ') || 'sem registros'}</p>}
        <div className="set-header"><span>Série</span><span>Carga (kg)</span><span>Repetições</span><span aria-hidden="true" /></div>
        {exercise.sets.map((set, setIndex) => <div className="set-row" key={set.id}><span>{setIndex + 1}</span><input aria-label={`Carga da série ${setIndex + 1} de ${exercise.name}`} type="number" min="0" step="0.5" value={set.weightKg ?? ''} onChange={(event) => updateSet(exercise.exerciseId, set.id, 'weightKg', event.target.value)} placeholder="0" /><input aria-label={`Repetições da série ${setIndex + 1} de ${exercise.name}`} type="number" min="0" value={set.reps ?? ''} onChange={(event) => updateSet(exercise.exerciseId, set.id, 'reps', event.target.value)} placeholder="0" /><button className="remove-set" aria-label={`Remover série ${setIndex + 1}`} onClick={() => removeSet(exercise.exerciseId, set.id)} disabled={exercise.sets.length <= 1}><Icon name="trash" size={15} /></button></div>)}
        <button className="add-set-button" onClick={() => addSet(exercise.exerciseId)}><Icon name="plus" size={15} />Adicionar série</button>
      </article>
    })}</div>
  </div>
}

import type { Workout } from '../types'

export const initialWorkouts: Workout[] = [
  {
    id: 'A',
    name: 'Treino A',
    focus: 'Costas, bíceps e antebraço',
    exercises: [
      { id: 'a-1', name: 'Puxada frontal', sets: 4, reps: '8–12', muscleGroup: 'Costas', notes: 'Controlar a volta do movimento.' },
      { id: 'a-2', name: 'Remada baixa', sets: 4, reps: '8–12', muscleGroup: 'Costas' },
      { id: 'a-3', name: 'Remada unilateral', sets: 3, reps: '10–12', muscleGroup: 'Costas' },
      { id: 'a-4', name: 'Rosca direta', sets: 3, reps: '8–12', muscleGroup: 'Bíceps' },
      { id: 'a-5', name: 'Rosca martelo', sets: 3, reps: '10–12', muscleGroup: 'Bíceps e antebraço' },
      { id: 'a-6', name: 'Rosca inversa', sets: 3, reps: '12–15', muscleGroup: 'Antebraço' },
    ],
  },
  {
    id: 'B',
    name: 'Treino B',
    focus: 'Peito, ombros e tríceps',
    exercises: [
      { id: 'b-1', name: 'Supino reto', sets: 4, reps: '8–12', muscleGroup: 'Peito' },
      { id: 'b-2', name: 'Supino inclinado', sets: 3, reps: '8–12', muscleGroup: 'Peito' },
      { id: 'b-3', name: 'Crucifixo', sets: 3, reps: '10–12', muscleGroup: 'Peito' },
      { id: 'b-4', name: 'Desenvolvimento de ombros', sets: 3, reps: '8–12', muscleGroup: 'Ombros' },
      { id: 'b-5', name: 'Elevação lateral', sets: 3, reps: '12–15', muscleGroup: 'Ombros' },
      { id: 'b-6', name: 'Tríceps na polia', sets: 3, reps: '10–12', muscleGroup: 'Tríceps' },
    ],
  },
  {
    id: 'C',
    name: 'Treino C',
    focus: 'Pernas',
    exercises: [
      { id: 'c-1', name: 'Agachamento livre', sets: 4, reps: '8–12', muscleGroup: 'Quadríceps e glúteos' },
      { id: 'c-2', name: 'Leg press', sets: 4, reps: '10–12', muscleGroup: 'Quadríceps' },
      { id: 'c-3', name: 'Cadeira extensora', sets: 3, reps: '12–15', muscleGroup: 'Quadríceps' },
      { id: 'c-4', name: 'Mesa flexora', sets: 3, reps: '10–12', muscleGroup: 'Posterior de coxa' },
      { id: 'c-5', name: 'Elevação pélvica', sets: 3, reps: '10–12', muscleGroup: 'Glúteos' },
      { id: 'c-6', name: 'Panturrilha em pé', sets: 4, reps: '12–15', muscleGroup: 'Panturrilhas' },
    ],
  },
]

export const getProgressPercent = (completed: number[], total: number) =>
  total === 0 ? 0 : Math.round((completed.length / total) * 100)

export const courseStatusForProgress = (progress: number) => {
  if (progress >= 100) {
    return { label: 'Concluido', state: 'complete' as const }
  }
  if (progress > 0) {
    return { label: 'Continuar', state: 'continue' as const }
  }
  return { label: 'Iniciar', state: 'start' as const }
}


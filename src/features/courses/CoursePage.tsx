import type { Dispatch, SetStateAction } from 'react'
import type { CourseData } from './coursesData'
import { getProgressPercent } from './courseProgress'

type CoursePageProps = {
  course: CourseData
  completed: number[]
  setCompleted: Dispatch<SetStateAction<number[]>>
  onBack: () => void
}

export function CoursePage({
  course,
  completed,
  setCompleted,
  onBack,
}: CoursePageProps) {
  const totalModules = course.modules.length
  const completedCount = completed.length
  const progressPercent = getProgressPercent(completed, totalModules)
  const isCourseComplete = completedCount === totalModules
  const nextModule =
    course.modules.find(
      (module) =>
        (module.id === 1 || completed.includes(module.id - 1)) &&
        !completed.includes(module.id)
    ) || course.modules[0]

  const markModuleComplete = (id: number) => {
    if (completed.includes(id)) return
    setCompleted((prev) => [...prev, id])
  }

  const scrollToModule = (id: number) => {
    if (typeof window === 'undefined') return
    const target = document.getElementById(`module-${course.id}-${id}`)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="course-page">
      <header className="course-hero">
        <button className="course-back" onClick={onBack}>
          Voltar
        </button>
        <div className="course-hero__main">
          <div className="course-hero__title">
            <h1 className="course-title">{course.title}</h1>
            <div className="course-meta">
              {totalModules} módulos • {course.duration}
            </div>
          </div>
          <div className="course-progress-summary">
            <div className="course-progress-main">
              <span className="course-progress-label">Progresso total</span>
              <strong>
                {completedCount}/{totalModules} - {progressPercent}%
              </strong>
            </div>
            <div className="course-progress-bar">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <button
              className="course-top-cta"
              onClick={() => scrollToModule(nextModule.id)}
              disabled={isCourseComplete}
            >
              {isCourseComplete
                ? 'Curso concluído'
                : `Continuar módulo ${nextModule.id}`}
            </button>
          </div>
        </div>
      </header>

      <section className="modules-grid">
        {course.modules.map((module) => {
          const isCompleted = completed.includes(module.id)
          const isUnlocked = module.id === 1 || completed.includes(module.id - 1)
          const status = isCompleted
            ? 'Concluido'
            : isUnlocked
              ? 'Disponível'
              : 'Bloqueado'

          const pdfPath = module.hasPdf
            ? `/pdfs/${course.pdfPrefix}_modulo_${String(module.id).padStart(
                2,
                '0'
              )}.pdf`
            : null

          return (
            <article
              key={module.id}
              id={`module-${course.id}-${module.id}`}
              className={`module-card ${isCompleted ? 'completed' : ''} ${
                isUnlocked ? 'available' : 'locked'
              }`}
            >
              <div className="module-header">
                <span className="module-index">{module.id}</span>
                <div>
                  <h3>{module.title}</h3>
                  <span
                    className={`module-status ${
                      isCompleted ? 'completed' : isUnlocked ? 'available' : 'locked'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              <div className="module-actions">
                {pdfPath ? (
                  isUnlocked ? (
                    <>
                      <a
                        className="btn small ghost"
                        href={pdfPath}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver PDF
                      </a>
                      <a className="btn small ghost" href={pdfPath} download>
                        Baixar PDF
                      </a>
                    </>
                  ) : (
                    <>
                      <button className="btn small ghost" disabled>
                        Ver PDF
                      </button>
                      <button className="btn small ghost" disabled>
                        Baixar PDF
                      </button>
                    </>
                  )
                ) : null}
                <button
                  className="btn small primary"
                  onClick={() => markModuleComplete(module.id)}
                  disabled={!isUnlocked || isCompleted}
                >
                  {isCompleted ? 'Concluído' : 'Concluir'}
                </button>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}


import { useMemo, useState } from 'react'
import { parseMdxLite } from '../lib/mdxLite'

import aula01Source from '../content/previdencia/m1/aula-01-intro.mdx?raw'
import aula02Source from '../content/previdencia/m1/aula-02-envelope.mdx?raw'

type PrevidenciaPrivadaModulo01PageProps = {
  onBack: () => void
}

export function PrevidenciaPrivadaModulo01Page({ onBack }: PrevidenciaPrivadaModulo01PageProps) {
  const lessons = useMemo(() => {
    const docs = [
      { id: 'aula-01', doc: parseMdxLite(aula01Source) },
      { id: 'aula-02', doc: parseMdxLite(aula02Source) },
    ]
    return docs
  }, [])

  const [activeIdx, setActiveIdx] = useState(0)
  const active = lessons[activeIdx]
  const total = lessons.length
  const title = active?.doc.meta.title ?? 'Aula'
  const duration = active?.doc.meta.duration ?? '—'

  return (
    <div className="course-page">
      <header className="course-hero">
        <button className="course-back" onClick={onBack} aria-label="Voltar para Cursos">
          Voltar
        </button>
        <div className="course-hero__main">
          <div className="course-hero__title">
            <h1 className="course-title">Previdência Privada — Do Zero ao Uso Inteligente</h1>
            <div className="course-meta">
              Módulo 01 • {total} aulas
            </div>
          </div>
          <div className="course-progress-summary">
            <div className="course-progress-main">
              <span className="course-progress-label">Aula atual</span>
              <strong>
                {activeIdx + 1}/{total} • {title} • {duration}
              </strong>
            </div>
            <div className="lesson-tabs">
              {lessons.map((lesson, idx) => (
                <button
                  key={lesson.id}
                  className={`btn small ghost ${idx === activeIdx ? 'active' : ''}`}
                  onClick={() => setActiveIdx(idx)}
                  aria-current={idx === activeIdx ? 'page' : undefined}
                >
                  Aula {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="lesson-shell">
        <article className="lesson-card">
          <div className="lesson-content">{active?.doc.nodes}</div>

          <div className="lesson-nav">
            <button
              className="btn ghost"
              onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
              disabled={activeIdx === 0}
            >
              Anterior
            </button>
            <button
              className="btn primary"
              onClick={() => setActiveIdx((prev) => Math.min(total - 1, prev + 1))}
              disabled={activeIdx >= total - 1}
            >
              Próximo
            </button>
          </div>
        </article>
      </section>
    </div>
  )
}

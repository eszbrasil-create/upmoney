import type { CourseId } from './coursesData'
import { courseStatusForProgress } from './courseProgress'

type CoursesListPageProps = {
  course1Progress: number
  course2Progress: number
  course3Progress: number
  onOpenMenu: () => void
  onOpenCourse: (id: CourseId) => void
}

export function CoursesListPage({
  course1Progress,
  course2Progress,
  course3Progress,
  onOpenMenu,
  onOpenCourse,
}: CoursesListPageProps) {
  return (
    <>
      <header className="courses-hero">
        <button className="course-back" onClick={onOpenMenu}>
          Menu
        </button>
        <h1 className="courses-title">Cursos</h1>
        <p className="courses-subtitle">
          Selecione o programa que você quer destravar agora. Cada curso tem
          materiais práticos e acompanhamento de metas.
        </p>
      </header>

      <section className="courses-grid">
        <article
          className="course-card featured"
          onClick={() => onOpenCourse('course1')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              onOpenCourse('course1')
            }
          }}
        >
          <div className="course-card__tag">Metodo principal</div>
          <h2>Meu primeiro dividendo</h2>
          <p>
            Uma jornada completa para sair do zero e construir renda mensal com
            disciplina e consistência.
          </p>
          <ul className="course-bullets">
            <li>Entenda renda fixa e variável sem confusão</li>
            <li>Monte sua estratégia com segurança</li>
            <li>Acompanhe tudo dentro do UpControl</li>
          </ul>
          <div className="course-card__meta">
            <span>9 aulas</span>
            <span>3h 40min</span>
          </div>
          <div className="course-card__progress">
            <span style={{ width: `${course1Progress}%` }} />
          </div>
          {(() => {
            const status = courseStatusForProgress(course1Progress)
            return (
              <button
                className={`btn small course-action ${status.state}`}
                onClick={() => onOpenCourse('course1')}
              >
                {status.label}
              </button>
            )
          })()}
        </article>

        <article
          className="course-card"
          onClick={() => onOpenCourse('course2')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              onOpenCourse('course2')
            }
          }}
        >
          <div className="course-card__tag soft">Mindset</div>
          <h2>Configuração mental</h2>
          <p>
            Ajuste de mentalidade e hábitos para manter constância no longo
            prazo e evitar viéses.
          </p>
          <ul className="course-bullets">
            <li>Elimine procrastinação e bloqueios mentais</li>
            <li>Construa disciplina com ações simples</li>
            <li>Invista com razão</li>
          </ul>
          <div className="course-card__meta">
            <span>6 aulas</span>
            <span>2h 10min</span>
          </div>
          <div className="course-card__progress neutral">
            <span style={{ width: `${course2Progress}%` }} />
          </div>
          {(() => {
            const status = courseStatusForProgress(course2Progress)
            return (
              <button
                className={`btn small course-action ${status.state}`}
                onClick={() => onOpenCourse('course2')}
              >
                {status.label}
              </button>
            )
          })()}
        </article>

        <article
          className="course-card"
          onClick={() => onOpenCourse('course3')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              onOpenCourse('course3')
            }
          }}
        >
          <div className="course-card__tag accent">Plano patrimonial</div>
          <h2>Previdência privada</h2>
          <p>
            Estratégias para proteger patrimônio e planejar aposentadoria usando
            produtos e prazos corretos.
          </p>
          <ul className="course-bullets">
            <li>Entenda PGBL e VGBL sem complicação</li>
            <li>Taxas, tributação e armadilhas comuns</li>
            <li>Estratégia de longo prazo e aposentadoria</li>
          </ul>
          <div className="course-card__meta">
            <span>1 aula</span>
            <span>1h 10min</span>
          </div>
          <div className="course-card__progress">
            <span style={{ width: `${course3Progress}%` }} />
          </div>
          {(() => {
            const status = courseStatusForProgress(course3Progress)
            return (
              <button
                className={`btn small course-action ${status.state}`}
                onClick={() => onOpenCourse('course3')}
              >
                {status.label}
              </button>
            )
          })()}
        </article>
      </section>
    </>
  )
}


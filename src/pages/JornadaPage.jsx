import { useEffect, useMemo, useState } from 'react'
import tickerDone from '../assets/ticker-done.svg'

const PHASES = [
  { id: 1, title: 'Consciência Financeira', status: 'unlocked' },
  { id: 2, title: 'Reserva de Segurança', status: 'locked' },
  { id: 3, title: 'Primeiro Investimento', status: 'locked' },
  { id: 4, title: 'Primeiro Dividendo', status: 'locked' },
  { id: 5, title: 'Crescimento da Carteira', status: 'locked' },
  { id: 6, title: 'Renda Passiva', status: 'locked' },
]

const PHASE_DETAILS = {
  1: {
    title: 'Fase 1: Consciência Financeira',
    objective: 'Fazer o usuário entender sua realidade financeira.',
    actions: [
      {
        text: 'Cadastrar receitas e despesas no mínimo 3 meses',
        linkLabel: 'Abrir planilha de despesas',
        href: '/despesas',
      },
      { text: 'Ver quanto sobra' },
    ],
    released: {
      trail: 'Trilha 1',
      text: 'Faça a aula 2 do curso Meu Primeiro Dividendo e aula 2 do módulo de Configuração Mental.',
      bullets: [],
      links: [
        {
          label: 'Ir para a aula de Configuração Mental',
          href: '/cursos/configuracao-mental',
          course: 'course1',
          moduleId: 2,
        },
        {
          label: 'Ir para a Aula 2: Quem você é com dinheiro',
          href: '/cursos/configuracao-mental/aula-2-quem-voce-e-com-dinheiro',
          course: 'course2',
          moduleId: 2,
        },
      ],
    },
    progress: 40,
  },
  2: {
    title: 'Fase 2: Reserva de Segurança',
    objective:
      'Criar reserva de emergência. Entender conceitos que vão te ajudar a alocação do valor referente a sua reserva.',
    actions: [{ text: 'Definir valor da reserva' }],
    released: {
      trail: 'Trilha 2',
      text: 'Faça a aula 3 Renda Fixa do curso Meu Primeiro Dividendo e aula 3 Escolhas que constroem o futurodo módulo de Configuração Mental.',
      bullets: [],
      links: [
        {
          label: 'Ir para a aula 3_ Renda Fixa_ Curso: Meu Primeiro Dividendo',
          href: '/cursos/meu-primeiro-dividendo/aula-3-renda-fixa',
          course: 'course1',
          moduleId: 3,
        },
        {
          label: 'Ir para a aula 3_ Escolhas que constroem o futuro_ Curso: Configuração Mental',
          href: '/cursos/configuracao-mental/aula-3-escolhas-que-constroem-o-futuro',
          course: 'course2',
          moduleId: 3,
        },
      ],
    },
    progress: 0,
  },
  3: {
    title: 'Fase 3: Meu primeiro Investimento',
    objective:
      'Aqui o objetivo é que você compre a sua primeira ação e seu primeiro fundo imobiliário, apos fazer os curso você deve definir um valor a investir para ter como meta',
    actions: [{ text: 'Defina o valor a investir mensalmente' }],
    released: {
      trail: 'Trilha 3',
      text: 'Faça a aula 4 Renda variável e aula 5 FIIs do curso Meu Primeiro Dividendo, e a aula 4 Estabilidade emocional do curso Configuração Mental.',
      bullets: [],
      links: [
        {
          label: 'Ir para a aula 4_ Renda variável_ Curso: Meu Primeiro Dividendo',
          href: '/cursos/meu-primeiro-dividendo/aula-4-renda-variavel',
          course: 'course1',
          moduleId: 4,
        },
        {
          label: 'Ir para a aula 5_ FIIs_ Curso: Meu Primeiro Dividendo',
          href: '/cursos/meu-primeiro-dividendo/aula-5-fiis',
          course: 'course1',
          moduleId: 5,
        },
        {
          label: 'Ir para a aula 4_ Estabilidade emocional_ Curso: Configuração Mental',
          href: '/cursos/configuracao-mental/aula-4-estabilidade-emocional',
          course: 'course2',
          moduleId: 4,
        },
      ],
    },
    progress: 0,
  },
  4: {
    title: 'Fase 4: Primeiro Dividendo',
    objective:
      'Descubra como transformar investimentos em renda recorrente e dar os primeiros passos rumo à liberdade financeira por meio dos dividendos.',
    actions: [{ text: 'Defina uma meta de dividendos mensais que você planeja receber' }],
    released: {
      trail: 'Trilha 4',
      text: 'Faça a aula 6 Dividendos do curso Meu Primeiro Dividendo, e a aula 5 Construção do mindset investidor do curso Configuração Mental.',
      bullets: [],
      links: [
        {
          label: 'Ir para a aula 6_ Dividendos_ Curso: Meu Primeiro Dividendo',
          href: '/cursos/meu-primeiro-dividendo/aula-6-dividendos',
          course: 'course1',
          moduleId: 6,
        },
        {
          label: 'Ir para a aula 5_ Construção do mindset investidor_ Curso: Configuração Mental',
          href: '/cursos/configuracao-mental/aula-5-construcao-do-mindset-investidor',
          course: 'course2',
          moduleId: 5,
        },
      ],
    },
    progress: 0,
  },
  5: {
    title: 'Fase 5: Estratégia de Renda passiva',
    objective:
      'Agora você ja conhece dividendos e conceitos básicos, chegou a hora de entender o desfecho dentro do plano de estratégia que vai fazer sua renda crescer ao longo do tempo.',
    actions: [{ text: 'Defina uma meta de renda passiva mensal para crescer ao longo do tempo' }],
    released: {
      trail: 'Trilha 5',
      text: 'Faça a aula 7 Estratégia de renda passiva do curso Meu Primeiro Dividendo, e a aula 6 Dividendos, Símbolo de transformação do curso Configuração Mental.',
      bullets: [],
      links: [
        {
          label: 'Ir para a aula 7_ Estratégia de renda passiva_ Curso: Meu Primeiro Dividendo',
          href: '/cursos/meu-primeiro-dividendo/aula-7-estrategia-de-renda-passiva',
          course: 'course1',
          moduleId: 7,
        },
        {
          label: 'Ir para a aula 6_Dividendos, Símbolo de transformação_ Curso: Configuração Mental',
          href: '/cursos/configuracao-mental/aula-6-dividendos-simbolo-de-transformacao',
          course: 'course2',
          moduleId: 6,
        },
      ],
    },
    progress: 0,
  },
}

const clampProgress = (value) => Math.max(0, Math.min(100, Number(value) || 0))
const formatCurrencyValue = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return ''
  return numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
const parseCurrencyValue = (value) => {
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
const sanitizeCurrencyInput = (value) => {
  const digitsOnly = value.replace(/\D/g, '')
  if (!digitsOnly) return ''
  const numeric = Number(digitsOnly) / 100
  return numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
export function JornadaPage({
  onNavigate,
  completedCourse1Modules = [],
  completedCourse2Modules = [],
  hasAtLeastThreeSavedExpenseMonths = false,
  phase2ReserveValue = null,
  onPhase2ReserveValueChange,
  phase3InvestmentValue = null,
  onPhase3InvestmentValueChange,
  phase4DividendGoalValue = null,
  onPhase4DividendGoalValueChange,
  phase5PassiveIncomeValue = null,
  onPhase5PassiveIncomeValueChange,
  expensesInsight = {
    hasData: false,
    averageExpense: 0,
    percentSpent: 0,
    isNegative: false,
  },
}) {
  const [selectedPhase, setSelectedPhase] = useState(1)
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false)
  const [reserveValueInput, setReserveValueInput] = useState(formatCurrencyValue(phase2ReserveValue))
  const [investmentValueInput, setInvestmentValueInput] = useState(formatCurrencyValue(phase3InvestmentValue))
  const [dividendGoalInput, setDividendGoalInput] = useState(formatCurrencyValue(phase4DividendGoalValue))
  const [passiveIncomeInput, setPassiveIncomeInput] = useState(formatCurrencyValue(phase5PassiveIncomeValue))
  const details = PHASE_DETAILS[selectedPhase]
  const isCourse1Module2Done = useMemo(
    () => completedCourse1Modules.includes(2),
    [completedCourse1Modules]
  )
  const isCourse2Module2Done = useMemo(
    () => completedCourse2Modules.includes(2),
    [completedCourse2Modules]
  )
  const isCourse1Module3Done = useMemo(
    () => completedCourse1Modules.includes(3),
    [completedCourse1Modules]
  )
  const isCourse1Module4Done = useMemo(
    () => completedCourse1Modules.includes(4),
    [completedCourse1Modules]
  )
  const isCourse1Module5Done = useMemo(
    () => completedCourse1Modules.includes(5),
    [completedCourse1Modules]
  )
  const isCourse1Module6Done = useMemo(
    () => completedCourse1Modules.includes(6),
    [completedCourse1Modules]
  )
  const isCourse1Module7Done = useMemo(
    () => completedCourse1Modules.includes(7),
    [completedCourse1Modules]
  )
  const isCourse2Module3Done = useMemo(
    () => completedCourse2Modules.includes(3),
    [completedCourse2Modules]
  )
  const isCourse2Module4Done = useMemo(
    () => completedCourse2Modules.includes(4),
    [completedCourse2Modules]
  )
  const isCourse2Module5Done = useMemo(
    () => completedCourse2Modules.includes(5),
    [completedCourse2Modules]
  )
  const isCourse2Module6Done = useMemo(
    () => completedCourse2Modules.includes(6),
    [completedCourse2Modules]
  )
  const phase1Completed =
    hasAtLeastThreeSavedExpenseMonths && isCourse1Module2Done && isCourse2Module2Done
  const phase2Unlocked = phase1Completed
  const phase2Completed =
    phase2Unlocked &&
    Boolean(phase2ReserveValue && phase2ReserveValue > 0) &&
    isCourse1Module3Done &&
    isCourse2Module3Done
  const phase3Unlocked = phase2Completed
  const phase3Completed =
    phase3Unlocked &&
    Boolean(phase3InvestmentValue && phase3InvestmentValue > 0) &&
    isCourse1Module4Done &&
    isCourse1Module5Done &&
    isCourse2Module4Done
  const phase4Unlocked = phase3Completed
  const phase4Completed =
    phase4Unlocked &&
    Boolean(phase4DividendGoalValue && phase4DividendGoalValue > 0) &&
    isCourse1Module6Done &&
    isCourse2Module5Done
  const phase5Unlocked = phase4Completed
  const phase5Completed =
    phase5Unlocked &&
    Boolean(phase5PassiveIncomeValue && phase5PassiveIncomeValue > 0) &&
    isCourse1Module7Done &&
    isCourse2Module6Done
  const phase6Unlocked = phase5Completed
  const attentionPhaseId = !phase1Completed
    ? 1
    : !phase2Completed
      ? 2
      : !phase3Completed
        ? 3
        : !phase4Completed
          ? 4
          : !phase5Completed
            ? 5
            : 6

  const phaseProgress = useMemo(() => {
    if (selectedPhase === 1) return phase1Completed ? 100 : 40
    if (selectedPhase === 2) return phase2Completed ? 100 : 0
    if (selectedPhase === 3) return phase3Completed ? 100 : 0
    if (selectedPhase === 4) return phase4Completed ? 100 : 0
    if (selectedPhase === 5) return phase5Completed ? 100 : 0
    return clampProgress(details?.progress ?? 0)
  }, [details?.progress, phase1Completed, phase2Completed, phase3Completed, phase4Completed, phase5Completed, selectedPhase])
  const formatBRL = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    []
  )

  const navigateFromPath = (href) => {
    if (!onNavigate) return
    if (href === '/despesas') {
      onNavigate('expenses')
      return
    }
    if (
      href === '/cursos/configuracao-mental' ||
      href === '/cursos/configuracao-mental/aula-2-quem-voce-e-com-dinheiro'
    ) {
      onNavigate('courses')
      return
    }
    if (href === '/cursos/meu-primeiro-dividendo/aula-3-renda-fixa') {
      onNavigate('course1')
      return
    }
    if (href === '/cursos/meu-primeiro-dividendo/aula-4-renda-variavel') {
      onNavigate('course1')
      return
    }
    if (href === '/cursos/meu-primeiro-dividendo/aula-5-fiis') {
      onNavigate('course1')
      return
    }
    if (href === '/cursos/meu-primeiro-dividendo/aula-6-dividendos') {
      onNavigate('course1')
      return
    }
    if (href === '/cursos/meu-primeiro-dividendo/aula-7-estrategia-de-renda-passiva') {
      onNavigate('course1')
      return
    }
    if (href === '/cursos/configuracao-mental/aula-3-escolhas-que-constroem-o-futuro') {
      onNavigate('course2')
      return
    }
    if (href === '/cursos/configuracao-mental/aula-4-estabilidade-emocional') {
      onNavigate('course2')
      return
    }
    if (href === '/cursos/configuracao-mental/aula-5-construcao-do-mindset-investidor') {
      onNavigate('course2')
      return
    }
    if (href === '/cursos/configuracao-mental/aula-6-dividendos-simbolo-de-transformacao') {
      onNavigate('course2')
    }
  }

  const isLessonCompleted = (link) => {
    if (!link?.course || !link?.moduleId) return false
    if (link.course === 'course1') return completedCourse1Modules.includes(link.moduleId)
    if (link.course === 'course2') return completedCourse2Modules.includes(link.moduleId)
    return false
  }

  useEffect(() => {
    setReserveValueInput(formatCurrencyValue(phase2ReserveValue))
  }, [phase2ReserveValue])

  useEffect(() => {
    setInvestmentValueInput(formatCurrencyValue(phase3InvestmentValue))
  }, [phase3InvestmentValue])

  useEffect(() => {
    setDividendGoalInput(formatCurrencyValue(phase4DividendGoalValue))
  }, [phase4DividendGoalValue])

  useEffect(() => {
    setPassiveIncomeInput(formatCurrencyValue(phase5PassiveIncomeValue))
  }, [phase5PassiveIncomeValue])

  return (
    <div className="h-screen bg-[linear-gradient(120deg,#f7f3eb_0%,#f4f7f6_52%,#e7f4f6_100%)] px-4 py-6 md:px-8">
      <div className="mx-auto h-full w-full max-w-7xl">
        <section className="rounded-3xl border border-white/70 bg-white/75 px-6 py-8 shadow-[0_10px_36px_rgba(15,23,42,0.06)] backdrop-blur md:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-800 md:text-5xl">
              Sua Jornada de Evolução Financeira
            </h1>
            <div className="mx-auto mt-2 flex w-full max-w-2xl items-center gap-3">
              <span className="shrink-0 text-sm font-medium text-slate-700">Progresso da fase:</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${phaseProgress}%` }} />
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-800">{`${phaseProgress}%`}</span>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_10px_36px_rgba(15,23,42,0.06)] backdrop-blur md:p-6">
          <div className="flex items-start justify-between gap-1">
            {PHASES.map((phase, index) => {
              const isSelected = selectedPhase === phase.id
              const isAttentionPhase = attentionPhaseId === phase.id
              const isPhase1 = phase.id === 1
              const isPhase2 = phase.id === 2
              const isPhase3 = phase.id === 3
              const isPhase4 = phase.id === 4
              const isPhase5 = phase.id === 5
              const isPhaseEnabled =
                isPhase1 ||
                (isPhase2 && phase2Unlocked) ||
                (isPhase3 && phase3Unlocked) ||
                (isPhase4 && phase4Unlocked) ||
                (isPhase5 && phase5Unlocked) ||
                (phase.id === 6 && phase6Unlocked)
              const isGreen =
                (isPhase1 && phase1Completed) ||
                (isPhase2 && phase2Completed) ||
                (isPhase3 && phase3Completed) ||
                (isPhase4 && phase4Completed) ||
                (isPhase5 && phase5Completed)

              return (
                <div key={phase.id} className="flex min-w-0 flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPhaseEnabled) return
                      setSelectedPhase(phase.id)
                      setIsPhaseModalOpen(true)
                    }}
                    className="group flex w-full min-w-0 flex-col items-center text-center disabled:cursor-not-allowed"
                    disabled={!isPhaseEnabled}
                  >
                    <span
                      className={[
                        'inline-flex h-10 w-full min-w-0 max-w-[120px] items-center justify-center rounded-full border px-2 text-sm font-semibold text-white transition md:h-11 md:text-base',
                        isGreen
                          ? 'border-emerald-700 bg-emerald-600'
                          : 'border-red-500 bg-red-500',
                        isAttentionPhase ? 'animate-pulse' : '',
                        isSelected ? 'ring-2 ring-slate-200 md:ring-4' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {`Fase ${phase.id}`}
                    </span>
                    <span
                      className={[
                        'mt-2 max-w-[120px] text-xs font-medium leading-5 md:text-sm',
                        isGreen
                          ? 'text-emerald-700'
                          : isAttentionPhase
                            ? 'text-red-700'
                            : 'text-slate-700',
                      ].join(' ')}
                    >
                      {phase.title}
                    </span>
                  </button>
                  {index < PHASES.length - 1 && (
                    <span className="mx-1 mt-5 h-[2px] flex-1 min-w-[8px] bg-slate-300" />
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {isPhaseModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => setIsPhaseModalOpen(false)}
        >
          <section
            className="h-[95vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.28)] backdrop-blur md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-start justify-between gap-4">
              <h2 className="-mt-3 text-3xl font-semibold text-slate-800 md:-mt-4 md:text-[40px]">
                {details ? details.title.replace(/^Fase\s+\d+:\s*/, '') : `${selectedPhase}`}
              </h2>
              <button
                type="button"
                onClick={() => setIsPhaseModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                aria-label="Fechar conteúdo da fase"
              >
                ×
              </button>
            </div>

            {details ? (
              <>
                <div className="mt-0">
                  <p className="text-lg leading-7 text-slate-700">
                    <span className="font-semibold text-slate-800">Objetivo:</span> {details.objective}
                  </p>
                </div>

                <div className="mt-2">
                  <h3 className="text-2xl font-semibold text-slate-800">Ações no app</h3>
                  <div className="mt-2 space-y-2">
                    {details.actions.map((action, index) => (
                      <div
                        key={`${selectedPhase}-action-${index}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        {selectedPhase === 1 && action.text === 'Ver quanto sobra' ? (
                          <p className="text-lg leading-7 text-slate-800">
                            {expensesInsight.hasData ? (
                              <>
                                Sua média total de despesas é{' '}
                                <strong>{formatBRL.format(expensesInsight.averageExpense)}</strong> e o percentual
                                gasto é <strong>{expensesInsight.percentSpent.toFixed(1)}%</strong> do que você
                                recebe.{' '}
                                {expensesInsight.isNegative ? (
                                  <strong className="text-red-600">Exige atenção.</strong>
                                ) : (
                                  <strong className="text-emerald-700">Parabéns.</strong>
                                )}
                              </>
                            ) : (
                              'Sua média total de despesas ainda não pode ser calculada. Preencha os últimos meses para analisar o percentual gasto.'
                            )}
                          </p>
                        ) : (
                          <div className="flex w-full flex-wrap items-center gap-3">
                            <p className="text-lg leading-7 text-slate-800">{action.text}</p>
                            {selectedPhase === 2 && action.text === 'Definir valor da reserva' ? (
                              <>
                                <div
                                  className={[
                                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition',
                                    phase2ReserveValue && phase2ReserveValue > 0
                                      ? 'border-emerald-200 bg-emerald-50'
                                      : 'border-slate-300 bg-slate-100',
                                  ].join(' ')}
                                >
                                  <span
                                    className={[
                                      'text-xs font-semibold',
                                      phase2ReserveValue && phase2ReserveValue > 0
                                        ? 'text-emerald-700'
                                        : 'text-slate-600',
                                    ].join(' ')}
                                  >
                                    R$
                                  </span>
                                  <input
                                    id="reserve-value-input"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="10.000,00"
                                    value={reserveValueInput}
                                    onChange={(event) => {
                                      const masked = sanitizeCurrencyInput(event.target.value)
                                      setReserveValueInput(masked)
                                      if (onPhase2ReserveValueChange) {
                                        onPhase2ReserveValueChange(parseCurrencyValue(masked))
                                      }
                                    }}
                                    className="w-28 border-0 bg-transparent p-0 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-500"
                                  />
                                </div>
                                {phase2ReserveValue && phase2ReserveValue > 0 ? (
                                  <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    <img src={tickerDone} alt="" className="h-4 w-4" />
                                    Concluída
                                  </span>
                                ) : null}
                                <div className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                                  <p>1- Calcule seus gastos mensais, (você fez isso na fase 1)</p>
                                  <p>2- Multiplique por 3 a 6</p>
                                  <p>3- Defina o valor da reseva ideal considere os pontos 1 e 2</p>
                                </div>
                              </>
                            ) : null}
                            {selectedPhase === 3 && action.text === 'Defina o valor a investir mensalmente' ? (
                              <>
                                <div
                                  className={[
                                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition',
                                    phase3InvestmentValue && phase3InvestmentValue > 0
                                      ? 'border-emerald-200 bg-emerald-50'
                                      : 'border-slate-300 bg-slate-100',
                                  ].join(' ')}
                                >
                                  <span
                                    className={[
                                      'text-xs font-semibold',
                                      phase3InvestmentValue && phase3InvestmentValue > 0
                                        ? 'text-emerald-700'
                                        : 'text-slate-600',
                                    ].join(' ')}
                                  >
                                    R$
                                  </span>
                                  <input
                                    id="investment-value-input"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="10.000,00"
                                    value={investmentValueInput}
                                    onChange={(event) => {
                                      const masked = sanitizeCurrencyInput(event.target.value)
                                      setInvestmentValueInput(masked)
                                      if (onPhase3InvestmentValueChange) {
                                        onPhase3InvestmentValueChange(parseCurrencyValue(masked))
                                      }
                                    }}
                                    className="w-28 border-0 bg-transparent p-0 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-500"
                                  />
                                </div>
                                {phase3InvestmentValue && phase3InvestmentValue > 0 ? (
                                  <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    <img src={tickerDone} alt="" className="h-4 w-4" />
                                    Concluída
                                  </span>
                                ) : null}
                                <div className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                                  <p>Defina um valor objetivo para iniciar seus investimentos.</p>
                                </div>
                              </>
                            ) : null}
                            {selectedPhase === 4 &&
                            action.text ===
                              'Defina uma meta de dividendos mensais que você planeja receber' ? (
                              <>
                                <div
                                  className={[
                                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition',
                                    phase4DividendGoalValue && phase4DividendGoalValue > 0
                                      ? 'border-emerald-200 bg-emerald-50'
                                      : 'border-slate-300 bg-slate-100',
                                  ].join(' ')}
                                >
                                  <span
                                    className={[
                                      'text-xs font-semibold',
                                      phase4DividendGoalValue && phase4DividendGoalValue > 0
                                        ? 'text-emerald-700'
                                        : 'text-slate-600',
                                    ].join(' ')}
                                  >
                                    R$
                                  </span>
                                  <input
                                    id="dividend-goal-input"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="1.000,00"
                                    value={dividendGoalInput}
                                    onChange={(event) => {
                                      const masked = sanitizeCurrencyInput(event.target.value)
                                      setDividendGoalInput(masked)
                                      if (onPhase4DividendGoalValueChange) {
                                        onPhase4DividendGoalValueChange(parseCurrencyValue(masked))
                                      }
                                    }}
                                    className="w-28 border-0 bg-transparent p-0 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-500"
                                  />
                                </div>
                                {phase4DividendGoalValue && phase4DividendGoalValue > 0 ? (
                                  <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    <img src={tickerDone} alt="" className="h-4 w-4" />
                                    Concluída
                                  </span>
                                ) : null}
                                <div className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                                  <p>
                                    Defina seu objetivo de renda mensal com dividendos para acompanhar sua evolução.
                                  </p>
                                </div>
                              </>
                            ) : null}
                            {selectedPhase === 5 &&
                            action.text ===
                              'Defina uma meta de renda passiva mensal para crescer ao longo do tempo' ? (
                              <>
                                <div
                                  className={[
                                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition',
                                    phase5PassiveIncomeValue && phase5PassiveIncomeValue > 0
                                      ? 'border-emerald-200 bg-emerald-50'
                                      : 'border-slate-300 bg-slate-100',
                                  ].join(' ')}
                                >
                                  <span
                                    className={[
                                      'text-xs font-semibold',
                                      phase5PassiveIncomeValue && phase5PassiveIncomeValue > 0
                                        ? 'text-emerald-700'
                                        : 'text-slate-600',
                                    ].join(' ')}
                                  >
                                    R$
                                  </span>
                                  <input
                                    id="passive-income-goal-input"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="2.000,00"
                                    value={passiveIncomeInput}
                                    onChange={(event) => {
                                      const masked = sanitizeCurrencyInput(event.target.value)
                                      setPassiveIncomeInput(masked)
                                      if (onPhase5PassiveIncomeValueChange) {
                                        onPhase5PassiveIncomeValueChange(parseCurrencyValue(masked))
                                      }
                                    }}
                                    className="w-28 border-0 bg-transparent p-0 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-500"
                                  />
                                </div>
                                {phase5PassiveIncomeValue && phase5PassiveIncomeValue > 0 ? (
                                  <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    <img src={tickerDone} alt="" className="h-4 w-4" />
                                    Concluída
                                  </span>
                                ) : null}
                                <div className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                                  <p>
                                    Defina sua meta de renda passiva mensal para acompanhar o crescimento da sua estratégia.
                                  </p>
                                </div>
                              </>
                            ) : null}
                          </div>
                        )}
                        {action.href && action.linkLabel ? (
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <a
                              href={action.href}
                              onClick={(event) => {
                                event.preventDefault()
                                navigateFromPath(action.href)
                                setIsPhaseModalOpen(false)
                              }}
                              className="inline-flex text-base font-semibold text-emerald-700 underline underline-offset-4 transition hover:text-emerald-800"
                            >
                              {action.linkLabel}
                            </a>
                            {action.href === '/despesas' && hasAtLeastThreeSavedExpenseMonths ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <img src={tickerDone} alt="" className="h-4 w-4" />
                                Concluída
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-2xl font-semibold text-slate-800">Conteúdo liberado</h3>

                <div className="mt-4">
                  <p className="text-lg leading-8 text-slate-700">
                    <span className="font-semibold text-slate-800">{`${details.released.trail}:`}</span>{' '}
                    {details.released.text}
                  </p>

                  {details.released.links?.length ? (
                    <div className="mt-3 flex flex-col gap-2">
                      {details.released.links.map((link, index) => (
                        <div
                          key={`${selectedPhase}-released-link-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-2"
                        >
                          <a
                            href={link.href}
                            onClick={(event) => {
                              event.preventDefault()
                              navigateFromPath(link.href)
                              setIsPhaseModalOpen(false)
                            }}
                            className="inline-flex text-base font-semibold text-emerald-700 underline underline-offset-4 transition hover:text-emerald-800"
                          >
                            {link.label}
                          </a>
                          {isLessonCompleted(link) ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <img src={tickerDone} alt="" className="h-4 w-4" />
                              Concluída
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                    {details.released.bullets.length ? (
                      <ul className="mt-4 space-y-2 text-lg leading-8 text-slate-700">
                        {details.released.bullets.map((bullet, index) => (
                          <li key={`${selectedPhase}-bullet-${index}`} className="flex items-start gap-3">
                            <span className="mt-[10px] h-2 w-2 rounded-full bg-slate-400" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  Conteúdo desta fase ainda não está definido nesta página.
                </p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}

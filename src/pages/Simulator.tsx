import { type ReactNode, useEffect, useMemo, useState } from 'react'

type Scenario = {
  label: string
  rate: number
  value: number
}

type InfoContent = {
  label: string
  description: string
}

type SimulationMode = 'regular' | 'previdencia'

const REGULAR_PARAMETER_INFO: Record<string, InfoContent> = {
  initial: {
    label: 'Aporte inicial (R$)',
    description:
      'Valor que você já tem para começar a investir hoje. Se estiver iniciando do zero, pode preencher 0.',
  },
  monthly: {
    label: 'Aporte mensal (R$)',
    description:
      'Valor que você pretende investir todos os meses de forma recorrente. Use uma média realista do que cabe no seu orçamento.',
  },
  years: {
    label: 'Prazo (anos)',
    description:
      'Tempo que o dinheiro ficará investido até o objetivo. Quanto maior o prazo, maior o efeito dos juros compostos.',
  },
  rate: {
    label: 'Rentabilidade anual (%)',
    description:
      'Retorno médio anual esperado do investimento, em termos nominais (antes de descontar a inflação).',
  },
  inflation: {
    label: 'Inflação anual (%)',
    description:
      'Estimativa de inflação média por ano. Ela é usada para mostrar o valor real (poder de compra) do patrimônio no futuro.',
  },
}

const PREVIDENCIA_PARAMETER_INFO: Record<string, InfoContent> = {
  currentAge: {
    label: 'Idade atual',
    description:
      'Idade no momento da simulação. Junto com a idade de aposentadoria, define o horizonte principal de contribuição.',
  },
  freedomAge: {
    label: 'Idade de aposentadoria',
    description:
      'Idade estimada para começar a usufruir da renda da previdência privada.',
  },
  initial: {
    label: 'Reserva inicial (R$)',
    description:
      'Valor já acumulado no plano de previdência ou que será aportado no início.',
  },
  monthly: {
    label: 'Contribuição mensal (R$)',
    description:
      'Valor de contribuição mensal ao plano. Considere uma contribuição recorrente realista.',
  },
  years: {
    label: 'Prazo complementar (anos)',
    description:
      'Usado apenas quando não houver idade atual e idade de aposentadoria preenchidas de forma válida.',
  },
  pensionFee: {
    label: 'Taxa anual do plano (%)',
    description:
      'Taxa anual total estimada do plano (administração e outros custos recorrentes).',
  },
  rate: {
    label: 'Rentabilidade anual bruta (%)',
    description:
      'Retorno anual estimado antes de custos do plano. A simulação desconta a taxa anual do plano para estimar rentabilidade líquida.',
  },
  inflation: {
    label: 'Inflação anual (%)',
    description:
      'Inflação anual esperada para calcular o valor real (poder de compra) do patrimônio acumulado.',
  },
}

const SIMULATION_MODE_META: Record<SimulationMode, { title: string; description: string }> = {
  regular: {
    title: 'Simulação regular',
    description: 'Aportes diretos com foco em liberdade financeira geral.',
  },
  previdencia: {
    title: 'Simulação de previdência',
    description: 'Aportes com foco em aposentadoria e acumulação de longo prazo.',
  },
}

const YEAR_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 25, 30, 35, 40]
const INCOME_DURATION_OPTIONS = [10, 15, 20, 25, 30, 35, 40]

const sanitizeNumericInput = (value: string) => {
  const cleaned = value.replace(/[^0-9.,]/g, '')
  if (!cleaned) return ''
  if (cleaned.includes(',')) {
    const [intPart, ...rest] = cleaned.split(',')
    const integer = intPart.replace(/[.,]/g, '')
    const decimal = rest.join('').replace(/[.,]/g, '')
    if (decimal.length > 0) return `${integer},${decimal}`
    return cleaned.trim().endsWith(',') ? `${integer},` : integer
  }
  const [intPart, ...rest] = cleaned.split('.')
  const integer = intPart.replace(/[.,]/g, '')
  const decimal = rest.join('').replace(/[.,]/g, '')
  if (decimal.length > 0) return `${integer}.${decimal}`
  return cleaned.trim().endsWith('.') ? `${integer}.` : integer
}

const toNumber = (value: string) => {
  if (!value) return 0
  const cleaned = value.replace(/[^0-9.,]/g, '')
  if (!cleaned) return 0
  let normalized = ''
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    const [intPart, ...rest] = cleaned.split('.')
    const integer = intPart.replace(/[.,]/g, '')
    const decimal = rest.join('').replace(/[.,]/g, '')
    normalized = decimal.length > 0 ? `${integer}.${decimal}` : integer
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const monthlyRateFromAnnual = (annualRate: number) => {
  if (annualRate <= 0) return 0
  return Math.pow(1 + annualRate / 100, 1 / 12) - 1
}

const monthlyRateFromAnnualAny = (annualRate: number) => {
  const annualDecimal = annualRate / 100
  if (annualDecimal <= -1) return -1
  return Math.pow(1 + annualDecimal, 1 / 12) - 1
}

const futureValue = (initial: number, monthly: number, years: number, annualRate: number) => {
  const n = Math.max(0, Math.round(years * 12))
  const r = monthlyRateFromAnnual(annualRate)
  if (n === 0) return initial
  if (r === 0) return initial + monthly * n
  return initial * Math.pow(1 + r, n) + monthly * ((Math.pow(1 + r, n) - 1) / r)
}

type SimulatorPageProps = {
  onOpenMenu?: () => void
}

export function SimulatorPage({ onOpenMenu }: SimulatorPageProps = {}) {
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('regular')
  const [currentAge, setCurrentAge] = useState('35')
  const [freedomAge, setFreedomAge] = useState('55')
  const [initial, setInitial] = useState('5000')
  const [monthly, setMonthly] = useState('700')
  const [years, setYears] = useState('10')
  const [rate, setRate] = useState('10')
  const [inflation, setInflation] = useState('4,4')
  const [pensionFee, setPensionFee] = useState('1,2')
  const [openInfoId, setOpenInfoId] = useState<string | null>(null)
  const [incomeDuration, setIncomeDuration] = useState('25')

  useEffect(() => {
    if (!openInfoId) return

    const handleOutsideClick = (event: MouseEvent) => {
      const rawTarget = event.target
      if (!rawTarget || !(rawTarget instanceof Node)) return

      const target =
        rawTarget instanceof Element ? rawTarget : (rawTarget.parentElement ?? null)
      if (!target) {
        setOpenInfoId(null)
        return
      }

      if (target.closest('[data-simulator-info-root="true"]')) {
        return
      }

      setOpenInfoId(null)
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    return () => document.removeEventListener('pointerdown', handleOutsideClick)
  }, [openInfoId])

  const formatNumber = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )

  const formatInputNumber = (value: string) => {
    if (!value.trim()) return ''
    const parsed = toNumber(value)
    if (!Number.isFinite(parsed)) return ''
    return formatNumber.format(parsed)
  }

  const results = useMemo(() => {
    const parameterInfo =
      simulationMode === 'previdencia' ? PREVIDENCIA_PARAMETER_INFO : REGULAR_PARAMETER_INFO
    const currentAgeValue =
      simulationMode === 'previdencia' ? Math.max(0, Math.round(toNumber(currentAge))) : 0
    const freedomAgeValue =
      simulationMode === 'previdencia' ? Math.max(0, Math.round(toNumber(freedomAge))) : 0
    const yearsFromAges =
      simulationMode === 'previdencia' ? Math.max(0, freedomAgeValue - currentAgeValue) : 0
    const initialValue = Math.max(0, toNumber(initial))
    const monthlyValue = Math.max(0, toNumber(monthly))
    const yearsInputValue = Math.max(0, toNumber(years))
    const yearsValue =
      simulationMode === 'previdencia' && yearsFromAges > 0 ? yearsFromAges : yearsInputValue
    const grossRateValue = Math.max(0, toNumber(rate))
    const inflationValue = Math.max(0, toNumber(inflation))
    const pensionFeeValue = simulationMode === 'previdencia' ? Math.max(0, toNumber(pensionFee)) : 0
    const rateValue = Math.max(0, grossRateValue - pensionFeeValue)

    const totalContributed = initialValue + monthlyValue * Math.round(yearsValue * 12)
    const totalFuture = futureValue(initialValue, monthlyValue, yearsValue, rateValue)
    const gain = totalFuture - totalContributed
    const realValue =
      inflationValue > 0
        ? totalFuture / Math.pow(1 + inflationValue / 100, yearsValue)
        : totalFuture
    const realAnnualRate =
      inflationValue > 0
        ? (((1 + rateValue / 100) / (1 + inflationValue / 100) - 1) * 100)
        : rateValue

    const scenarios: Scenario[] = [
      {
        label: 'Conservador',
        rate: Math.max(0, rateValue - (simulationMode === 'previdencia' ? 1 : 2)),
        value: 0,
      },
      { label: 'Base', rate: rateValue, value: 0 },
      {
        label: 'Otimista',
        rate: rateValue + (simulationMode === 'previdencia' ? 1 : 2),
        value: 0,
      },
    ].map((item) => ({
      ...item,
      value: futureValue(initialValue, monthlyValue, yearsValue, item.rate),
    }))

    return {
      currentAgeValue,
      freedomAgeValue,
      yearsFromAges,
      totalContributed,
      totalFuture,
      gain,
      realValue,
      yearsValue,
      rateValue,
      inflationValue,
      grossRateValue,
      pensionFeeValue,
      realAnnualRate,
      parameterInfo,
      theoreticalRealMonthlyYield: totalFuture * monthlyRateFromAnnualAny(realAnnualRate),
      sustainableMonthlyIncomeReal4: realValue * (0.04 / 12),
      scenarios,
    }
  }, [simulationMode, currentAge, freedomAge, initial, monthly, years, rate, inflation, pensionFee])

  const baseScenarioValue =
    results.scenarios.find((item) => item.label === 'Base')?.value ?? results.totalFuture
  const parameterInfo =
    simulationMode === 'previdencia' ? PREVIDENCIA_PARAMETER_INFO : REGULAR_PARAMETER_INFO
  const roundedYears = Math.max(0, Math.round(results.yearsValue))
  const selectedYearsValue = String(roundedYears || 1)
  const yearSelectOptions = YEAR_OPTIONS.includes(roundedYears)
    ? YEAR_OPTIONS
    : [...YEAR_OPTIONS, roundedYears].filter((value) => value > 0).sort((a, b) => a - b)
  const isLifetimeIncome = incomeDuration === 'vitalicia'
  const incomeDurationYears = isLifetimeIncome ? 0 : Math.max(1, Math.round(toNumber(incomeDuration)))
  const incomeDurationMonths = incomeDurationYears * 12
  const realMonthlyRate = monthlyRateFromAnnualAny(results.realAnnualRate)
  const estimatedMonthlyIncome = useMemo(() => {
    if (results.realValue <= 0) return 0
    if (isLifetimeIncome) return results.realValue * (0.04 / 12)
    if (incomeDurationMonths <= 0) return 0
    if (Math.abs(realMonthlyRate) < 0.000001) return results.realValue / incomeDurationMonths

    const denominator = 1 - Math.pow(1 + realMonthlyRate, -incomeDurationMonths)
    if (Math.abs(denominator) < 0.000001) return 0

    return results.realValue * (realMonthlyRate / denominator)
  }, [results.realValue, isLifetimeIncome, incomeDurationMonths, realMonthlyRate])

  const renderInfoButton = (id: string, ariaLabel: string, content: ReactNode) => {
    const isOpen = openInfoId === id

    return (
      <span className="simulator-info-wrap" data-simulator-info-root="true">
        <button
          type="button"
          className="simulator-info-btn"
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          onClick={() => setOpenInfoId((prev) => (prev === id ? null : id))}
        >
          i
        </button>
        {isOpen ? (
          <div className="simulator-info-card" role="note">
            {content}
          </div>
        ) : null}
      </span>
    )
  }

  return (
    <section className="simulator-page">
      <header className="simulator-hero">
        <div>
          {onOpenMenu ? (
            <button className="course-back" onClick={onOpenMenu}>
              Menu
            </button>
          ) : null}
          <h1 className="simulator-title">Simulador</h1>
          <p className="simulator-subtitle">
            {SIMULATION_MODE_META[simulationMode].description}
          </p>
        </div>
        <div className="simulator-mode-switch" role="tablist" aria-label="Modo de simulação">
          <button
            type="button"
            role="tab"
            aria-selected={simulationMode === 'regular'}
            className={`simulator-mode-card ${simulationMode === 'regular' ? 'is-active' : ''}`}
            onClick={() => setSimulationMode('regular')}
          >
            <strong>{SIMULATION_MODE_META.regular.title}</strong>
            <span>Parâmetros de investimentos gerais</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={simulationMode === 'previdencia'}
            className={`simulator-mode-card ${simulationMode === 'previdencia' ? 'is-active' : ''}`}
            onClick={() => setSimulationMode('previdencia')}
          >
            <strong>{SIMULATION_MODE_META.previdencia.title}</strong>
            <span>Parâmetros voltados para aposentadoria</span>
          </button>
        </div>
      </header>

      <div className="simulator-grid">
        <div
          className={`simulator-card simulator-form ${simulationMode === 'previdencia' ? 'simulator-form--previdencia' : ''}`}
        >
          <h2>Parâmetros</h2>
          {simulationMode === 'previdencia' ? (
            <>
              <div className="simulator-field">
                <div className="simulator-field__head">
                  <label>{PREVIDENCIA_PARAMETER_INFO.currentAge.label}</label>
                  {renderInfoButton(
                    'currentAge',
                    'Entender idade atual',
                    <p>{PREVIDENCIA_PARAMETER_INFO.currentAge.description}</p>
                  )}
                </div>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={currentAge}
                  onChange={(event) => setCurrentAge(event.target.value)}
                />
              </div>
              <div className="simulator-field">
                <div className="simulator-field__head">
                  <label>{PREVIDENCIA_PARAMETER_INFO.freedomAge.label}</label>
                  {renderInfoButton(
                    'freedomAge',
                    'Entender idade de aposentadoria',
                    <p>{PREVIDENCIA_PARAMETER_INFO.freedomAge.description}</p>
                  )}
                </div>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={freedomAge}
                  onChange={(event) => setFreedomAge(event.target.value)}
                />
              </div>
            </>
          ) : null}
          <div className="simulator-field">
            <div className="simulator-field__head">
              <label>{parameterInfo.initial.label}</label>
              {renderInfoButton(
                'initial',
                'Entender aporte inicial',
                <p>{parameterInfo.initial.description}</p>
              )}
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={initial}
              onChange={(event) => setInitial(sanitizeNumericInput(event.target.value))}
              onBlur={() => setInitial(formatInputNumber(initial))}
            />
          </div>
          <div className="simulator-field">
            <div className="simulator-field__head">
              <label>{parameterInfo.monthly.label}</label>
              {renderInfoButton(
                'monthly',
                'Entender aporte mensal',
                <p>{parameterInfo.monthly.description}</p>
              )}
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={monthly}
              onChange={(event) => setMonthly(sanitizeNumericInput(event.target.value))}
              onBlur={() => setMonthly(formatInputNumber(monthly))}
            />
          </div>
          <div className="simulator-field">
            <div className="simulator-field__head">
              <label>{parameterInfo.years.label}</label>
              {renderInfoButton(
                'years',
                'Entender prazo em anos',
                <p>{parameterInfo.years.description}</p>
              )}
            </div>
            <input
              type="number"
              min={0}
              step="1"
              value={years}
              onChange={(event) => setYears(event.target.value)}
            />
            {results.yearsFromAges > 0 ? (
              <small className="simulator-metric-hint">
                Prazo automatico pelas idades: {results.yearsFromAges} anos.
              </small>
            ) : null}
          </div>
          {simulationMode === 'previdencia' ? (
            <div className="simulator-field">
              <div className="simulator-field__head">
                <label>{PREVIDENCIA_PARAMETER_INFO.pensionFee.label}</label>
                {renderInfoButton(
                  'pensionFee',
                  'Entender taxa anual do plano',
                  <p>{PREVIDENCIA_PARAMETER_INFO.pensionFee.description}</p>
                )}
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={pensionFee}
                onChange={(event) => setPensionFee(sanitizeNumericInput(event.target.value))}
                onBlur={() => setPensionFee(formatInputNumber(pensionFee))}
              />
            </div>
          ) : null}
          <div className="simulator-field">
            <div className="simulator-field__head">
              <label>{parameterInfo.rate.label}</label>
              {renderInfoButton(
                'rate',
                'Entender rentabilidade anual',
                <p>{parameterInfo.rate.description}</p>
              )}
            </div>
            <input
              type="number"
              min={0}
              step="0.1"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
            />
          </div>
          <div className="simulator-field">
            <div className="simulator-field__head">
              <label>{parameterInfo.inflation.label}</label>
              {renderInfoButton(
                'inflation',
                  'Entender inflação anual',
                <p>{parameterInfo.inflation.description}</p>
              )}
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={inflation}
              onChange={(event) => setInflation(sanitizeNumericInput(event.target.value))}
              onBlur={() => setInflation(formatInputNumber(inflation))}
            />
          </div>
          <div className="simulator-note">
            Os valores são estimativas e não representam recomendação de investimento.
            {simulationMode === 'previdencia'
              ? ` Rentabilidade líquida usada: ${results.rateValue.toFixed(2)}% a.a. (bruta ${results.grossRateValue.toFixed(2)}% - taxa ${results.pensionFeeValue.toFixed(2)}%).`
              : ''}
          </div>
        </div>

        <div className="simulator-card simulator-results">
          <div className="simulator-results__head">
            <h2>Seu cenário em</h2>
            <select
              className="simulator-select simulator-results__years"
              aria-label="Selecionar prazo do cenário em anos"
              value={selectedYearsValue}
              onChange={(event) => setYears(event.target.value)}
            >
              {yearSelectOptions.map((option) => (
                <option key={option} value={option}>
                  {option} {option === 1 ? 'ano' : 'anos'}
                </option>
              ))}
            </select>
          </div>
          <div className="simulator-primary">
            <span className="simulator-metric__head">
              Patrimônio estimado
              {renderInfoButton(
                'patrimony-monthly-yield',
                'Entender quanto o patrimônio estimado rende por mês',
                <>
                  <p>
                    Mantendo a inflação atual de {results.inflationValue.toFixed(2)}% a.a.,
                    considere esta leitura:
                  </p>
                  <ul>
                    <li>
                      <strong>
                        R$ {formatNumber.format(results.theoreticalRealMonthlyYield)}/mês
                      </strong>{' '}
                      de rendimento mensal <strong>teórico</strong> em poder de compra de hoje
                      (se a taxa real média se confirmar).
                    </li>
                    <li>
                      <strong>
                        R$ {formatNumber.format(results.sustainableMonthlyIncomeReal4)}/mês
                      </strong>{' '}
                      como referência de{' '}
                      <strong>
                        {simulationMode === 'previdencia'
                          ? 'renda mensal sustentável'
                          : 'salário sustentável'}
                      </strong>{' '}
                      (retirada prudente de 4% a.a. do patrimônio real).
                    </li>
                  </ul>
                    <p>
                    Cálculo com taxa anual de {results.rateValue.toFixed(2)}% e taxa real de{' '}
                    {results.realAnnualRate.toFixed(2)}% a.a.
                  </p>
                  <p>
                    Prazo desse "salário" sustentável: tende a ser de longo prazo (décadas), mas
                    não é garantia.
                  </p>
                </>
              )}
            </span>
            <strong>R$ {formatNumber.format(results.totalFuture)}</strong>
          </div>

          <div
            className={`simulator-metrics ${simulationMode === 'previdencia' ? 'simulator-metrics--previdencia' : ''}`}
          >
            <div className="simulator-metric">
              <span>Total aportado</span>
              <strong>R$ {formatNumber.format(results.totalContributed)}</strong>
            </div>
            <div className="simulator-metric highlight">
              <span>Ganho estimado</span>
              <strong>R$ {formatNumber.format(results.gain)}</strong>
            </div>
            <div className="simulator-metric">
              <div className="simulator-metric__head">
                <span>Poder de compra (valor real)</span>
                {renderInfoButton(
                  'power',
                  'Entender poder de compra',
                  <>
                    <p>
                      O poder de compra é o valor do seu dinheiro já descontando a inflação.
                    </p>
                    <p>A logica e essa:</p>
                    <ul>
                      <li>Rentabilidade faz o dinheiro crescer.</li>
                      <li>Inflação faz o dinheiro perder valor.</li>
                    </ul>
                    <p>
                      Então o poder de compra mostra o resultado real, depois dessa
                      "briga".
                    </p>
                    <p>
                      <strong>
                        Poder de compra = patrimônio ajustado pela inflação.
                      </strong>
                    </p>
                  </>
                )}
              </div>
              <strong>R$ {formatNumber.format(results.realValue)}</strong>
              <p className="simulator-metric-hint">
                Rentabilidade real aproximada: {results.realAnnualRate.toFixed(2)}% a.a.
              </p>
            </div>
            {simulationMode === 'previdencia' ? (
              <div
                className="simulator-metric simulator-metric-income"
                data-simulator-info-root="true"
              >
                <div className="simulator-metric__head">
                  <span>Renda mensal possivel</span>
                  <span className="simulator-info-wrap" data-simulator-info-root="true">
                    <button
                      type="button"
                      className="simulator-info-btn"
                      aria-label="Entender renda mensal possivel"
                      aria-expanded={openInfoId === 'income'}
                      onClick={() =>
                        setOpenInfoId((prev) => (prev === 'income' ? null : 'income'))
                      }
                    >
                      i
                    </button>
                  </span>
                </div>
                <div className="simulator-income-controls">
                  <label htmlFor="income-duration">Prazo de uso</label>
                  <select
                    id="income-duration"
                    className="simulator-select simulator-income-controls__select"
                    aria-label="Selecionar por quanto tempo deseja usufruir da renda"
                    value={incomeDuration}
                    onChange={(event) => setIncomeDuration(event.target.value)}
                  >
                    {INCOME_DURATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option} anos
                      </option>
                    ))}
                    <option value="vitalicia">Vitalícia (4% a.a.)</option>
                  </select>
                </div>
                <strong>R$ {formatNumber.format(Math.max(0, estimatedMonthlyIncome))}/mês</strong>
                <p className="simulator-metric-hint">
                  {isLifetimeIncome
                    ? 'Modo vitalício usa retirada prudente de 4% ao ano.'
                    : `Estimativa para consumir o patrimônio em ${incomeDurationYears} anos.`}
                </p>
                {openInfoId === 'income' ? (
                  <div className="simulator-income-expand" role="note">
                    <p>
                      Pense no patrimônio como uma caixa d&apos;água: o prazo escolhido define o
                      tamanho da torneira mensal.
                    </p>
                    <ul>
                      <li>Prazo menor: renda maior por mes, mas termina antes.</li>
                      <li>Prazo maior: renda menor por mes, com mais folego no tempo.</li>
                      <li>Modo vitalício: referência conservadora para longo prazo.</li>
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="simulator-scenarios">
            {results.scenarios.map((scenario) => (
              <div key={scenario.label} className="simulator-scenario">
                <span>{scenario.label}</span>
                <small>{scenario.rate.toFixed(1)}% a.a.</small>
                <strong>R$ {formatNumber.format(scenario.value)}</strong>
                {scenario.label !== 'Base' ? (
                  <em
                    className={
                      scenario.value - baseScenarioValue >= 0
                        ? 'simulator-delta up'
                        : 'simulator-delta down'
                    }
                  >
                    {scenario.value - baseScenarioValue >= 0 ? '+' : '-'}R${' '}
                    {formatNumber.format(Math.abs(scenario.value - baseScenarioValue))} (
                    {baseScenarioValue > 0
                      ? `${(
                          (Math.abs(scenario.value - baseScenarioValue) / baseScenarioValue) *
                          100
                        ).toFixed(1)}%`
                      : '0.0%'}
                    )
                  </em>
                ) : (
                  <em className="simulator-delta neutral">Referência</em>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatBRL } from '../lib/format'

type PillarReturnType =
  | 'scenarioNominal'
  | 'fixedNominal'
  | 'realPlusInflation'
  | 'none'

type Pillar = {
  name: string
  pv: number
  monthlyContribution?: number
  monthlyIncome?: number
  returnType: PillarReturnType
  fixedRate: number | null
  enabled: boolean
  tone?: 'blue' | 'green' | 'teal' | 'amber'
  subtitle?: string
}

type PillarMap = Record<string, Pillar>

type PrevidenciaState = {
  currentAge: number
  targetAge: number
  targetMonthlyIncomeReal: number
  withdrawalRate: number
  showNetAfterTax: boolean
  taxRate: number
  inflation: number
  scenarioRates: [number, number, number]
  pillars: PillarMap
}

type ProjectionItem = {
  id: string
  name: string
  pv: number
  monthlyContribution: number
  rAnnualNominal: number
  rAnnualReal: number
  fv: number
}

type CustomAssetInput = {
  id: string
  name: string
  valueInput: string
  rateInput: string
}

type StructureDisplayRow = {
  id: string
  name: string
  subtitle: string
  value: number
  meta: string
  tone?: Pillar['tone']
}

type StructuredAsset = {
  id: string
  name: string
  value: number
  annualRateNominal: number | null
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)
const annualToMonthlyRate = (rAnnual: number) => Math.pow(1 + rAnnual, 1 / 12) - 1
const realToNominal = (rReal: number, inflation: number) => (1 + rReal) * (1 + inflation) - 1
const nominalToReal = (rNominal: number, inflation: number) => (1 + rNominal) / (1 + inflation) - 1

const futureValueLumpSum = (pv: number, rAnnual: number, years: number) =>
  pv * Math.pow(1 + rAnnual, years)

const futureValueMonthlyContrib = (pmt: number, rAnnual: number, years: number) => {
  const n = Math.max(0, Math.round(years * 12))
  if (n === 0) return 0
  const rm = annualToMonthlyRate(rAnnual)
  if (rm <= 0) return pmt * n
  return pmt * ((Math.pow(1 + rm, n) - 1) / rm)
}

const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`

const sparklineFromSeed = (seed: number) => {
  const points: number[] = []
  let current = 34 + seed * 4
  for (let i = 0; i < 24; i += 1) {
    const wave = Math.sin((i + seed) * 0.65) * 4 + Math.cos((i + 2) * 0.33) * 2.2
    current = clamp(current + wave, 18, 76)
    points.push(Number(current.toFixed(1)))
  }
  return points
}

const DEFAULTS: PrevidenciaState = {
  currentAge: 41,
  targetAge: 55,
  targetMonthlyIncomeReal: 8000,
  withdrawalRate: 0.05,
  showNetAfterTax: true,
  taxRate: 0.1,
  inflation: 0.04,
  scenarioRates: [0.06, 0.08, 0.09],
  pillars: {
    metlife: {
      name: 'MetLife',
      subtitle: 'Previdência',
      pv: 280000,
      monthlyContribution: 1000,
      returnType: 'scenarioNominal',
      fixedRate: null,
      enabled: true,
      tone: 'blue',
    },
    ipca2040: {
      name: 'IPCA+ 2040',
      subtitle: 'Reserva/âncora',
      pv: 100000,
      monthlyContribution: 0,
      returnType: 'realPlusInflation',
      fixedRate: 0.073,
      enabled: true,
      tone: 'green',
    },
    selic: {
      name: 'Selic/DI',
      subtitle: 'Liquidez',
      pv: 50000,
      monthlyContribution: 0,
      returnType: 'fixedNominal',
      fixedRate: 0.08,
      enabled: true,
      tone: 'teal',
    },
    eletrobras: {
      name: 'Eletrobras',
      subtitle: 'Tático',
      pv: 50000,
      monthlyContribution: 0,
      returnType: 'fixedNominal',
      fixedRate: 0.08,
      enabled: true,
      tone: 'amber',
    },
    inss: {
      name: 'INSS',
      subtitle: 'Adicional (fora da base)',
      pv: 0,
      monthlyContribution: 0,
      monthlyIncome: 0,
      returnType: 'none',
      fixedRate: null,
      enabled: false,
      tone: 'teal',
    },
  },
}

const scenarioLabels = ['Conservador', 'Base', 'Otimista'] as const

const parsePtBrInputNumber = (raw: string) => {
  const cleaned = raw.replace(/[^0-9.,-]/g, '').trim()
  if (!cleaned) return NaN
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned
  return Number(normalized)
}

type QAChoice = { label: string; value: string }

type QuestionnaireStep = {
  id: string
  stage: 'Objetivo' | 'Prazo' | 'Aportes' | 'Carteira' | 'Risco' | 'Resumo'
  prompt: string
  helper?: string
  placeholder?: string
  inputMode: 'text' | 'numeric'
  choices?: QAChoice[]
  isVisible?: (ctx: { state: PrevidenciaState; scenarioIndex: number }) => boolean
  getDraftValue: (state: PrevidenciaState, scenarioIndex: number) => string
  getAnswerLabel: (state: PrevidenciaState, scenarioIndex: number) => string
  applyAnswer: (
    raw: string,
    ctx: { state: PrevidenciaState; scenarioIndex: number }
  ) => { state?: PrevidenciaState; scenarioIndex?: number } | null
}

function computePillarRates(pillar: Pillar, scenarioNominal: number, inflation: number) {
  if (!pillar.enabled) return { nominal: 0, real: 0 }

  switch (pillar.returnType) {
    case 'scenarioNominal': {
      return {
        nominal: scenarioNominal,
        real: nominalToReal(scenarioNominal, inflation),
      }
    }
    case 'fixedNominal': {
      const nominal = typeof pillar.fixedRate === 'number' ? pillar.fixedRate : scenarioNominal
      return { nominal, real: nominalToReal(nominal, inflation) }
    }
    case 'realPlusInflation': {
      const real = pillar.fixedRate ?? 0
      return { nominal: realToNominal(real, inflation), real }
    }
    case 'none':
    default:
      return { nominal: 0, real: 0 }
  }
}

function computeProjectionReal(params: {
  pillars: PillarMap
  currentAge: number
  targetAge: number
  scenarioNominal: number
  inflation: number
}) {
  const { pillars, currentAge, targetAge, scenarioNominal, inflation } = params
  const years = Math.max(0, targetAge - currentAge)

  const items: ProjectionItem[] = Object.entries(pillars)
    .filter(([, p]) => p.enabled && p.returnType !== 'none')
    .map(([id, p]) => {
      const rates = computePillarRates(p, scenarioNominal, inflation)
      const fvLump = futureValueLumpSum(p.pv, rates.real, years)
      const monthlyContribution = p.monthlyContribution ?? 0
      const fvContrib = monthlyContribution
        ? futureValueMonthlyContrib(monthlyContribution, rates.real, years)
        : 0
      return {
        id,
        name: p.name,
        pv: p.pv,
        monthlyContribution,
        rAnnualNominal: rates.nominal,
        rAnnualReal: rates.real,
        fv: fvLump + fvContrib,
      }
    })

  const totalPV = items.reduce((acc, item) => acc + item.pv, 0)
  const totalFV = items.reduce((acc, item) => acc + item.fv, 0)
  const totalMonthlyContribution = items.reduce((acc, item) => acc + item.monthlyContribution, 0)

  return { years, items, totalPV, totalFV, totalMonthlyContribution }
}

function computeRequiredPortfolio(params: {
  targetMonthlyIncomeReal: number
  withdrawalRate: number
  showNetAfterTax: boolean
  taxRate: number
}) {
  const { targetMonthlyIncomeReal, withdrawalRate, showNetAfterTax, taxRate } = params
  const safeTax = clamp(taxRate, 0, 0.99)
  const monthlyGrossNeeded = showNetAfterTax
    ? targetMonthlyIncomeReal / Math.max(1e-9, 1 - safeTax)
    : targetMonthlyIncomeReal
  const annualGrossNeeded = monthlyGrossNeeded * 12
  return annualGrossNeeded / Math.max(1e-9, withdrawalRate)
}

function computeIncomeFromPortfolio(params: {
  portfolio: number
  withdrawalRate: number
  showNetAfterTax: boolean
  taxRate: number
}) {
  const { portfolio, withdrawalRate, showNetAfterTax, taxRate } = params
  const annualGross = portfolio * withdrawalRate
  const monthlyGross = annualGross / 12
  const monthlyNet = showNetAfterTax ? monthlyGross * (1 - clamp(taxRate, 0, 0.99)) : monthlyGross
  return { monthlyGross, monthlyNet }
}

function Sparkline({ points, activeIndex }: { points: number[]; activeIndex?: number }) {
  if (!points.length) return null
  const width = 320
  const height = 58
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = Math.max(1, max - min)
  const toX = (i: number) => (i / (points.length - 1)) * width
  const toY = (v: number) => height - ((v - min) / range) * (height - 8) - 4
  const line = points.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const area = `0,${height} ${line} ${width},${height}`
  const markerIndex = clamp(activeIndex ?? points.length - 1, 0, points.length - 1)
  const markerX = toX(markerIndex)
  const markerY = toY(points[markerIndex])

  return (
    <svg className="prev-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polygon points={area} className="prev-sparkline__area" />
      <polyline points={line} className="prev-sparkline__line" />
      <circle cx={markerX} cy={markerY} r="3.8" className="prev-sparkline__dot" />
    </svg>
  )
}

type PrevidenciaCardProps = {
  title?: string
  subtitle?: string
  children: ReactNode
  right?: ReactNode
  className?: string
}

function PrevidenciaCard({ title, subtitle, children, right, className }: PrevidenciaCardProps) {
  const hasHeader = Boolean(title || subtitle || right)
  return (
    <section className={`prev-card ${className ?? ''}`.trim()}>
      {hasHeader ? (
        <header className="prev-card__head">
          <div>
            {title ? <h2 className="prev-card__title">{title}</h2> : null}
            {subtitle ? <p className="prev-card__subtitle">{subtitle}</p> : null}
          </div>
          {right ? <div className="prev-card__right">{right}</div> : null}
        </header>
      ) : null}
      <div className="prev-card__body">{children}</div>
    </section>
  )
}

type MinhaPrevidenciaPageProps = {
  onOpenMenu?: () => void
}

export function MinhaPrevidenciaPage({ onOpenMenu }: MinhaPrevidenciaPageProps) {
  const [state, setState] = useState<PrevidenciaState>(DEFAULTS)
  const [scenarioIndex, setScenarioIndex] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [qaStepIndex, setQaStepIndex] = useState(0)
  const [qaDraft, setQaDraft] = useState('')
  const [qaError, setQaError] = useState<string | null>(null)
  const [qaHasTotalPatrimony, setQaHasTotalPatrimony] = useState<boolean | null>(null)
  const [qaDistributionApprox, setQaDistributionApprox] = useState('')
  const [qaAssetRows, setQaAssetRows] = useState<CustomAssetInput[]>([
    { id: 'asset-1', name: '', valueInput: '', rateInput: '' },
  ])
  const [qaStructuredAssets, setQaStructuredAssets] = useState<StructuredAsset[]>([])
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null)
  const settingsPopoverRef = useRef<HTMLDivElement | null>(null)
  const qaThreadRef = useRef<HTMLDivElement | null>(null)
  const qaCurrentBlockRef = useRef<HTMLDivElement | null>(null)

  const scenarioNominal = state.scenarioRates[scenarioIndex] ?? state.scenarioRates[1]
  const yearsToTarget = Math.max(0, state.targetAge - state.currentAge)
  const projectionPillars = useMemo<PillarMap>(() => {
    if (qaStructuredAssets.length === 0) return state.pillars

    const mapped = qaStructuredAssets.reduce<PillarMap>((acc, asset, index) => {
      const assetId = `qa-asset-${index + 1}`
      acc[assetId] = {
        name: asset.name,
        subtitle: 'Carteira informada',
        pv: asset.value,
        monthlyContribution: 0,
        returnType: asset.annualRateNominal == null ? 'scenarioNominal' : 'fixedNominal',
        fixedRate: asset.annualRateNominal,
        enabled: true,
        tone: ['blue', 'green', 'teal', 'amber'][index % 4] as Pillar['tone'],
      }
      return acc
    }, {})

    if (state.pillars.inss) {
      mapped.inss = state.pillars.inss
    }

    return mapped
  }, [qaStructuredAssets, state.pillars])

  const requiredPortfolio = useMemo(
    () =>
      computeRequiredPortfolio({
        targetMonthlyIncomeReal: state.targetMonthlyIncomeReal,
        withdrawalRate: state.withdrawalRate,
        showNetAfterTax: state.showNetAfterTax,
        taxRate: state.taxRate,
      }),
    [state.targetMonthlyIncomeReal, state.withdrawalRate, state.showNetAfterTax, state.taxRate]
  )

  const projection = useMemo(
    () =>
      computeProjectionReal({
        pillars: projectionPillars,
        currentAge: state.currentAge,
        targetAge: state.targetAge,
        scenarioNominal,
        inflation: state.inflation,
      }),
    [projectionPillars, state.currentAge, state.targetAge, scenarioNominal, state.inflation]
  )

  const incomeAtTarget = useMemo(
    () =>
      computeIncomeFromPortfolio({
        portfolio: projection.totalFV,
        withdrawalRate: state.withdrawalRate,
        showNetAfterTax: state.showNetAfterTax,
        taxRate: state.taxRate,
      }),
    [projection.totalFV, state.withdrawalRate, state.showNetAfterTax, state.taxRate]
  )

  const inssMonthly = state.pillars.inss?.enabled ? state.pillars.inss.monthlyIncome ?? 0 : 0
  const targetPrivateMonthly = state.showNetAfterTax ? incomeAtTarget.monthlyNet : incomeAtTarget.monthlyGross
  const totalMonthlyAtTarget = targetPrivateMonthly + inssMonthly
  const progressNow = requiredPortfolio > 0 ? projection.totalPV / requiredPortfolio : 0
  const remainingNow = Math.max(0, requiredPortfolio - projection.totalPV)

  const milestones = useMemo(() => {
    const ages = Array.from(new Set([45, 50, state.targetAge])).filter((age) => age > state.currentAge)
    return ages.map((age) => {
      const proj = computeProjectionReal({
        pillars: projectionPillars,
        currentAge: state.currentAge,
        targetAge: age,
        scenarioNominal,
        inflation: state.inflation,
      })
      const income = computeIncomeFromPortfolio({
        portfolio: proj.totalFV,
        withdrawalRate: state.withdrawalRate,
        showNetAfterTax: state.showNetAfterTax,
        taxRate: state.taxRate,
      })
      const privateMonthly = state.showNetAfterTax ? income.monthlyNet : income.monthlyGross
      return {
        age,
        portfolio: proj.totalFV,
        privateMonthly,
        totalMonthly: privateMonthly + inssMonthly,
        okPrivate: privateMonthly >= state.targetMonthlyIncomeReal,
      }
    })
  }, [
    projectionPillars,
    state.currentAge,
    state.targetAge,
    state.inflation,
    state.withdrawalRate,
    state.showNetAfterTax,
    state.taxRate,
    state.targetMonthlyIncomeReal,
    scenarioNominal,
    inssMonthly,
  ])

  const structureRows = useMemo<StructureDisplayRow[]>(() => {
    if (qaStructuredAssets.length > 0) {
      const tones: Array<Pillar['tone']> = ['blue', 'green', 'teal', 'amber']
      return [...qaStructuredAssets]
        .sort((a, b) => b.value - a.value)
        .map((asset, index) => ({
          id: asset.id,
          name: asset.name,
          subtitle: 'Carteira informada',
          value: asset.value,
          meta:
            asset.annualRateNominal == null
              ? `Taxa: cenário (${pct(scenarioNominal, 1)} a.a.)`
              : `Taxa: ${pct(asset.annualRateNominal, 1)} a.a.`,
          tone: tones[index % tones.length],
        }))
    }

    return Object.entries(state.pillars)
      .filter(([, p]) => p.enabled && p.returnType !== 'none')
      .map(([id, p]) => ({
        id,
        name: p.name,
        subtitle: p.subtitle ?? 'Pilar',
        value: p.pv,
        meta: p.monthlyContribution
          ? `Aporte: ${formatBRL.format(p.monthlyContribution)}/mês`
          : p.returnType === 'realPlusInflation'
            ? `Taxa real: ${pct(p.fixedRate ?? 0, 1)} a.a.`
            : p.returnType === 'fixedNominal'
              ? `Taxa: ${pct(p.fixedRate ?? 0, 1)} a.a.`
              : 'Acompanha cenário',
        tone: p.tone,
      }))
      .sort((a, b) => b.value - a.value)
  }, [state.pillars, qaStructuredAssets, scenarioNominal])

  const scenarioSpark = useMemo(() => sparklineFromSeed(scenarioIndex + 1), [scenarioIndex])
  const projectionSpark = useMemo(() => sparklineFromSeed(7), [])

  const toneClass = (tone?: Pillar['tone']) => `is-${tone ?? 'blue'}`

  const configuredQuestionnaireSteps = useMemo<QuestionnaireStep[]>(
    () => [
      {
        id: 'goal',
        stage: 'Objetivo',
        prompt:
          'Qual é o seu objetivo de renda mensal, salário que você espera ter ao alcançar sua liberdade financeira?',
        helper: 'Digite um valor em reais. Aceita formatos com ponto e vírgula (ex.: 8000, 8.000, 8.000,00).',
        placeholder: 'Ex.: 8.000,00',
        inputMode: 'numeric',
        choices: [
          { label: 'R$ 6.000', value: '6000' },
          { label: 'R$ 8.000', value: '8000' },
          { label: 'R$ 10.000', value: '10000' },
        ],
        getDraftValue: (s) => String(s.targetMonthlyIncomeReal),
        getAnswerLabel: (s) => `${formatBRL.format(s.targetMonthlyIncomeReal)}/mês`,
        applyAnswer: (raw, { state: s }) => {
          const value = parsePtBrInputNumber(raw)
          if (!Number.isFinite(value) || value <= 0) return null
          return { state: { ...s, targetMonthlyIncomeReal: Math.round(value) } }
        },
      },
      {
        id: 'target_age',
        stage: 'Prazo',
        prompt: 'Com quantos anos deseja ter liberdade financeira?',
        placeholder: 'Ex.: 55',
        inputMode: 'numeric',
        choices: [
          { label: '55 anos', value: '55' },
          { label: '60 anos', value: '60' },
          { label: '65 anos', value: '65' },
        ],
        getDraftValue: (s) => String(s.targetAge),
        getAnswerLabel: (s) => `${s.targetAge} anos`,
        applyAnswer: (raw, { state: s }) => {
          const value = Math.round(parsePtBrInputNumber(raw))
          if (!Number.isFinite(value) || value <= s.currentAge || value > 90) return null
          return { state: { ...s, targetAge: value } }
        },
      },
      {
        id: 'monthly_total_contrib',
        stage: 'Aportes',
        prompt: 'Quanto você investe mensalmente hoje?',
        helper: 'Informe o total de aportes mensais atuais. Vamos usar isso como referência no plano.',
        placeholder: 'Ex.: 1000',
        inputMode: 'numeric',
        choices: [
          { label: 'R$ 500', value: '500' },
          { label: 'R$ 1.000', value: '1000' },
          { label: 'R$ 2.000', value: '2000' },
        ],
        getDraftValue: (s) => String(s.pillars.metlife.monthlyContribution ?? 0),
        getAnswerLabel: (s) => `${formatBRL.format(s.pillars.metlife.monthlyContribution ?? 0)}/mês`,
        applyAnswer: (raw, { state: s }) => {
          const value = parsePtBrInputNumber(raw)
          if (!Number.isFinite(value) || value < 0) return null
          return {
            state: {
              ...s,
              pillars: {
                ...s.pillars,
                metlife: { ...s.pillars.metlife, monthlyContribution: Math.round(value) },
              },
            },
          }
        },
      },
      {
        id: 'has_total_patrimony',
        stage: 'Carteira',
        prompt: 'Tem patrimônio total investido hoje?',
        inputMode: 'text',
        choices: [
          { label: 'Sim', value: 'yes' },
          { label: 'Não', value: 'no' },
        ],
        getDraftValue: () =>
          qaHasTotalPatrimony == null ? '' : qaHasTotalPatrimony ? 'yes' : 'no',
        getAnswerLabel: () =>
          qaHasTotalPatrimony == null ? 'Não informado' : qaHasTotalPatrimony ? 'Sim' : 'Não',
        applyAnswer: (raw) => {
          if (raw !== 'yes' && raw !== 'no') return null
          const yes = raw === 'yes'
          setQaHasTotalPatrimony(yes)
          if (!yes) {
            setQaDistributionApprox('')
            setQaStructuredAssets([])
            setQaAssetRows([{ id: 'asset-1', name: '', valueInput: '', rateInput: '' }])
          }
          return {}
        },
      },
      {
        id: 'distribution_approx',
        stage: 'Carteira',
        prompt: 'Distribuição aproximada',
        helper:
          'Preencha nome do ativo, valor atual e, se quiser, taxa anual (%). A taxa será usada na projeção futura.',
        inputMode: 'text',
        isVisible: () => qaHasTotalPatrimony === true,
        getDraftValue: () => qaDistributionApprox,
        getAnswerLabel: () =>
          qaStructuredAssets.length > 0
            ? `${qaStructuredAssets.length} ativos informados`
            : qaDistributionApprox || 'Distribuição informada',
        applyAnswer: () => {
          const normalized = qaAssetRows
            .map((row) => ({
              id: row.id,
              name: row.name.trim(),
              value: parsePtBrInputNumber(row.valueInput),
              annualRateNominalRaw: parsePtBrInputNumber(row.rateInput),
            }))
            .filter((row) => row.name && Number.isFinite(row.value) && row.value > 0)
            .map((row) => ({
              ...row,
              annualRateNominal:
                Number.isFinite(row.annualRateNominalRaw) && row.annualRateNominalRaw >= 0
                  ? row.annualRateNominalRaw / 100
                  : null,
            }))

          if (normalized.length === 0) return null

          setQaStructuredAssets(
            normalized.map((row, index) => ({
              id: `${row.id}-${index}`,
              name: row.name,
              value: Math.round(row.value),
              annualRateNominal: row.annualRateNominal,
            }))
          )
          setQaDistributionApprox(
            normalized
              .map(
                (row) =>
                  `${row.name} ${formatBRL.format(Math.round(row.value))} ${
                    row.annualRateNominal == null
                      ? '(taxa cenário)'
                      : `(${pct(row.annualRateNominal, 1)} a.a.)`
                  }`
              )
              .join(' • ')
          )
          return {}
        },
      },
      {
        id: 'current_age',
        stage: 'Prazo',
        prompt: 'Qual sua idade atual?',
        placeholder: 'Ex.: 41',
        inputMode: 'numeric',
        getDraftValue: (s) => String(s.currentAge),
        getAnswerLabel: (s) => `${s.currentAge} anos`,
        applyAnswer: (raw, { state: s }) => {
          const value = Math.round(parsePtBrInputNumber(raw))
          if (!Number.isFinite(value) || value < 18 || value > 80) return null
          const nextTarget = Math.max(s.targetAge, value + 1)
          return { state: { ...s, currentAge: value, targetAge: nextTarget } }
        },
      },
      {
        id: 'target_age',
        stage: 'Prazo',
        prompt: 'Com que idade você quer atingir essa liberdade financeira?',
        placeholder: 'Ex.: 55',
        inputMode: 'numeric',
        choices: [
          { label: '50 anos', value: '50' },
          { label: '55 anos', value: '55' },
          { label: '60 anos', value: '60' },
        ],
        getDraftValue: (s) => String(s.targetAge),
        getAnswerLabel: (s) => `${s.targetAge} anos`,
        applyAnswer: (raw, { state: s }) => {
          const value = Math.round(parsePtBrInputNumber(raw))
          if (!Number.isFinite(value) || value <= s.currentAge || value > 90) return null
          return { state: { ...s, targetAge: value } }
        },
      },
      {
        id: 'scenario',
        stage: 'Risco',
        prompt: 'Qual cenário você considera base para seu planejamento?',
        helper: 'Selecione uma opção para definir a taxa usada no cenário principal.',
        inputMode: 'text',
        choices: [
          { label: 'Conservador - 6% a.a.', value: '0' },
          { label: 'Base - 8% a.a.', value: '1' },
          { label: 'Otimista - 9%+', value: '2' },
        ],
        getDraftValue: (_s, si) => String(si),
        getAnswerLabel: (_s, si) => `${scenarioLabels[si]} (${pct(DEFAULTS.scenarioRates[si], 0)} a.a.)`,
        applyAnswer: (raw) => {
          const idx = Number(raw)
          if (![0, 1, 2].includes(idx)) return null
          return { scenarioIndex: idx }
        },
      },
      {
        id: 'withdrawal',
        stage: 'Risco',
        prompt: 'Qual taxa de retirada sustentável você quer considerar?',
        helper: 'Digite em % ao ano (ex.: 5).',
        placeholder: 'Ex.: 5',
        inputMode: 'numeric',
        choices: [
          { label: '4%', value: '4' },
          { label: '5%', value: '5' },
          { label: '6%', value: '6' },
        ],
        getDraftValue: (s) => String(Number((s.withdrawalRate * 100).toFixed(2))),
        getAnswerLabel: (s) => `${Number((s.withdrawalRate * 100).toFixed(2))}% a.a.`,
        applyAnswer: (raw, { state: s }) => {
          const value = parsePtBrInputNumber(raw)
          if (!Number.isFinite(value) || value < 2 || value > 10) return null
          return { state: { ...s, withdrawalRate: value / 100 } }
        },
      },
      {
        id: 'inss_income',
        stage: 'Resumo',
        prompt: 'Se quiser, informe a renda mensal de INSS estimada (adicional).',
        helper: 'Pode deixar 0 se ainda não quiser considerar.',
        placeholder: 'Ex.: 2500',
        inputMode: 'numeric',
        getDraftValue: (s) => String(s.pillars.inss.monthlyIncome ?? 0),
        getAnswerLabel: (s) => `${formatBRL.format(s.pillars.inss.monthlyIncome ?? 0)}/mês`,
        applyAnswer: (raw, { state: s }) => {
          const value = parsePtBrInputNumber(raw)
          if (!Number.isFinite(value) || value < 0) return null
          return {
            state: {
              ...s,
              pillars: {
                ...s.pillars,
                inss: { ...s.pillars.inss, monthlyIncome: Math.round(value) },
              },
            },
          }
        },
      },
    ],
    [qaHasTotalPatrimony, qaDistributionApprox, qaAssetRows, qaStructuredAssets, scenarioNominal]
  )

  const questionnaireSteps: QuestionnaireStep[] = configuredQuestionnaireSteps
    .slice(0, 10)
    .filter((step) => (step.isVisible ? step.isVisible({ state, scenarioIndex }) : true))
  const qaCurrentStep =
    qaStepIndex >= 0 && qaStepIndex < questionnaireSteps.length
      ? questionnaireSteps[qaStepIndex]
      : undefined
  const qaCompletedCount = clamp(qaStepIndex, 0, questionnaireSteps.length)
  const qaProgress = questionnaireSteps.length ? qaCompletedCount / questionnaireSteps.length : 0

  const qaStageList = ['Objetivo', 'Prazo', 'Aportes', 'Carteira', 'Risco', 'Resumo'] as const
  const qaActiveStage = qaCurrentStep?.stage ?? qaStageList[qaStageList.length - 1]

  const qaConversation = questionnaireSteps.slice(0, qaCompletedCount).map((step) => ({
    id: step.id,
    prompt: step.prompt,
    answer: step.getAnswerLabel(state, scenarioIndex),
  }))

  const applyQuestionnaireAnswer = (rawValue: string) => {
    if (!qaCurrentStep) return
    const result = qaCurrentStep.applyAnswer(rawValue, { state, scenarioIndex })
    if (!result) {
      setQaError('Resposta inválida. Ajuste o valor e tente novamente.')
      return
    }
    if (result.state) setState(result.state)
    if (typeof result.scenarioIndex === 'number') setScenarioIndex(result.scenarioIndex)
    setQaError(null)
    setQaStepIndex((prev) => Math.min(prev + 1, questionnaireSteps.length))
  }

  useEffect(() => {
    if (!showSettings) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (settingsButtonRef.current?.contains(target)) return
      if (settingsPopoverRef.current?.contains(target)) return
      setShowSettings(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSettings(false)
      }
    }

    setPopoverPos(null)
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showSettings])

  useEffect(() => {
    if (!showSettings || typeof document === 'undefined') return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showSettings])

  useEffect(() => {
    if (!showSettings || !qaCurrentStep) return
    setQaDraft(qaCurrentStep.getDraftValue(state, scenarioIndex))
    setQaError(null)
  }, [showSettings, qaStepIndex, qaCurrentStep, state, scenarioIndex])

  useEffect(() => {
    if (!showSettings) return

    const thread = qaThreadRef.current
    const currentBlock = qaCurrentBlockRef.current
    if (!thread) return

    const syncScroll = () => {
      if (currentBlock) {
        currentBlock.scrollIntoView({ block: 'start', behavior: 'smooth' })
        return
      }
      thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' })
    }

    const rafId = window.requestAnimationFrame(syncScroll)
    return () => window.cancelAnimationFrame(rafId)
  }, [showSettings, qaStepIndex, qaCurrentStep])

  return (
    <section className="previdencia-page">
      <header className="previdencia-hero">
        <div className="previdencia-hero__bg" aria-hidden="true" />
        <div className="previdencia-hero__row">
          <div>
            {onOpenMenu ? (
              <button
                type="button"
                className="previdencia-back-btn"
                onClick={onOpenMenu}
                aria-label="Voltar ao menu"
              >
                Menu
              </button>
            ) : null}
            <p className="previdencia-hero__subtitle">
              Liberdade aos <b>{state.targetAge}</b> anos • horizonte de <b>{yearsToTarget}</b> anos • valores de hoje
            </p>
          </div>
          <button
            ref={settingsButtonRef}
            className="previdencia-ghost-btn"
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            aria-expanded={showSettings}
            aria-haspopup="dialog"
          >
            {showSettings ? 'Ocultar ajustes' : 'Editar premissas'}
          </button>
        </div>
      </header>

      <div className="previdencia-grid previdencia-grid--top">
        <PrevidenciaCard title="Meta de Salário Mensal" className="prev-card--hero">
          <div className="prev-kpi-row">
            <div className="prev-kpi-main">
              <span className="prev-kpi-main__value">{formatBRL.format(state.targetMonthlyIncomeReal)}</span>
              <span className="prev-kpi-main__unit">/mês</span>
            </div>
          </div>

          <div className="prev-progress-head">
            <span>Progresso para meta</span>
            <span className="prev-progress-head__value">
              {formatBRL.format(projection.totalPV)} / {formatBRL.format(requiredPortfolio)}
              <span className="prev-kpi-chip is-positive">
                {Math.round(clamp(progressNow, 0, 1) * 100)}%
              </span>
            </span>
          </div>
          <div className="prev-progress">
            <div className="prev-progress__fill" style={{ width: `${clamp(progressNow, 0, 1) * 100}%` }} />
          </div>
          <p className="prev-muted-line">
            Faltam aproximadamente <b>{formatBRL.format(remainingNow)}</b> de patrimônio base (estimativa real).
          </p>
        </PrevidenciaCard>

        <PrevidenciaCard
          title="Cenário selecionado"
          right={<span className="prev-badge">{pct(scenarioNominal, 0)} a.a. nominal</span>}
        >
          <div className="prev-scenario-title">
            {scenarioLabels[scenarioIndex]} <span>({pct(scenarioNominal, 0)} a.a.)</span>
          </div>
          <div className="prev-pill-row">
            {state.scenarioRates.map((rate, index) => (
              <button
                key={rate}
                type="button"
                className={`prev-pill ${index === scenarioIndex ? 'active' : ''}`}
                onClick={() => setScenarioIndex(index)}
              >
                <span>{scenarioLabels[index]}</span>
                <small>({pct(rate, 0)})</small>
              </button>
            ))}
          </div>
          <Sparkline points={scenarioSpark} activeIndex={scenarioSpark.length - 1} />
          <p className="prev-footnote">
            IPCA+ é projetado em taxa real; demais pilares nominais são convertidos para termos reais pela inflação assumida.
          </p>
        </PrevidenciaCard>

        <PrevidenciaCard title={`Projeção aos ${state.targetAge} anos`} className="prev-card--projection">
          <div className="prev-projection-grid">
            <div className="prev-projection-block">
              <div className="prev-label">Patrimônio projetado (real)</div>
              <div className="prev-big-number">{formatBRL.format(projection.totalFV)}</div>
              <div className="prev-inline-list">
                <span>Retirada {pct(state.withdrawalRate, 0)} a.a.</span>
                <span>{state.showNetAfterTax ? `IR ${pct(state.taxRate, 0)}` : 'Sem IR na retirada'}</span>
              </div>
            </div>

            <div className="prev-projection-block">
              <div className="prev-label">Renda estimada (base privada)</div>
              <div className="prev-big-number">{formatBRL.format(targetPrivateMonthly)}<small>/mês</small></div>
              <div className="prev-inline-list is-highlight">
                {inssMonthly > 0 ? (
                  <>
                    <span>Total c/ INSS:</span>
                    <b>{formatBRL.format(totalMonthlyAtTarget)}/mês</b>
                  </>
                ) : (
                  <span>Sem INSS adicional na projeção</span>
                )}
              </div>
            </div>
          </div>
          <Sparkline points={projectionSpark} activeIndex={17} />
        </PrevidenciaCard>
      </div>

      <div className="previdencia-grid previdencia-grid--mid">
        <PrevidenciaCard title="Estrutura Atual" subtitle="Pilares ativos da base privada (INSS entra apenas como adicional)">
          <div className="prev-structure-list">
            {structureRows.map((pillar) => (
              <div className={`prev-structure-item ${toneClass(pillar.tone)}`} key={pillar.id}>
                <div className="prev-structure-item__icon" aria-hidden="true" />
                <div className="prev-structure-item__content">
                  <div className="prev-structure-item__head">
                    <strong>{pillar.name}</strong>
                    <span>{formatBRL.format(pillar.value)}</span>
                  </div>
                  <div className="prev-structure-item__meta">
                    <span>{pillar.subtitle}</span>
                    <span>{pillar.meta}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="prev-structure-note">
              {state.pillars.inss.enabled && (state.pillars.inss.monthlyIncome ?? 0) > 0
                ? `+ INSS adicional configurado: ${formatBRL.format(state.pillars.inss.monthlyIncome ?? 0)}/mês`
                : '+ INSS como adicional (opcional)'}
            </div>
          </div>
        </PrevidenciaCard>

        <PrevidenciaCard title="Linha do Tempo" subtitle="Checkpoints para recalibrar aportes com tranquilidade">
          <div className="prev-timeline">
            {milestones.map((m) => (
              <div className="prev-timeline__item" key={m.age}>
                <div className="prev-timeline__row">
                  <div>
                    <div className="prev-timeline__age">Aos {m.age} anos</div>
                    <div className="prev-timeline__portfolio">{formatBRL.format(m.portfolio)}</div>
                  </div>
                  <div className={`prev-status ${m.okPrivate ? 'ok' : 'warn'}`}>
                    {m.okPrivate ? 'no caminho' : 'atenção'}
                  </div>
                </div>
                <div className="prev-timeline__income-row">
                  <div>
                    <span className="prev-label">Base privada</span>
                    <b>{formatBRL.format(m.privateMonthly)}/mês</b>
                  </div>
                  {inssMonthly > 0 ? (
                    <div>
                      <span className="prev-label">Com INSS</span>
                      <b>{formatBRL.format(m.totalMonthly)}/mês</b>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </PrevidenciaCard>
      </div>

      <div className="previdencia-grid previdencia-grid--bottom">
        <PrevidenciaCard title="Regras do plano" className="prev-card--rules">
          <ul className="prev-rules-list">
            <li>
              <span className="check">✓</span>
              <span>
                Base privada sem depender do INSS: <b>{formatBRL.format(state.targetMonthlyIncomeReal)}/mês</b>{' '}
                {state.showNetAfterTax ? 'líquidos' : 'brutos'} aos <b>{state.targetAge}</b> anos.
              </span>
            </li>
            <li>
              <span className="check">✓</span>
              <span>
                Cenário base conservador: <b>{pct(state.scenarioRates[1], 0)} a.a.</b> • acima disso vira margem adicional.
              </span>
            </li>
            <li>
              <span className="check">✓</span>
              <span>
                Retirada sustentável: <b>{pct(state.withdrawalRate, 0)} a.a.</b> (ajustável conforme seu conforto e realidade).
              </span>
            </li>
            <li>
              <span className="check">✓</span>
              <span>IPCA+ funciona como âncora se a ideia for carregar até o vencimento.</span>
            </li>
            <li>
              <span className="check">✓</span>
              <span>Selic/DI reduz pressão de vender ativos longos em momentos ruins.</span>
            </li>
          </ul>
        </PrevidenciaCard>
      </div>

      {showSettings ? (
        <>
          <button
            className="prev-qa-popover-overlay"
            type="button"
            aria-label="Fechar questionário de premissas"
            onClick={() => setShowSettings(false)}
          />
          <div
            ref={settingsPopoverRef}
            role="dialog"
            aria-modal="true"
            aria-label="Questionário de premissas"
            className="prev-qa-popover"
            style={
              popoverPos
                ? ({
                    top: `${popoverPos.top}px`,
                    left: `${popoverPos.left}px`,
                  } as CSSProperties)
                : undefined
            }
          >
            <div className="prev-qa-popover__arrow" aria-hidden="true" />
            <div className="prev-qa-popover__top">
              <div>
                <strong>Questionário de Premissas</strong>
                <span>
                  Pergunta {Math.min(qaStepIndex + 1, questionnaireSteps.length)} de {questionnaireSteps.length}
                </span>
              </div>
              <button
                type="button"
                className="prev-qa-popover__close"
                onClick={() => setShowSettings(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <div className="previdencia-grid previdencia-grid--settings">
              <PrevidenciaCard
                title=""
                className="prev-card--questionnaire"
              >
                <div className="prev-qa-shell">
                  <aside className="prev-qa-sidebar" aria-label="Progresso do questionário">
                    <div className="prev-qa-sidebar__badge">Setup IA</div>
                    <div className="prev-qa-sidebar__progress">
                      <div
                        className="prev-qa-sidebar__progress-fill"
                        style={{
                          height: questionnaireSteps.length
                            ? `${Math.max(12, qaProgress * 100)}%`
                            : '0%',
                        }}
                      />
                    </div>
                    <div className="prev-qa-sidebar__meta">
                      <strong>
                        {questionnaireSteps.length
                          ? `Etapa ${Math.min(qaStepIndex + 1, questionnaireSteps.length)} / ${questionnaireSteps.length}`
                          : 'Sem perguntas'}
                      </strong>
                      <span>{qaCurrentStep ? qaCurrentStep.stage : 'Aguardando definição'}</span>
                    </div>
                    <div className="prev-qa-sidebar__steps">
                      {qaStageList.map((stage) => (
                        <span key={stage} className={stage === qaActiveStage ? 'is-active' : ''}>
                          {stage}
                        </span>
                      ))}
                    </div>
                  </aside>

                  <div className="prev-qa-chat">
                    <div className="prev-qa-chat__header">
                      <div>
                        <strong>Entrevista guiada de premissas</strong>
                      </div>
                      <span className="prev-qa-chat__status">
                        {questionnaireSteps.length === 0
                          ? 'Vazio'
                          : qaCompletedCount >= questionnaireSteps.length
                            ? 'Concluído'
                            : 'Em andamento'}
                      </span>
                    </div>

                    <div className="prev-qa-thread" ref={qaThreadRef}>
                      {qaConversation.map((message) => (
                        <div className="prev-qa-thread__pair" key={message.id}>
                          <div className="prev-qa-bubble prev-qa-bubble--assistant">
                            <span className="prev-qa-bubble__avatar">AI</span>
                            <div className="prev-qa-bubble__content">
                              <div className="prev-qa-bubble__name">Assistente UpMoney</div>
                              <p>{message.prompt}</p>
                            </div>
                          </div>

                          <div className="prev-qa-bubble prev-qa-bubble--user">
                            <div className="prev-qa-bubble__content">
                              <div className="prev-qa-bubble__name">Você</div>
                              <p>{message.answer}</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {qaCurrentStep ? (
                        <div className="prev-qa-current-block" ref={qaCurrentBlockRef}>
                          <div className="prev-qa-bubble prev-qa-bubble--assistant">
                            <span className="prev-qa-bubble__avatar">AI</span>
                            <div className="prev-qa-bubble__content">
                              <div className="prev-qa-bubble__name">Assistente UpMoney</div>
                              <p>{qaCurrentStep.prompt}</p>
                              {qaCurrentStep.helper ? (
                                <p className="is-helper">{qaCurrentStep.helper}</p>
                              ) : null}
                            </div>
                          </div>

                          {qaCurrentStep.choices?.length ? (
                            <div className="prev-qa-inline-card">
                              <div className="prev-qa-inline-card__title">Respostas rápidas</div>
                              <div className="prev-qa-choice-grid">
                                {qaCurrentStep.choices.map((choice) => (
                                  <button
                                    key={choice.label}
                                    type="button"
                                    className="prev-qa-choice"
                                    onClick={() => applyQuestionnaireAnswer(choice.value)}
                                  >
                                    {choice.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {qaCurrentStep ? (
                      <form
                        className="prev-qa-composer"
                        role="group"
                        aria-label="Responder questionário"
                        onSubmit={(event) => {
                          event.preventDefault()
                          applyQuestionnaireAnswer(qaDraft)
                        }}
                      >
                        <div className="prev-qa-composer__hint">
                          {qaCurrentStep.inputMode === 'numeric'
                            ? 'Digite um número (ex.: 8000 ou 5 para 5%)'
                            : 'Digite sua resposta ou use os botões acima'}
                        </div>
                        {qaCurrentStep.id === 'distribution_approx' ? (
                          <div className="prev-qa-assets-editor">
                            {qaAssetRows.map((row, index) => (
                              <div className="prev-qa-assets-editor__row" key={row.id}>
                                <input
                                  className="prev-qa-composer__input"
                                  value={row.name}
                                  onChange={(event) =>
                                    setQaAssetRows((prev) =>
                                      prev.map((item) =>
                                        item.id === row.id ? { ...item, name: event.target.value } : item
                                      )
                                    )
                                  }
                                  placeholder={`Nome do ativo ${index + 1}`}
                                />
                                <input
                                  className="prev-qa-composer__input"
                                  value={row.valueInput}
                                  inputMode="decimal"
                                  onChange={(event) =>
                                    setQaAssetRows((prev) =>
                                      prev.map((item) =>
                                        item.id === row.id
                                          ? { ...item, valueInput: event.target.value }
                                          : item
                                      )
                                    )
                                  }
                                  placeholder="Valor atual"
                                />
                                <input
                                  className="prev-qa-composer__input"
                                  value={row.rateInput}
                                  inputMode="decimal"
                                  onChange={(event) =>
                                    setQaAssetRows((prev) =>
                                      prev.map((item) =>
                                        item.id === row.id
                                          ? { ...item, rateInput: event.target.value }
                                          : item
                                      )
                                    )
                                  }
                                  placeholder="Taxa anual (%)"
                                />
                                <button
                                  type="button"
                                  className="prev-qa-assets-editor__remove"
                                  onClick={() =>
                                    setQaAssetRows((prev) =>
                                      prev.length > 1 ? prev.filter((item) => item.id !== row.id) : prev
                                    )
                                  }
                                  disabled={qaAssetRows.length <= 1}
                                  aria-label="Remover ativo"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="prev-qa-assets-editor__add"
                              onClick={() =>
                                setQaAssetRows((prev) => [
                                  ...prev,
                                  {
                                    id: `asset-${Date.now()}-${prev.length + 1}`,
                                    name: '',
                                    valueInput: '',
                                    rateInput: '',
                                  },
                                ])
                              }
                            >
                              + Adicionar ativo
                            </button>
                          </div>
                        ) : null}
                        <div className="prev-qa-composer__box">
                          <input
                            className="prev-qa-composer__input"
                            value={qaDraft}
                            onChange={(event) => {
                              setQaDraft(event.target.value)
                              if (qaError) setQaError(null)
                            }}
                            inputMode={qaCurrentStep.inputMode === 'numeric' ? 'decimal' : 'text'}
                            placeholder={
                              qaCurrentStep.id === 'distribution_approx'
                                ? 'Opcional: observação geral da carteira'
                                : qaCurrentStep.placeholder ?? 'Digite sua resposta'
                            }
                          />
                          <button type="submit" className="prev-qa-composer__send">
                            Enviar
                          </button>
                        </div>
                        {qaError ? <div className="prev-qa-composer__error">{qaError}</div> : null}
                        <div className="prev-qa-composer__actions">
                          <button
                            type="button"
                            className="prev-qa-link"
                            onClick={() => setQaStepIndex((prev) => Math.max(0, prev - 1))}
                            disabled={qaStepIndex === 0}
                          >
                            Voltar
                          </button>
                          <button
                            type="button"
                            className="prev-qa-link"
                            onClick={() => setQaStepIndex((prev) => Math.min(questionnaireSteps.length - 1, prev + 1))}
                            disabled={qaStepIndex >= questionnaireSteps.length - 1}
                          >
                            Pular
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="prev-qa-composer prev-qa-composer--done">
                        <div className="prev-qa-composer__hint">
                          Você pode fechar o balão ou reiniciar a conversa para revisar as premissas.
                        </div>
                        <div className="prev-qa-composer__actions">
                          {questionnaireSteps.length > 0 ? (
                            <button type="button" className="prev-qa-link" onClick={() => setQaStepIndex(0)}>
                              Reiniciar questionário
                            </button>
                          ) : (
                            <span />
                          )}
                          <button type="button" className="prev-qa-link" onClick={() => setShowSettings(false)}>
                            Fechar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </PrevidenciaCard>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}

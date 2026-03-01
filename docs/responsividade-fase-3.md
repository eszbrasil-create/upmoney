# Responsividade - Fase 3

Data: 2026-03-01

## Escopo executado

- Validacao automatizada de guardrails responsivos.
- Checklist formal de regressao visual por viewport.
- Hardening de processo para evitar regressao nas fases seguintes.

## Automacao adicionada

- Novo teste: `src/responsiveGuards.test.ts`
  - Garante breakpoint tablet em Despesas (`max-width: 1024px`).
  - Garante barra de navegacao mobile no App.
  - Garante camada responsiva para `<=1024px` em blocos criticos.
  - Garante override de `<=720px` para evitar regressao de `min-width`.
- Novo script npm:
  - `npm run test:responsive`

## Checklist de QA por viewport

Viewports alvo:
- 390x844 (mobile)
- 768x1024 (tablet retrato)
- 1024x768 (tablet paisagem)
- 1280x800 (desktop baseline)
- 1440x900 (desktop amplo)

Paginas:
- Dash
- Cursos
- Ativos
- Despesas
- Simulador
- Carteiras
- Previdencia

Itens de validacao:
- Sem overflow horizontal inesperado.
- Navegacao acessivel por touch.
- Cards e botoes sem sobreposicao.
- Tabelas legiveis e navegaveis.
- Graficos sem corte visual.
- Baseline desktop preservado.


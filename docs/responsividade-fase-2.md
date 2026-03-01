# Responsividade - Fase 2

Data: 2026-03-01

## Escopo executado

- Reestruturacao de layout para tablet (<=1024px) em modulos criticos.
- Ajuste da navegacao mobile com atalhos fixos.
- Adaptações de densidade para tabelas e graficos com overflow controlado.
- Preservacao do baseline de desktop (>=1280px).

## Mudancas aplicadas

- Dashboard:
  - painéis em coluna unica no tablet para reduzir compressao horizontal.
  - metrica de fluxo em 2 colunas.
- Simulador:
  - grade principal em coluna unica no tablet.
  - cenarios em 2 colunas no tablet e 1 no mobile.
- Despesas:
  - layout mobile habilitado ate 1024px.
- Tabelas:
  - `asset-table` e `wallet-table` com scroll horizontal controlado no tablet.
- Navegacao mobile:
  - barra fixa inferior com atalhos para Dash, Cursos, Ativos, Despesas e Menu.


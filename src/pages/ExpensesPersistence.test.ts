// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import {
  expensesLocalBackupStorageKey,
  readExpensesLocalBackup,
  writeExpensesLocalBackup,
} from './Expenses'

describe('Expenses local backup', () => {
  it('persists and reads rows for the selected year', () => {
    const rows = [
      {
        id: 'income-1',
        label: 'Salário',
        type: 'income' as const,
        values: ['100,00', '200,00'],
        order: 1,
      },
    ]

    writeExpensesLocalBackup(2026, rows)

    expect(readExpensesLocalBackup(2026)).toEqual(rows)
    expect(window.localStorage.getItem(expensesLocalBackupStorageKey(2026))).toContain(
      'Salário'
    )
  })
})

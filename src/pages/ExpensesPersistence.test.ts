// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import {
  expensesLocalBackupStorageKey,
  readExpensesLocalBackup,
  writeExpensesLocalBackup,
} from './Expenses'

describe('Expenses local backup', () => {
  it('persists and reads rows for the selected year and normalizes month values', () => {
    const rows = [
      {
        id: 'income-1',
        label: 'Salário',
        type: 'income' as const,
        values: ['100,00', '200,00'],
        order: 1,
      },
    ]

    writeExpensesLocalBackup(2026, 'user-1', rows)

    const backup = readExpensesLocalBackup(2026, 'user-1')

    expect(backup).toEqual([
      {
        id: 'income-1',
        label: 'Salário',
        type: 'income',
        values: ['100,00', '200,00', '', '', '', '', '', '', '', '', '', ''],
        order: 1,
      },
    ])
    expect(window.localStorage.getItem(expensesLocalBackupStorageKey(2026, 'user-1'))).toContain(
      'Salário'
    )
  })

  it('keeps backups isolated by user', () => {
    const userOneRows = [
      {
        id: 'income-1',
        label: 'Salário',
        type: 'income' as const,
        values: ['100,00'],
        order: 1,
      },
    ]
    const userTwoRows = [
      {
        id: 'expense-1',
        label: 'Aluguel',
        type: 'expense' as const,
        values: ['1200,00'],
        order: 1,
      },
    ]

    writeExpensesLocalBackup(2026, 'user-1', userOneRows)
    writeExpensesLocalBackup(2026, 'user-2', userTwoRows)

    expect(readExpensesLocalBackup(2026, 'user-1')).toMatchObject([
      expect.objectContaining({ label: 'Salário' }),
    ])
    expect(readExpensesLocalBackup(2026, 'user-2')).toMatchObject([
      expect.objectContaining({ label: 'Aluguel' }),
    ])
    expect(readExpensesLocalBackup(2026, 'user-1')).not.toEqual(readExpensesLocalBackup(2026, 'user-2'))
  })
})

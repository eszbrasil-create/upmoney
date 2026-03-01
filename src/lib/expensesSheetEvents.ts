export const EXPENSES_SHEET_CHANGED_EVENT = 'upmoney:expenses-sheet-changed'

export const notifyExpensesSheetChanged = (year: number) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(EXPENSES_SHEET_CHANGED_EVENT, {
      detail: { year },
    })
  )
}

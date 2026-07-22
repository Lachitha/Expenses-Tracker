export function calculateBalance(transactions) {
  let balance = 0
  for (const t of transactions) {
    if (t.type === 'Expense') {
      balance += t.paidBy === 'Lachitha' ? Number(t.sudewaShare) : -Number(t.lachithaShare)
    } else {
      balance -= t.paidBy === 'Sudewa' ? Number(t.totalAmount) : -Number(t.totalAmount)
    }
  }
  return balance
}

export function getStatus(balance) {
  if (balance > 0) return { text: `Sudewa owes Lachitha Rs.${balance.toLocaleString()}`, color: 'green' }
  if (balance < 0) return { text: `Lachitha owes Sudewa Rs.${Math.abs(balance).toLocaleString()}`, color: 'red' }
  return { text: 'Fully Settled', color: 'gray' }
}

export function getDashboardMetrics(transactions) {
  let totalExpenses = 0, lachithaPaid = 0, sudowaPaid = 0
  for (const t of transactions) {
    if (t.type !== 'Expense') continue
    const amt = Number(t.totalAmount)
    totalExpenses += amt
    if (t.paidBy === 'Lachitha') lachithaPaid += amt
    else sudowaPaid += amt
  }
  return { totalExpenses, lachithaPaid, sudowaPaid }
}

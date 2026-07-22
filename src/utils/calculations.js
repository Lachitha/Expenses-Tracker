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
  const expenses = transactions.filter(t => t.type === 'Expense')
  const totalExpenses = expenses.reduce((s, t) => s + Number(t.totalAmount), 0)
  const lachithaPaid = expenses.filter(t => t.paidBy === 'Lachitha').reduce((s, t) => s + Number(t.totalAmount), 0)
  const sudowaPaid = expenses.filter(t => t.paidBy === 'Sudewa').reduce((s, t) => s + Number(t.totalAmount), 0)
  return { totalExpenses, lachithaPaid, sudowaPaid }
}

import { useState } from 'react'
import { isExternalPaymentMethod, isPaymentMethodForCard } from '../../utils/personalPayments'
import { getAvailableCredit } from '../../utils/creditCards'

function getCycleDates(billingDay) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let thisCycleStart = new Date(currentYear, currentMonth, billingDay)
  let lastCycleStart = new Date(currentYear, currentMonth - 1, billingDay)

  if (now.getDate() < billingDay) {
    thisCycleStart = new Date(currentYear, currentMonth - 1, billingDay)
    lastCycleStart = new Date(currentYear, currentMonth - 2, billingDay)
  }

  const thisCycleEnd = new Date(thisCycleStart)
  thisCycleEnd.setMonth(thisCycleEnd.getMonth() + 1)

  const lastCycleEnd = new Date(thisCycleStart)

  return { thisCycleStart, thisCycleEnd, lastCycleStart, lastCycleEnd }
}

function inRange(dateStr, start, end) {
  const d = new Date(dateStr)
  return d >= start && d < end
}

export default function PersonalDashboard({ transactions, settings, savings, categories = [], paymentMethods = [] }) {
  const [showSavings, setShowSavings] = useState(true)
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalSavings = savings.reduce((sum, s) => sum + Number(s.amount), 0)

  const creditCards = settings?.creditCards || {}
  const cashExpenses = transactions
    .filter(t => t.type === 'expense' && !isExternalPaymentMethod(t.paymentMethod, paymentMethods) &&
      !Object.entries(creditCards).some(([cardId, card]) => isPaymentMethodForCard(t.paymentMethod, cardId, card.name, paymentMethods)))
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalSettlements = transactions
    .filter(t => t.type === 'settlement')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const cycleStartDate = settings?.cycleStartDate
  const cycleSavings = savings
    .filter(s => !cycleStartDate || s.date >= cycleStartDate)
    .reduce((sum, s) => sum + Number(s.amount), 0)
  const balance = totalIncome - cashExpenses - totalSettlements - cycleSavings
  const billingDay = settings?.billingCycleDay || 6
  const { thisCycleStart, thisCycleEnd, lastCycleStart, lastCycleEnd } = getCycleDates(billingDay)

  const cardData = Object.entries(creditCards).map(([cardId, card]) => {
    const limit = card.creditLimit || 0

    let totalExpensesOnCard = 0
    let totalSettlementsOnCard = 0
    let thisCycleSpent = 0
    let lastCycleSpent = 0
    let thisCycleSettled = 0
    let lastCycleSettled = 0

    for (const t of transactions) {
      if (isPaymentMethodForCard(t.paymentMethod, cardId, card.name, paymentMethods) && t.type === 'expense') {
        totalExpensesOnCard += Number(t.amount)
        if (inRange(t.date, thisCycleStart, thisCycleEnd)) {
          thisCycleSpent += Number(t.amount)
        }
        if (inRange(t.date, lastCycleStart, lastCycleEnd)) {
          lastCycleSpent += Number(t.amount)
        }
      }
      if (t.toCard === card.name && t.type === 'settlement') {
        totalSettlementsOnCard += Number(t.amount)
        if (inRange(t.date, thisCycleStart, thisCycleEnd)) {
          thisCycleSettled += Number(t.amount)
        }
        if (inRange(t.date, lastCycleStart, lastCycleEnd)) {
          lastCycleSettled += Number(t.amount)
        }
      }
    }

    const availableBalance = getAvailableCredit(limit, totalSettlementsOnCard, totalExpensesOnCard)
    const lastCycleOutstanding = lastCycleSpent - lastCycleSettled

    return {
      id: cardId,
      name: card.name,
      creditLimit: limit,
      availableBalance,
      thisCycleSpent,
      lastCycleSpent,
      lastCycleOutstanding: lastCycleOutstanding > 0 ? lastCycleOutstanding : 0,
    }
  })

  const byCategory = {}
  const byPayment = {}

  for (const t of transactions) {
    if (t.type === 'expense') {
      const categoryName = categories.find(c => c.id === t.category)?.name || t.category
      byCategory[categoryName] = (byCategory[categoryName] || 0) + Number(t.amount)
      byPayment[t.paymentMethod] = (byPayment[t.paymentMethod] || 0) + Number(t.amount)
    }
  }

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const summaryCards = [
    { label: 'Total Income', value: `Rs. ${totalIncome.toLocaleString()}`, color: 'bg-green-50 text-green-700 border-green-200' },
    { label: 'Total Expenses', value: `Rs. ${totalExpenses.toLocaleString()}`, color: 'bg-red-50 text-red-700 border-red-200' },
    { label: 'Cash Balance', value: `Rs. ${balance.toLocaleString()}`, color: balance >= 0 ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-orange-50 text-orange-700 border-orange-200' },
    { label: 'Total Savings', value: showSavings ? `Rs. ${totalSavings.toLocaleString()}` : '••••••', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map(c => (
          <div key={c.label} className={`rounded-xl border p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4 ${c.color}`}>
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs sm:text-sm font-medium opacity-75">{c.label}</p>
              {c.label === 'Total Savings' && (
                <button type="button" onClick={() => setShowSavings(value => !value)} className="text-[10px] sm:text-xs underline opacity-75">
                  {showSavings ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
            <p className="text-lg sm:text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {cardData.length > 0 && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Credit Cards</h3>
            <span className="text-xs text-gray-400">Cycle: {billingDay}th - {billingDay}th</span>
          </div>

          {cardData.map(card => (
            <div key={card.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-800">{card.name}</span>
                <span className={`text-sm font-bold ${card.availableBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Rs. {card.availableBalance.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-400">Available Balance (Limit: Rs. {card.creditLimit.toLocaleString()})</div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-blue-50 rounded-lg px-3 py-2">
                  <div className="text-[10px] text-blue-500 font-medium">This Cycle Spent</div>
                  <div className="text-sm font-semibold text-blue-700">Rs. {card.thisCycleSpent.toLocaleString()}</div>
                </div>
                <div className={`rounded-lg px-3 py-2 ${card.lastCycleOutstanding > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <div className={`text-[10px] font-medium ${card.lastCycleOutstanding > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                    {card.lastCycleOutstanding > 0 ? 'Pending (Last Cycle)' : 'Last Cycle Paid'}
                  </div>
                  <div className={`text-sm font-semibold ${card.lastCycleOutstanding > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                    Rs. {card.lastCycleOutstanding.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {savings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Savings History</h3>
          <div className="space-y-2">
            {savings.slice(-5).reverse().map(s => (
                <div key={s.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{s.description}</span>
                  <span className="font-medium text-emerald-600">{showSavings ? `+ Rs. ${Number(s.amount).toLocaleString()}` : '••••••'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topCategories.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Spending Categories</h3>
          <div className="space-y-2">
            {topCategories.map(([cat, amt]) => (
              <div key={cat} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{cat}</span>
                <span className="font-medium text-gray-800">Rs. {amt.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(byPayment).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Spending by Payment Method</h3>
          <div className="space-y-2">
            {Object.entries(byPayment).sort((a, b) => b[1] - a[1]).map(([pm, amt]) => (
              <div key={pm} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{pm}</span>
                <span className="font-medium text-gray-800">Rs. {amt.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

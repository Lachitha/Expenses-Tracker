import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-gray-700">{payload[0].name}</p>
      <p className="text-gray-500">Rs. {Number(payload[0].value).toLocaleString()}</p>
    </div>
  )
}

function SmallPie({ data }) {
  if (!data.length) return <p className="text-xs text-gray-400 text-center py-4">No data</p>
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-[11px] text-gray-600">{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function getCardStats(cardId, cardName, transactions, paymentMethods) {
  let spent = 0
  let settled = 0
  const byCategory = {}
  for (const t of transactions) {
    const paymentMethod = paymentMethods.find(pm => pm.name === t.paymentMethod)
    if ((t.paymentMethod === cardName || paymentMethod?.creditCardId === cardId || paymentMethod?.creditCardId === cardName) && t.type === 'expense') {
      spent += Number(t.amount)
      byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount)
    }
    if (t.toCard === cardName && t.type === 'settlement') {
      settled += Number(t.amount)
    }
  }
  return { spent, settled, byCategory }
}

export default function Charts({ transactions, settings, savings, installments = [], onCardClick, categories = [], paymentMethods = [] }) {
  const [selectedCard, setSelectedCard] = useState('all')

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const totalSavings = savings.reduce((s, t) => s + Number(t.amount), 0)

  const balanceData = []
  if (totalIncome > 0) balanceData.push({ name: 'Income', value: totalIncome })
  if (totalExpenses > 0) balanceData.push({ name: 'Expenses', value: totalExpenses })
  if (totalSavings > 0) balanceData.push({ name: 'Savings', value: totalSavings })

  const byCategory = {}
  for (const t of transactions) {
    if (t.type === 'expense') {
      const categoryName = categories.find(c => c.id === t.category)?.name || t.category
      byCategory[categoryName] = (byCategory[categoryName] || 0) + Number(t.amount)
    }
  }
  const categoryData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const creditCards = settings?.creditCards || {}
  const cardEntries = Object.entries(creditCards)

  const allCardPieData = cardEntries.map(([_id, card]) => {
    const stats = getCardStats(_id, card.name, transactions, paymentMethods)
    const available = (card.creditLimit || 0) + stats.settled - stats.spent
    return { name: card.name, value: Math.max(available, 0) }
  }).filter(c => c.value > 0)

  const selectedCardData = selectedCard !== 'all'
    ? (() => {
        const card = creditCards[selectedCard]
        if (!card) return null
        const stats = getCardStats(selectedCard, card.name, transactions, paymentMethods)
        const available = (card.creditLimit || 0) + stats.settled - stats.spent
        const data = []
        if (available > 0) data.push({ name: 'Available', value: available })
        if (stats.spent > 0) data.push({ name: 'Spent', value: stats.spent })
        if (stats.settled > 0) data.push({ name: 'Paid', value: stats.settled })
        return { card, stats, data }
      })()
    : null

  const hasData = balanceData.length > 0 || categoryData.length > 0 || allCardPieData.length > 0
  if (!hasData) return null

  return (
    <div className="space-y-4">
      {/* Row 1: Balance + Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {balanceData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Balance Overview</h3>
            <SmallPie data={balanceData} />
          </div>
        )}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Expenses by Category</h3>
            <SmallPie data={categoryData} />
          </div>
        )}
      </div>

      {/* Row 2: Credit Card Selector */}
      {cardEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Credit Cards</h3>
            <select
              value={selectedCard}
              onChange={e => setSelectedCard(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cards</option>
              {cardEntries.map(([id, card]) => (
                <option key={id} value={id}>{card.name}</option>
              ))}
            </select>
          </div>

          {selectedCard === 'all' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cardEntries.map(([id, card]) => {
                const stats = getCardStats(id, card.name, transactions, paymentMethods)
                const available = (card.creditLimit || 0) + stats.settled - stats.spent
                const cardPie = []
                if (available > 0) cardPie.push({ name: 'Available', value: available })
                if (stats.spent > 0) cardPie.push({ name: 'Spent', value: stats.spent })
                if (stats.settled > 0) cardPie.push({ name: 'Paid', value: stats.settled })
                const cardInstallments = installments.filter(i => i.cardId === id)
                return (
                  <div key={id} onClick={() => onCardClick?.(id)} className="border border-gray-100 rounded-lg p-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-700">{card.name}</span>
                      <span className={`text-xs font-bold ${available < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Rs. {available.toLocaleString()}
                      </span>
                    </div>
                    <SmallPie data={cardPie} />
                    {cardInstallments.length > 0 && (
                      <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1">
                        {cardInstallments.length} installment(s) active
                      </div>
                    )}
                    <div className="mt-2 text-[10px] text-blue-500 text-center">Click for details</div>
                  </div>
                )
              })}
            </div>
          ) : selectedCardData && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SmallPie data={selectedCardData.data} />
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400">Credit Limit</div>
                    <div className="text-lg font-bold text-gray-800">Rs. {(selectedCardData.card.creditLimit || 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-500">Available</div>
                    <div className="text-lg font-bold text-green-700">
                      Rs. {Math.max((selectedCardData.card.creditLimit || 0) + selectedCardData.stats.settled - selectedCardData.stats.spent, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-xs text-red-500">Spent This Card</div>
                    <div className="text-lg font-bold text-red-700">Rs. {selectedCardData.stats.spent.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-500">Total Paid</div>
                    <div className="text-lg font-bold text-blue-700">Rs. {selectedCardData.stats.settled.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <button onClick={() => onCardClick?.(selectedCard)} className="mt-3 w-full text-center text-xs text-blue-600 hover:underline font-medium py-2">
                View Full Details & Installments
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

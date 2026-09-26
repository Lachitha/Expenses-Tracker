import { useState } from 'react'
import { isPaymentMethodForCard } from '../../utils/personalPayments'

function getCycleDates(billingDay) {
  const now = new Date()
  let cycleStart = new Date(now.getFullYear(), now.getMonth(), billingDay)
  if (now.getDate() < billingDay) {
    cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, billingDay)
  }
  const cycleEnd = new Date(cycleStart)
  cycleEnd.setMonth(cycleEnd.getMonth() + 1)
  return { cycleStart, cycleEnd }
}

function inRange(dateStr, start, end) {
  const d = new Date(dateStr)
  return d >= start && d < end
}

function getInstallmentStatus(installment) {
  const start = new Date(installment.startDate)
  const now = new Date()
  const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  const remaining = installment.totalMonths - monthsElapsed
  const paid = Math.min(monthsElapsed, installment.totalMonths)
  const isActive = remaining > 0 && monthsElapsed >= 0
  return { remaining: Math.max(remaining, 0), paid, isActive, totalPaid: paid * installment.monthlyAmount }
}

export default function CreditCardDetail({ card, cardId, transactions, installments, settings, paymentMethods = [], onAddInstallment, onDeleteInstallment, onClose }) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', monthlyAmount: '', totalMonths: '', startDate: new Date().toISOString().split('T')[0] })

  const billingDay = settings?.billingCycleDay || 6
  const { cycleStart, cycleEnd } = getCycleDates(billingDay)

  let cycleExpenses = 0
  let totalSpent = 0
  let totalSettled = 0
  const categoryBreakdown = {}

  for (const t of transactions) {
    if (isPaymentMethodForCard(t.paymentMethod, cardId, card.name, paymentMethods) && t.type === 'expense') {
      totalSpent += Number(t.amount)
      if (inRange(t.date, cycleStart, cycleEnd)) {
        cycleExpenses += Number(t.amount)
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + Number(t.amount)
      }
    }
    if (t.toCard === card.name && t.type === 'settlement') {
      totalSettled += Number(t.amount)
    }
  }

  const creditLimit = card.creditLimit || 0
  const available = creditLimit + totalSettled - totalSpent

  const cardInstallments = installments.filter(i => i.cardId === cardId)
  const activeInstallments = cardInstallments.filter(i => getInstallmentStatus(i).isActive)
  const monthlyInstallmentTotal = activeInstallments.reduce((s, i) => s + i.monthlyAmount, 0)

  const totalBill = cycleExpenses + monthlyInstallmentTotal

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.name || !form.monthlyAmount || !form.totalMonths) return
    onAddInstallment({
      cardId,
      cardName: card.name,
      name: form.name,
      monthlyAmount: Number(form.monthlyAmount),
      totalMonths: Number(form.totalMonths),
      startDate: form.startDate,
    })
    setForm({ name: '', monthlyAmount: '', totalMonths: '', startDate: new Date().toISOString().split('T')[0] })
    setShowAdd(false)
  }

  const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{card.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {/* Balance */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Credit Limit</div>
            <div className="text-lg font-bold text-gray-800">Rs. {creditLimit.toLocaleString()}</div>
          </div>
          <div className={`rounded-lg p-3 ${available < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className={`text-xs ${available < 0 ? 'text-red-500' : 'text-green-500'}`}>Available</div>
            <div className={`text-lg font-bold ${available < 0 ? 'text-red-700' : 'text-green-700'}`}>
              Rs. {available.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Cycle */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-blue-600">Current Bill Cycle</span>
            <span className="text-[10px] text-blue-400">{billingDay}th - {billingDay}th</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-blue-400">Regular Expenses</div>
              <div className="text-sm font-bold text-blue-700">Rs. {cycleExpenses.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-blue-400">Installments</div>
              <div className="text-sm font-bold text-blue-700">Rs. {monthlyInstallmentTotal.toLocaleString()}/mo</div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-blue-100 flex justify-between">
            <span className="text-xs font-medium text-blue-600">Total Bill This Cycle</span>
            <span className="text-sm font-bold text-blue-800">Rs. {totalBill.toLocaleString()}</span>
          </div>
        </div>

        {/* Category breakdown */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">Cycle Expenses by Category</h3>
            <div className="space-y-1">
              {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between text-xs">
                  <span className="text-gray-600">{cat}</span>
                  <span className="font-medium text-gray-700">Rs. {amt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Installments */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500">Installments (EMI)</h3>
            <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-blue-600 hover:underline">
              {showAdd ? 'Cancel' : '+ Add'}
            </button>
          </div>

          {showAdd && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Laptop EMI" className={inputClass} required />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={form.monthlyAmount} onChange={e => setForm(f => ({ ...f, monthlyAmount: e.target.value }))} placeholder="Monthly amount" min="0" className={inputClass} required />
                <input type="number" value={form.totalMonths} onChange={e => setForm(f => ({ ...f, totalMonths: e.target.value }))} placeholder="Total months" min="1" className={inputClass} required />
              </div>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputClass} required />
              <button type="submit" className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Add Installment</button>
            </form>
          )}

          {cardInstallments.length === 0 && <p className="text-xs text-gray-400">No installments</p>}

          <div className="space-y-2">
            {cardInstallments.map(inst => {
              const status = getInstallmentStatus(inst)
              return (
                <div key={inst.id} className={`flex items-center justify-between p-2 rounded-lg ${status.isActive ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <div>
                    <div className="text-xs font-medium text-gray-700">{inst.name}</div>
                    <div className="text-[10px] text-gray-400">
                      Rs. {inst.monthlyAmount.toLocaleString()} x {inst.totalMonths} months
                      {status.isActive ? ` (${status.remaining} left)` : ' (Completed)'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Rs. {status.totalPaid.toLocaleString()} paid</span>
                    <button onClick={() => onDeleteInstallment(inst.id)} className="text-gray-400 hover:text-red-500 text-xs">&times;</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
          <div className="flex justify-between"><span>Total spent (all time)</span><span className="font-medium text-gray-700">Rs. {totalSpent.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Total settled (all time)</span><span className="font-medium text-gray-700">Rs. {totalSettled.toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  )
}

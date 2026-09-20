import { useState, useEffect } from 'react'

export default function PersonalTransactionForm({ onAdd, categories, paymentMethods, onSaveSavings }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    date: today,
    type: 'expense',
    description: '',
    amount: '',
    category: '',
    paymentMethod: 'Cash',
    toCard: '',
    savingsAmount: '',
  })

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const isExpense = form.type === 'expense'
  const isIncome = form.type === 'income'
  const isSettlement = form.type === 'settlement'

  const filteredCategories = categories.filter(c => {
    if (isIncome) return c.type === 'income'
    return c.type === 'expense'
  })

  const creditCards = paymentMethods.filter(pm =>
    pm.name.toLowerCase().includes('credit card')
  )

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.id === form.category)) {
      update('category', filteredCategories[0].id)
    }
  }, [form.type, form.category, filteredCategories])

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.date || !form.description || !form.amount) return
    if (Number(form.amount) <= 0) return

    const transaction = {
      id: Date.now(),
      date: form.date,
      type: form.type,
      description: form.description,
      amount: Number(form.amount),
      category: form.category || '',
      paymentMethod: form.paymentMethod,
    }

    if (isSettlement) {
      transaction.toCard = form.toCard
    }

    onAdd(transaction)

    if (isIncome && Number(form.savingsAmount) > 0) {
      onSaveSavings({
        id: Date.now() + 1,
        date: form.date,
        amount: Number(form.savingsAmount),
        description: `Savings from ${form.description}`,
      })
    }

    setForm({
      date: today,
      type: 'expense',
      description: '',
      amount: '',
      category: '',
      paymentMethod: 'Cash',
      toCard: '',
      savingsAmount: '',
    })
  }

  const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800">New Transaction</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" value={form.date} onChange={e => update('date', e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <select value={form.type} onChange={e => update('type', e.target.value)} className={inputClass}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="settlement">Settlement</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input type="text" value={form.description} onChange={e => update('description', e.target.value)} placeholder={isSettlement ? 'e.g. Pay Credit Card Master' : isIncome ? 'e.g. Monthly Salary' : 'e.g. Groceries'} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Amount (Rs.)</label>
          <input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="0" min="0" className={inputClass} required />
        </div>

        {(isExpense || isIncome) && (
          <div>
            <label className={labelClass}>Category</label>
            <select value={form.category} onChange={e => update('category', e.target.value)} className={inputClass} required={isExpense}>
              <option value="">Select...</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {isSettlement && (
          <div>
            <label className={labelClass}>Settle Which Card</label>
            <select value={form.toCard} onChange={e => update('toCard', e.target.value)} className={inputClass} required>
              <option value="">Select card...</option>
              {creditCards.map(pm => (
                <option key={pm.id} value={pm.name}>{pm.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Payment Method</label>
          <select value={form.paymentMethod} onChange={e => update('paymentMethod', e.target.value)} className={inputClass} disabled={isSettlement}>
            {paymentMethods.map(pm => (
              <option key={pm.id} value={pm.name}>{pm.name}</option>
            ))}
          </select>
        </div>

        {isIncome && (
          <div>
            <label className={labelClass}>Savings Amount (Rs.)</label>
            <input type="number" value={form.savingsAmount} onChange={e => update('savingsAmount', e.target.value)} placeholder="0" min="0" className={inputClass} />
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {isSettlement ? 'Record Settlement' : 'Add Transaction'}
        </button>
      </div>
    </form>
  )
}

import { useState } from 'react'

export default function TransactionForm({ onAdd }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    date: today,
    type: 'Expense',
    description: '',
    paidBy: 'Lachitha',
    totalAmount: '',
    lachithaShare: '',
    sudewaShare: '',
  })

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = e => {
    e.preventDefault()
    const { date, type, description, paidBy, totalAmount, lachithaShare, sudewaShare } = form
    if (!date || !description || !totalAmount) return
    if (type === 'Expense' && (!lachithaShare || !sudewaShare)) return
    if (Number(totalAmount) <= 0) return

    const shares = type === 'Expense'
      ? { lachithaShare: Number(lachithaShare), sudewaShare: Number(sudewaShare) }
      : { lachithaShare: 0, sudewaShare: 0 }

    onAdd({
      id: Date.now(),
      date,
      type,
      description,
      paidBy,
      totalAmount: Number(totalAmount),
      ...shares,
    })

    setForm({
      date: today,
      type: 'Expense',
      description: '',
      paidBy: 'Lachitha',
      totalAmount: '',
      lachithaShare: '',
      sudewaShare: '',
    })
  }

  const isExpense = form.type === 'Expense'

  const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800">New Transaction</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" value={form.date} onChange={e => update('date', e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Transaction Type</label>
          <select value={form.type} onChange={e => update('type', e.target.value)} className={inputClass}>
            <option value="Expense">Expense</option>
            <option value="Settlement">Settlement</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input type="text" value={form.description} onChange={e => update('description', e.target.value)} placeholder="e.g. Groceries" className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Paid By</label>
          <select value={form.paidBy} onChange={e => update('paidBy', e.target.value)} className={inputClass}>
            <option value="Lachitha">Lachitha</option>
            <option value="Sudewa">Sudewa</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Total Amount (Rs.)</label>
          <input type="number" value={form.totalAmount} onChange={e => update('totalAmount', e.target.value)} placeholder="0" min="0" className={inputClass} required />
        </div>
        {isExpense && (
          <>
            <div>
              <label className={labelClass}>Lachitha Share (Rs.)</label>
              <input type="number" value={form.lachithaShare} onChange={e => update('lachithaShare', e.target.value)} placeholder="0" min="0" className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Sudewa Share (Rs.)</label>
              <input type="number" value={form.sudewaShare} onChange={e => update('sudewaShare', e.target.value)} placeholder="0" min="0" className={inputClass} required />
            </div>
          </>
        )}
      </div>
      <div className="flex justify-end">
        <button type="submit" className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Add Transaction
        </button>
      </div>
    </form>
  )
}

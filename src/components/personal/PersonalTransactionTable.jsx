import { useState } from 'react'

export default function PersonalTransactionTable({ transactions, onDelete, onEdit, categories, paymentMethods = [], creditCards = [] }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')

  const startEdit = transaction => {
    setEditing(transaction)
    setForm({ ...transaction })
  }

  const closeEdit = () => {
    setEditing(null)
    setForm(null)
  }

  const saveEdit = e => {
    e.preventDefault()
    if (!form.date || !form.description.trim() || Number(form.amount) <= 0) return
    onEdit({ ...form, description: form.description.trim(), amount: Number(form.amount) })
    closeEdit()
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-sm text-gray-500 bg-white rounded-xl border border-gray-200">
        No transactions yet. Add one above.
      </div>
    )
  }

  const getCategoryName = id => categories.find(c => c.id === id)?.name || id
  const filterOptions = 'min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base sm:text-sm'
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = `${t.description || ''} ${t.paymentMethod || ''} ${t.toCard || ''}`.toLowerCase().includes(search.toLowerCase())
    const matchesMonth = !month || t.date?.startsWith(month)
    const matchesType = typeFilter === 'all' || t.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
    const matchesPayment = paymentFilter === 'all' || t.paymentMethod === paymentFilter || t.toCard === paymentFilter
    return matchesSearch && matchesMonth && matchesType && matchesCategory && matchesPayment
  })
  const hasActiveFilters = Boolean(search || month || typeFilter !== 'all' || categoryFilter !== 'all' || paymentFilter !== 'all')

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-white p-3 lg:grid-cols-5">
        <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." aria-label="Search transactions" className={`${filterOptions} col-span-2 lg:col-span-1`} />
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} aria-label="Filter by month" className={filterOptions} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} aria-label="Filter by transaction type" className={filterOptions}>
          <option value="all">All types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
          <option value="settlement">Settlements</option>
          <option value="saving">Savings</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} aria-label="Filter by category" className={filterOptions}>
          <option value="all">All categories</option>
          {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} aria-label="Filter by payment method" className={filterOptions}>
          <option value="all">All payment methods</option>
          {[...new Set([...paymentMethods.map(pm => pm.name), ...creditCards.map(card => card.name)])].map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setMonth('')
              setTypeFilter('all')
              setCategoryFilter('all')
              setPaymentFilter('all')
            }}
            className="min-h-11 rounded-lg px-3 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-blue-500"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="space-y-2 sm:hidden">
        {filteredTransactions.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">No transactions match these filters.</div>
        ) : filteredTransactions.map(t => (
          <article key={t.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    t.type === 'expense' ? 'bg-red-100 text-red-700' :
                    t.type === 'income' ? 'bg-green-100 text-green-700' :
                    t.type === 'saving' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>{t.type === 'expense' ? 'Expense' : t.type === 'income' ? 'Income' : t.type === 'saving' ? 'Savings' : 'Settlement'}</span>
                  <span className="truncate text-xs text-gray-500">{t.date}</span>
                </div>
                <p className="break-words text-sm font-medium text-gray-800">{t.description}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {t.type === 'settlement' ? `Payment to ${t.toCard || 'card'}` : getCategoryName(t.category)}
                  {t.type !== 'settlement' && t.type !== 'saving' && t.paymentMethod ? ` · ${t.paymentMethod}` : ''}
                </p>
              </div>
              <span className={`shrink-0 text-right text-sm font-bold ${
                t.type === 'income' ? 'text-green-700' : t.type === 'saving' ? 'text-emerald-700' : t.type === 'expense' ? 'text-red-600' : 'text-blue-700'
              }`}>
                {t.type === 'income' || t.type === 'saving' ? '+' : '−'}Rs. {Number(t.amount).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex justify-end gap-2 border-t border-gray-100 pt-2">
              <button onClick={() => startEdit(t)} className="min-h-10 min-w-16 rounded-lg px-3 text-sm font-medium text-blue-600 hover:bg-blue-50">Edit</button>
              <button onClick={() => onDelete(t.id)} className="min-h-10 min-w-16 rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50">Delete</button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white sm:block">
        {filteredTransactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No transactions match these filters.</p>
        ) : (
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Date</th>
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Type</th>
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Description</th>
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 hidden sm:table-cell">Category</th>
            <th className="text-right px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Amount</th>
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 hidden sm:table-cell">Payment</th>
            <th className="px-2 sm:px-4 py-2 sm:py-3"></th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map(t => (
            <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{t.date}</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3">
                <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                  t.type === 'expense' ? 'bg-red-100 text-red-700' :
                  t.type === 'income' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                {t.type === 'expense' ? 'Exp' : t.type === 'income' ? 'Inc' : t.type === 'saving' ? 'Sav' : 'Set'}
                </span>
              </td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 max-w-[80px] sm:max-w-none truncate">
                {t.description}
                {t.toCard && <span className="text-xs text-gray-400 block sm:inline sm:ml-1">→ {t.toCard}</span>}
              </td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 whitespace-nowrap hidden sm:table-cell">
                {t.type === 'settlement' ? '-' : getCategoryName(t.category)}
              </td>
              <td className={`px-2 sm:px-4 py-2 sm:py-3 text-right font-medium whitespace-nowrap ${
                t.type === 'expense' ? 'text-red-600' :
                t.type === 'income' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : '-'} Rs. {Number(t.amount).toLocaleString()}
              </td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 hidden sm:table-cell">{t.paymentMethod}</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(t)} className="text-blue-500 hover:text-blue-700 text-xs" title="Edit">Edit</button>
                  <button onClick={() => onDelete(t.id)} className="text-gray-400 hover:text-red-500 transition-colors text-base sm:text-lg leading-none p-1" title="Delete">&times;</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        )}

      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={saveEdit} className="max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Edit {editing.type === 'expense' ? 'Expense' : editing.type === 'income' ? 'Income' : editing.type === 'saving' ? 'Savings' : 'Settlement'}</h2>
              <button type="button" onClick={closeEdit} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">Date
                <input type="date" value={form.date || ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" required />
              </label>
              <label className="text-sm font-medium text-gray-700">Amount (Rs.)
                <input type="number" inputMode="decimal" min="0.01" step="any" value={form.amount ?? ''} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" required />
              </label>
              <label className="text-sm font-medium text-gray-700 sm:col-span-2">Description
                <input type="text" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" required />
              </label>
              {(form.type === 'expense' || form.type === 'income') && (
                <label className="text-sm font-medium text-gray-700">Category
                  <select value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
                    {categories.filter(c => c.type === (form.type === 'income' ? 'income' : 'expense')).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
              )}
              {form.type === 'settlement' ? (
                <label className="text-sm font-medium text-gray-700">Credit card
                  <select value={form.toCard || ''} onChange={e => setForm(f => ({ ...f, toCard: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" required>
                    <option value="">Select card...</option>
                    {creditCards.map(card => <option key={card.name} value={card.name}>{card.name}</option>)}
                  </select>
                </label>
              ) : form.type !== 'saving' && (
                <label className="text-sm font-medium text-gray-700">Payment method
                  <select value={form.paymentMethod || ''} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
                    {paymentMethods.map(pm => <option key={pm.id} value={pm.name}>{pm.name}</option>)}
                  </select>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeEdit} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save Changes</button>
            </div>
          </form>
        </div>
      )}
      </div>
    </div>
  )
}

import { useState } from 'react'

export default function CategoryManager({ categories, paymentMethods, onAdd, onEdit, onDelete }) {
  const [newCat, setNewCat] = useState({ name: '', type: 'expense' })
  const [newPm, setNewPm] = useState('')
  const [activeTab, setActiveTab] = useState('categories')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', type: '' })

  const handleAddCategory = async e => {
    e.preventDefault()
    if (!newCat.name.trim()) return
    await onAdd({ name: newCat.name.trim(), type: newCat.type, itemType: 'category' })
    setNewCat({ name: '', type: 'expense' })
  }

  const handleAddPayment = async e => {
    e.preventDefault()
    if (!newPm.trim()) return
    await onAdd({ name: newPm.trim(), itemType: 'paymentMethod' })
    setNewPm('')
  }

  const startEdit = item => {
    setEditingId(item.id)
    setEditForm({ name: item.name, type: item.type || '' })
  }

  const saveEdit = async id => {
    if (!editForm.name.trim()) return
    await onEdit(id, editForm)
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ name: '', type: '' })
  }

  const inputClass = "min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800">Manage Categories & Payment Methods</h2>

      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('categories')} className={`min-h-11 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Categories
        </button>
        <button onClick={() => setActiveTab('payment')} className={`min-h-11 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'payment' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Payment Methods
        </button>
      </div>

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
            <div className="space-y-2">
              {categories.map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  {editingId === c.id ? (
                    <>
                      <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={`${inputClass} flex-1`} />
                      <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} className="rounded-lg border border-gray-300 px-2 py-2 text-xs">
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                      <button onClick={() => saveEdit(c.id)} className="text-xs text-green-600 hover:underline">Save</button>
                      <button onClick={cancelEdit} className="text-xs text-gray-400 hover:underline">Cancel</button>
                    </>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.builtin ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                      {c.name}
                      <span className={`text-[10px] px-1 rounded ${c.type === 'income' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{c.type}</span>
                      <button onClick={() => startEdit(c)} className="ml-1 text-blue-400 hover:text-blue-600">&#9998;</button>
                      <button type="button" onClick={() => onDelete(c.id)} aria-label={`Delete ${c.name} category`} className="ml-1 inline-flex min-h-8 min-w-8 items-center justify-center rounded-full text-base text-blue-400 hover:bg-red-50 hover:text-red-600">&times;</button>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddCategory} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input type="text" value={newCat.name} onChange={e => setNewCat(f => ({ ...f, name: e.target.value }))} placeholder="New category name" className={`${inputClass} flex-1`} />
            <select value={newCat.type} onChange={e => setNewCat(f => ({ ...f, type: e.target.value }))} className="min-h-11 rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <button type="submit" className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">Add Category</button>
          </form>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Methods</h3>
            <div className="space-y-2">
              {paymentMethods.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  {editingId === p.id ? (
                    <>
                      <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={`${inputClass} flex-1`} />
                      <button onClick={() => saveEdit(p.id)} className="text-xs text-green-600 hover:underline">Save</button>
                      <button onClick={cancelEdit} className="text-xs text-gray-400 hover:underline">Cancel</button>
                    </>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${p.builtin ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                      {p.name}
                      <button onClick={() => startEdit(p)} className="ml-1 text-blue-400 hover:text-blue-600">&#9998;</button>
                      <button type="button" onClick={() => onDelete(p.id)} aria-label={`Delete ${p.name} payment method`} className="ml-1 inline-flex min-h-8 min-w-8 items-center justify-center rounded-full text-base text-blue-400 hover:bg-red-50 hover:text-red-600">&times;</button>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddPayment} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <input type="text" value={newPm} onChange={e => setNewPm(e.target.value)} placeholder="New payment method" className={`${inputClass} flex-1`} />
            <button type="submit" className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">Add Payment Method</button>
          </form>
        </div>
      )}
    </div>
  )
}

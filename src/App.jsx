import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import TransactionForm from './components/TransactionForm'
import TransactionTable from './components/TransactionTable'

export default function App() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then(data => { setTransactions(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const addTransaction = async t => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t),
    })
    const saved = await res.json()
    setTransactions(prev => [...prev, saved])
  }

  const deleteTransaction = async id => {
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <header>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Expenses Tracker</h1>
          <p className="text-xs sm:text-sm text-gray-500">Track shared expenses between Lachitha & Sudewa</p>
        </header>

        <Dashboard transactions={transactions} />
        <TransactionForm onAdd={addTransaction} />
        <TransactionTable transactions={transactions} onDelete={deleteTransaction} />
      </div>
    </div>
  )
}

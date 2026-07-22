import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import TransactionForm from './components/TransactionForm'
import TransactionTable from './components/TransactionTable'

export default function App() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState('checking')

  useEffect(() => {
    fetch('/api/transactions?health')
      .then(res => res.json())
      .then(data => setDbStatus(data.status === 'connected' ? 'connected' : 'error'))
      .catch(() => setDbStatus('error'))

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
    const data = await res.json()
    if (!res.ok) { alert('DB Error: ' + data.error); return }
    setTransactions(prev => [...prev, data])
  }

  const deleteTransaction = async id => {
    const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { const data = await res.json(); alert('DB Error: ' + data.error); return }
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
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Expenses Tracker</h1>
            <p className="text-xs sm:text-sm text-gray-500">Track shared expenses between Lachitha & Sudewa</p>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            dbStatus === 'connected' ? 'bg-green-100 text-green-700' :
            dbStatus === 'error' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              dbStatus === 'connected' ? 'bg-green-500' :
              dbStatus === 'error' ? 'bg-red-500' :
              'bg-gray-400'
            }`} />
            DB {dbStatus === 'checking' ? '...' : dbStatus === 'connected' ? 'Connected' : 'Error'}
          </span>
        </header>

        <Dashboard transactions={transactions} />
        <TransactionForm onAdd={addTransaction} />
        <TransactionTable transactions={transactions} onDelete={deleteTransaction} />
      </div>
    </div>
  )
}

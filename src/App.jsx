import { useState, useEffect, useRef } from 'react'
import Dashboard from './components/Dashboard'
import TransactionForm from './components/TransactionForm'
import TransactionTable from './components/TransactionTable'

export default function App() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState('checking')
  const [dbError, setDbError] = useState('')
  const [toast, setToast] = useState(null)
  const pendingOp = useRef(Promise.resolve())

  useEffect(() => {
    fetch('/api/transactions')
      .then(async res => {
        const data = await res.json()
        if (!res.ok) { setDbStatus('error'); setDbError(data.error || 'Unknown'); setLoading(false); return }
        setDbStatus('connected')
        setTransactions(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => { setDbStatus('error'); setLoading(false) })
  }, [])

  const showToast = (msg, type) => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const addTransaction = t => {
    setTransactions(prev => [...prev, t])
    pendingOp.current = pendingOp.current.then(() =>
      fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      }).then(async res => {
        if (!res.ok) {
          setTransactions(prev => prev.filter(x => x.id !== t.id))
          showToast((await res.json()).error, 'error')
        } else {
          showToast('Saved ✓', 'success')
        }
      })
    )
  }

  const deleteTransaction = id => {
    setTransactions(prev => prev.filter(t => t.id !== id))
    pendingOp.current = pendingOp.current.then(() =>
      fetch(`/api/transactions?id=${id}`, { method: 'DELETE' }).then(async res => {
        if (!res.ok) {
          showToast((await res.json()).error, 'error')
        } else {
          showToast('Deleted ✓', 'success')
        }
      })
    )
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
          <span title={dbError} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
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

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg transition-all z-50 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

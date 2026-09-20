import { useState, useEffect } from 'react'
import { useAuth } from './context/useAuth'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import Dashboard from './components/Dashboard'
import TransactionForm from './components/TransactionForm'
import TransactionTable from './components/TransactionTable'
import PersonalDashboard from './components/personal/PersonalDashboard'
import PersonalTransactionForm from './components/personal/PersonalTransactionForm'
import PersonalTransactionTable from './components/personal/PersonalTransactionTable'
import CategoryManager from './components/personal/CategoryManager'
import Charts from './components/personal/Charts'
import ArchiveManager from './components/personal/ArchiveManager'
import CreditCardDetail from './components/personal/CreditCardDetail'

function SharedTracker() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState('checking')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetch('/api/transactions')
      .then(async res => {
        const data = await res.json()
        if (!res.ok) { setDbStatus('error'); setLoading(false); return }
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
    fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t),
    }).then(async res => {
      if (!res.ok) {
        setTransactions(prev => prev.filter(x => x.id !== t.id))
        showToast((await res.json()).error, 'error')
      } else {
        showToast('Saved', 'success')
      }
    })
  }

  const deleteTransaction = id => {
    setTransactions(prev => prev.filter(t => t.id !== id))
    fetch(`/api/transactions?id=${id}`, { method: 'DELETE' }).then(async res => {
      if (!res.ok) showToast((await res.json()).error, 'error')
      else showToast('Deleted', 'success')
    })
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            dbStatus === 'connected' ? 'bg-green-100 text-green-700' :
            dbStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              dbStatus === 'connected' ? 'bg-green-500' :
              dbStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            DB {dbStatus === 'checking' ? '...' : dbStatus === 'connected' ? 'Connected' : 'Error'}
          </span>
        </div>
        <a href="/myexpenses" className="text-sm text-blue-600 hover:underline font-medium">My Expenses &rarr;</a>
      </div>
      <Dashboard transactions={transactions} />
      <TransactionForm onAdd={addTransaction} />
      <TransactionTable transactions={transactions} onDelete={deleteTransaction} />

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>{toast.msg}</div>
      )}
    </div>
  )
}

function PersonalTracker() {
  const { user, logout, authHeaders } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [settings, setSettings] = useState(null)
  const [savings, setSavings] = useState([])
  const [installments, setInstallments] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showCategories, setShowCategories] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  const [newCard, setNewCard] = useState({ name: '', creditLimit: '' })

  useEffect(() => {
    if (!authHeaders.Authorization) return
    Promise.all([
      fetch('/api/personal/transactions', { headers: authHeaders }).then(r => r.json()),
      fetch('/api/personal/categories', { headers: authHeaders }).then(r => r.json()),
      fetch('/api/personal/settings', { headers: authHeaders }).then(r => r.json()),
      fetch('/api/personal/installments', { headers: authHeaders }).then(r => r.json()),
    ]).then(([txns, cats, sett, inst]) => {
      setTransactions(Array.isArray(txns) ? txns : [])
      if (cats.categories) setCategories(cats.categories)
      if (cats.paymentMethods) setPaymentMethods(cats.paymentMethods)
      if (sett) setSettings(sett)
      if (Array.isArray(inst)) setInstallments(inst)
      const savedTxns = Array.isArray(txns) ? txns.filter(t => t.type === 'saving') : []
      setSavings(savedTxns)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [authHeaders])

  const showToast = (msg, type) => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const addTransaction = t => {
    setTransactions(prev => [...prev, t])
    fetch('/api/personal/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(t),
    }).then(async res => {
      if (!res.ok) {
        setTransactions(prev => prev.filter(x => x.id !== t.id))
        showToast((await res.json()).error, 'error')
      } else {
        showToast('Saved', 'success')
      }
    })
  }

  const deleteTransaction = id => {
    setTransactions(prev => prev.filter(t => t.id !== id))
    fetch(`/api/personal/transactions?id=${id}`, { method: 'DELETE', headers: authHeaders }).then(async res => {
      if (!res.ok) showToast((await res.json()).error, 'error')
      else showToast('Deleted', 'success')
    })
  }

  const addCategory = async item => {
    const res = await fetch('/api/personal/categories', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(item) })
    if (res.ok) {
      const data = await res.json()
      if (data.itemType === 'category') setCategories(prev => [...prev, data])
      else setPaymentMethods(prev => [...prev, data])
      showToast('Added', 'success')
    }
  }

  const editCategory = async (id, updates) => {
    const res = await fetch('/api/personal/categories', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify({ id, ...updates }) })
    if (res.ok) {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
      setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
      if (updates.name) {
        const pm = paymentMethods.find(p => p.id === id)
        if (pm) {
          const cardEntry = Object.entries(settings?.creditCards || {}).find(([, c]) => c.name === pm.name)
          if (cardEntry) {
            const [cardId, card] = cardEntry
            const updated = {
              ...settings,
              creditCards: { ...settings.creditCards, [cardId]: { ...card, name: updates.name } }
            }
            setSettings(updated)
            saveSettings(updated)
          }
        }
      }
      showToast('Updated', 'success')
    }
  }

  const deleteCategory = async id => {
    const pm = paymentMethods.find(p => p.id === id)
    if (pm) {
      const cardEntry = Object.entries(settings?.creditCards || {}).find(([, c]) => c.name === pm.name)
      if (cardEntry) {
        const [cardId] = cardEntry
        const updated = { ...settings }
        delete updated.creditCards[cardId]
        setSettings(updated)
        saveSettings(updated)
      }
    }
    await fetch(`/api/personal/categories?id=${id}`, { method: 'DELETE', headers: authHeaders })
    setCategories(prev => prev.filter(c => c.id !== id))
    setPaymentMethods(prev => prev.filter(p => p.id !== id))
  }

  const saveSavings = t => {
    setSavings(prev => [...prev, t])
    setTransactions(prev => [...prev, { ...t, type: 'saving', category: 'savings', paymentMethod: 'Savings' }])
    fetch('/api/personal/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ ...t, type: 'saving', category: 'savings', paymentMethod: 'Savings' }),
    }).then(async res => {
      if (!res.ok) showToast((await res.json()).error, 'error')
    })
  }

  const saveSettings = async newSettings => {
    setSettings(newSettings)
    await fetch('/api/personal/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(newSettings),
    })
    showToast('Settings saved', 'success')
  }

  const handleArchiveComplete = () => {
    setTransactions([])
    setSavings([])
    showToast('Transactions archived. Starting fresh!', 'success')
  }

  const addInstallment = async data => {
    const res = await fetch('/api/personal/installments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const inst = await res.json()
      setInstallments(prev => [...prev, inst])
      showToast('Installment added', 'success')
    }
  }

  const deleteInstallment = async id => {
    await fetch(`/api/personal/installments?id=${id}`, { method: 'DELETE', headers: authHeaders })
    setInstallments(prev => prev.filter(i => i.id !== id))
  }

  const addCard = () => {
    if (!newCard.name.trim()) return
    const id = newCard.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36)
    const updated = {
      ...settings,
      creditCards: { ...settings.creditCards, [id]: { name: newCard.name.trim(), creditLimit: Number(newCard.creditLimit) || 0 } }
    }
    setSettings(updated)
    saveSettings(updated)
    addCategory({ name: newCard.name.trim(), itemType: 'paymentMethod' })
    setNewCard({ name: '', creditLimit: '' })
  }

  const updateCard = (id, updates) => {
    const updated = {
      ...settings,
      creditCards: { ...settings.creditCards, [id]: { ...settings.creditCards[id], ...updates } }
    }
    setSettings(updated)
    saveSettings(updated)
    const oldName = settings.creditCards[id]?.name
    if (updates.name && updates.name !== oldName) {
      const pm = paymentMethods.find(p => p.name === oldName)
      if (pm) editCategory(pm.id, { name: updates.name })
    }
    setEditingCard(null)
  }

  const deleteCard = id => {
    const cardName = settings.creditCards[id]?.name
    const updated = { ...settings }
    delete updated.creditCards[id]
    setSettings(updated)
    saveSettings(updated)
    if (cardName) {
      const pm = paymentMethods.find(p => p.name === cardName)
      if (pm) deleteCategory(pm.id)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <a href="/" className="text-sm text-blue-600 hover:underline font-medium">&larr; Shared Expenses</a>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">Sign Out</button>
        </div>
      </div>

      <Charts transactions={transactions} settings={settings} savings={savings} installments={installments} onCardClick={setSelectedCard} />
      <PersonalDashboard transactions={transactions} settings={settings} savings={savings} />
      <PersonalTransactionForm onAdd={addTransaction} categories={categories} paymentMethods={paymentMethods} settings={settings} onSaveSavings={saveSavings} />
      <PersonalTransactionTable transactions={transactions} onDelete={deleteTransaction} categories={categories} paymentMethods={paymentMethods} />
      <ArchiveManager
        authHeaders={authHeaders}
        transactions={transactions}
        savings={savings}
        settings={settings}
        onArchiveComplete={handleArchiveComplete}
      />

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setShowCategories(!showCategories)} className="text-sm text-blue-600 hover:underline font-medium">
          {showCategories ? 'Hide' : 'Manage'} Categories & Payment Methods
        </button>
        <button onClick={() => setShowSettings(!showSettings)} className="text-sm text-blue-600 hover:underline font-medium">
          {showSettings ? 'Hide' : 'Manage'} Credit Cards
        </button>
      </div>

      {showCategories && (
        <div className="mt-3">
          <CategoryManager
            categories={categories}
            paymentMethods={paymentMethods}
            onAdd={addCategory}
            onEdit={editCategory}
            onDelete={deleteCategory}
          />
        </div>
      )}

      {showSettings && (
        <div className="mt-3 bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">Credit Card Settings</h2>
          <p className="text-xs text-gray-500">Manage your credit cards. Set credit limit for each card.</p>

          <div className="space-y-2">
            {Object.entries(settings?.creditCards || {}).map(([id, card]) => (
              <div key={id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                {editingCard === id ? (
                  <>
                    <input type="text" value={card.name} onChange={e => {
                      const updated = { ...settings, creditCards: { ...settings.creditCards, [id]: { ...card, name: e.target.value } } }
                      setSettings(updated)
                    }} className="w-40 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                    <span className="text-xs text-gray-400">Limit:</span>
                    <input type="number" value={card.creditLimit} onChange={e => {
                      const updated = { ...settings, creditCards: { ...settings.creditCards, [id]: { ...card, creditLimit: Number(e.target.value) } } }
                      setSettings(updated)
                    }} className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                    <button onClick={() => updateCard(id, card)} className="text-xs text-green-600 hover:underline font-medium">Save</button>
                    <button onClick={() => setEditingCard(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-700 w-40">{card.name}</span>
                    <span className="text-xs text-gray-400">Limit: Rs. {(card.creditLimit || 0).toLocaleString()}</span>
                    <div className="flex-1" />
                    <button onClick={() => setEditingCard(id)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => deleteCard(id)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <input type="text" value={newCard.name} onChange={e => setNewCard(f => ({ ...f, name: e.target.value }))} placeholder="Card name" className="w-40 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
            <span className="text-xs text-gray-400">Limit:</span>
            <input type="number" value={newCard.creditLimit} onChange={e => setNewCard(f => ({ ...f, creditLimit: e.target.value }))} placeholder="0" className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
            <button onClick={addCard} className="text-xs text-blue-600 hover:underline font-medium">+ Add Card</button>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-700">Billing cycle starts on:</span>
            <input
              type="number"
              value={settings?.billingCycleDay || 6}
              onChange={e => setSettings(prev => ({ ...prev, billingCycleDay: Number(e.target.value) }))}
              min="1"
              max="28"
              className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400">of each month (salary: 25th)</span>
          </div>
          <button onClick={() => saveSettings(settings)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Save Settings
          </button>
        </div>
      )}

      {selectedCard && settings?.creditCards?.[selectedCard] && (
        <CreditCardDetail
          card={settings.creditCards[selectedCard]}
          cardId={selectedCard}
          transactions={transactions}
          installments={installments}
          settings={settings}
          onAddInstallment={addInstallment}
          onDeleteInstallment={deleteInstallment}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>{toast.msg}</div>
      )}
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const [authMode, setAuthMode] = useState('login')
  const isPersonal = window.location.pathname === '/myexpenses'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (isPersonal && !user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="mb-4">
            <a href="/" className="text-sm text-blue-600 hover:underline font-medium">&larr; Back to Shared Expenses</a>
          </div>
          {authMode === 'login'
            ? <LoginForm onSwitch={() => setAuthMode('register')} />
            : <RegisterForm onSwitch={() => setAuthMode('login')} />
          }
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              {isPersonal ? 'My Expenses' : 'Expenses Tracker'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {isPersonal ? 'Your personal expense tracker' : 'Track shared expenses between Lachitha & Sudewa'}
            </p>
          </div>
        </header>

        {isPersonal ? <PersonalTracker /> : <SharedTracker />}
      </div>
    </div>
  )
}

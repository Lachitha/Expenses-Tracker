import { useState, useEffect } from 'react'

export default function ArchiveManager({ authHeaders, transactions, savings, settings, onArchiveComplete }) {
  const [archives, setArchives] = useState([])
  const [loading, setLoading] = useState(true)
  const [showArchive, setShowArchive] = useState(false)
  const [selectedArchive, setSelectedArchive] = useState(null)
  const [archiving, setArchiving] = useState(false)
  const [label, setLabel] = useState('')

  const now = new Date()
  const isSalaryDay = now.getDate() === 25

  useEffect(() => {
    if (!authHeaders.Authorization) return
    fetch('/api/personal/archives', { headers: authHeaders })
      .then(r => r.json())
      .then(data => {
        setArchives(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [authHeaders])

  const handleArchive = async () => {
    if (transactions.length === 0) return
    setArchiving(true)

    const archiveLabel = label.trim() || `Archive ${now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`

    const res = await fetch('/api/personal/archives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        label: archiveLabel,
        transactions,
        savings,
        settings,
      }),
    })

    if (res.ok) {
      const archive = await res.json()
      setArchives(prev => [archive, ...prev])
      setLabel('')
      onArchiveComplete()
      showToast('Archived successfully', 'success')
    }
    setArchiving(false)
  }

  const handleDeleteArchive = async id => {
    await fetch(`/api/personal/archives?id=${id}`, { method: 'DELETE', headers: authHeaders })
    setArchives(prev => prev.filter(a => a.id !== id))
    if (selectedArchive?.id === id) setSelectedArchive(null)
  }

  const [toast, setToast] = useState(null)
  const showToast = (msg, type) => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const getArchiveStats = archive => {
    const txns = archive.transactions || []
    const inc = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const exp = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const sav = (archive.savings || []).reduce((s, t) => s + Number(t.amount), 0)
    return { income: inc, expenses: exp, savings: sav, count: txns.length }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800">Archives</h2>
        <div className="flex gap-2">
          {isSalaryDay && transactions.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Salary Day!</span>
          )}
          <button onClick={() => setShowArchive(!showArchive)} className="text-sm text-blue-600 hover:underline font-medium">
            {showArchive ? 'Hide' : 'View'} Archives
          </button>
        </div>
      </div>

      {isSalaryDay && transactions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
          <p className="text-sm text-amber-700 font-medium">It's salary day! Archive your current transactions to start fresh.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Archive label (optional)"
              className="min-h-11 w-full flex-1 rounded-lg border border-amber-300 px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 sm:text-sm"
            />
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="min-h-11 rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              {archiving ? 'Archiving...' : 'Archive Now'}
            </button>
          </div>
        </div>
      )}

      {!isSalaryDay && transactions.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Archive label (optional)"
            className="min-h-11 w-full flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
          />
          <button
            onClick={handleArchive}
            disabled={archiving || transactions.length === 0}
            className="min-h-11 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {archiving ? 'Archiving...' : 'Archive Current'}
          </button>
        </div>
      )}

      {showArchive && (
        <div className="space-y-3">
          {loading && <p className="text-sm text-gray-400">Loading archives...</p>}
          {!loading && archives.length === 0 && <p className="text-sm text-gray-400">No archives yet.</p>}

          {selectedArchive && (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-blue-800">{selectedArchive.label}</h3>
                <button onClick={() => setSelectedArchive(null)} className="text-xs text-blue-500 hover:underline">Close</button>
              </div>
              <p className="text-xs text-blue-500">Archived on {new Date(selectedArchive.archivedAt).toLocaleDateString()}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white rounded-lg p-2 text-center">
                  <div className="text-gray-400">Income</div>
                  <div className="font-semibold text-green-600">Rs. {getArchiveStats(selectedArchive).income.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <div className="text-gray-400">Expenses</div>
                  <div className="font-semibold text-red-600">Rs. {getArchiveStats(selectedArchive).expenses.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <div className="text-gray-400">Savings</div>
                  <div className="font-semibold text-emerald-600">Rs. {getArchiveStats(selectedArchive).savings.toLocaleString()}</div>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b">
                      <th className="text-left py-1">Date</th>
                      <th className="text-left py-1">Type</th>
                      <th className="text-left py-1">Desc</th>
                      <th className="text-right py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedArchive.transactions || []).map(t => (
                      <tr key={t.id} className="border-b border-gray-100">
                        <td className="py-1 text-gray-600">{t.date}</td>
                        <td className="py-1">
                          <span className={`px-1 rounded text-[10px] ${
                            t.type === 'expense' ? 'bg-red-100 text-red-600' :
                            t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                          }`}>{t.type === 'expense' ? 'Exp' : t.type === 'income' ? 'Inc' : 'Set'}</span>
                        </td>
                        <td className="py-1 text-gray-600 truncate max-w-[100px]">{t.description}</td>
                        <td className="py-1 text-right font-medium text-gray-700">Rs. {Number(t.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && archives.map(a => (
            <div key={a.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              selectedArchive?.id === a.id ? 'border-blue-300 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
            }`}>
              <button onClick={() => setSelectedArchive(a)} className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-700">{a.label}</div>
                <div className="text-xs text-gray-400">
                  {new Date(a.archivedAt).toLocaleDateString()} · {(a.transactions || []).length} transactions
                </div>
              </button>
              <button onClick={() => handleDeleteArchive(a.id)} className="text-gray-400 hover:text-red-500 text-sm px-2">&times;</button>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>{toast.msg}</div>
      )}
    </div>
  )
}

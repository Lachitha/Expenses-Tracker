import { getDashboardMetrics, calculateBalance, getStatus } from '../utils/calculations'

export default function Dashboard({ transactions }) {
  const { totalExpenses, lachithaPaid, sudowaPaid } = getDashboardMetrics(transactions)
  const balance = calculateBalance(transactions)
  const status = getStatus(balance)

  const cards = [
    { label: 'Total Expenses', value: `Rs. ${totalExpenses.toLocaleString()}`, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Lachitha Paid', value: `Rs. ${lachithaPaid.toLocaleString()}`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: 'Sudewa Paid', value: `Rs. ${sudowaPaid.toLocaleString()}`, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Current Balance', value: `Rs. ${Math.abs(balance).toLocaleString()}`, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-xl border p-3 sm:p-4 ${c.color}`}>
            <p className="text-xs sm:text-sm font-medium opacity-75">{c.label}</p>
            <p className="text-lg sm:text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>
      <div className={`rounded-xl border p-3 sm:p-4 text-center ${
        status.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
        status.color === 'red' ? 'bg-red-50 text-red-700 border-red-200' :
        'bg-gray-50 text-gray-700 border-gray-200'
      }`}>
        <p className="text-sm sm:text-lg font-semibold">
          {status.color === 'green' ? '🟢' : status.color === 'red' ? '🔴' : '✅'} {status.text}
        </p>
      </div>
    </div>
  )
}

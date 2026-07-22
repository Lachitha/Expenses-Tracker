import { getStatus } from '../utils/calculations'

export default function TransactionTable({ transactions, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-sm text-gray-500 bg-white rounded-xl border border-gray-200">
        No transactions yet. Add one above.
      </div>
    )
  }

  let runningBalance = 0

  const rows = transactions.map(t => {
    if (t.type === 'Expense') {
      runningBalance += t.paidBy === 'Lachitha' ? t.sudewaShare : -t.lachithaShare
    } else {
      runningBalance -= t.paidBy === 'Sudewa' ? t.totalAmount : -t.totalAmount
    }
    const status = getStatus(runningBalance)

    return { ...t, balanceText: status.text, balanceColor: status.color }
  })

  return (
    <div className="-mx-3 sm:mx-0 overflow-x-auto rounded-none sm:rounded-xl border-0 sm:border border-gray-200 bg-white">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Date</th>
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Type</th>
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Description</th>
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Paid By</th>
            <th className="text-right px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Total</th>
            <th className="text-right px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">L. Share</th>
            <th className="text-right px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">S. Share</th>
            <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600">Status</th>
            <th className="px-2 sm:px-4 py-2 sm:py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(t => (
            <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{t.date}</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3">
                <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                  t.type === 'Expense' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {t.type === 'Expense' ? 'Exp' : 'Set'}
                </span>
              </td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 max-w-[80px] sm:max-w-none truncate">{t.description}</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{t.paidBy === 'Lachitha' ? 'Lac' : 'Sud'}</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-700 font-medium whitespace-nowrap">{t.totalAmount.toLocaleString()}</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-600 whitespace-nowrap hidden sm:table-cell">{t.type === 'Expense' ? t.lachithaShare.toLocaleString() : '-'}</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-600 whitespace-nowrap hidden sm:table-cell">{t.type === 'Expense' ? t.sudewaShare.toLocaleString() : '-'}</td>
              <td className={`px-2 sm:px-4 py-2 sm:py-3 font-medium whitespace-nowrap ${
                t.balanceColor === 'green' ? 'text-green-600' :
                t.balanceColor === 'red' ? 'text-red-600' : 'text-gray-500'
              }`}>
                <span className="hidden sm:inline">{t.balanceColor === 'green' ? '🟢' : t.balanceColor === 'red' ? '🔴' : '✅'} {t.balanceText}</span>
                <span className="sm:hidden">{t.balanceColor === 'green' ? '🟢' : t.balanceColor === 'red' ? '🔴' : '✅'}</span>
              </td>
              <td className="px-2 sm:px-4 py-2 sm:py-3">
                <button onClick={() => onDelete(t.id)} className="text-gray-400 hover:text-red-500 transition-colors text-base sm:text-lg leading-none p-1" title="Delete">&times;</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

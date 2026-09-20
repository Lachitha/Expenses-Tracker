export default function PersonalTransactionTable({ transactions, onDelete, categories }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-sm text-gray-500 bg-white rounded-xl border border-gray-200">
        No transactions yet. Add one above.
      </div>
    )
  }

  const getCategoryName = id => categories.find(c => c.id === id)?.name || id

  return (
    <div className="-mx-3 sm:mx-0 overflow-x-auto rounded-none sm:rounded-xl border-0 sm:border border-gray-200 bg-white">
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
          {transactions.map(t => (
            <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{t.date}</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3">
                <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                  t.type === 'expense' ? 'bg-red-100 text-red-700' :
                  t.type === 'income' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {t.type === 'expense' ? 'Exp' : t.type === 'income' ? 'Inc' : 'Set'}
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
                <button onClick={() => onDelete(t.id)} className="text-gray-400 hover:text-red-500 transition-colors text-base sm:text-lg leading-none p-1" title="Delete">&times;</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

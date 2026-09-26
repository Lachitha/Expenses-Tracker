export function getAvailableCredit(creditLimit, settled, spent) {
  const limit = Number(creditLimit) || 0
  return Math.min(limit, limit + (Number(settled) || 0) - (Number(spent) || 0))
}

export function isExternalPaymentMethod(methodName, paymentMethods = []) {
  const paymentMethod = paymentMethods.find(method => method.name === methodName)
  return paymentMethod?.balanceTreatment === 'external' || methodName?.trim().toLowerCase() === 'sudewa'
}

export function isPaymentMethodForCard(methodName, cardId, cardName, paymentMethods = []) {
  if (isExternalPaymentMethod(methodName, paymentMethods)) return false
  const paymentMethod = paymentMethods.find(method => method.name === methodName)
  return methodName === cardName || paymentMethod?.creditCardId === cardId || paymentMethod?.creditCardId === cardName
}

export function isCreditPaymentMethod(methodName, paymentMethods = []) {
  if (isExternalPaymentMethod(methodName, paymentMethods)) return false
  return paymentMethods.some(method => method.name === methodName && method.creditCardId)
}

/**
 * Проверяет, является ли оффер новым (создан менее 2 дней назад)
 */
export function isNewOffer(createdAt: Date): boolean {
  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 дня в миллисекундах
  return createdAt > twoDaysAgo
}

/**
 * Форматирует дату создания для отображения
 */
export function formatCreatedDate(createdAt: Date): string {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return 'Только что'
  } else if (diffInHours < 24) {
    return `${diffInHours} ч назад`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} д назад`
  }
}

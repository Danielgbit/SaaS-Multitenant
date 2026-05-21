'use client'

interface QueueHealthCardsProps {
  queue: {
    pending: number
    processing: number
    sent: number
    failed: number
    failed_permanently: number
  }
  deadLetters: number
}

export function QueueHealthCards({ queue, deadLetters }: QueueHealthCardsProps) {
  const cards = [
    {
      label: 'Pendientes',
      value: queue.pending,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Procesando',
      value: queue.processing,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Enviados',
      value: queue.sent,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Fallidos',
      value: queue.failed + queue.failed_permanently,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Dead Letters',
      value: deadLetters,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border p-4 ${card.bgColor}`}
        >
          <div className="text-sm font-medium text-muted-foreground">
            {card.label}
          </div>
          <div className={`mt-2 text-3xl font-bold ${card.color}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  )
}

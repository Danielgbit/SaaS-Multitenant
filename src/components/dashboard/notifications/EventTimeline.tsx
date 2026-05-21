'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Event {
  id: string
  event_type: string
  created_at: string
  trace_id?: string
  queue_item_id?: string
  metadata?: Record<string, unknown>
}

interface EventTimelineProps {
  events: Event[]
}

export function EventTimeline({ events }: EventTimelineProps) {
  // Group by traceId
  const eventsByTrace = new Map<string, Event[]>()
  const eventsWithoutTrace: Event[] = []

  for (const event of events) {
    if (event.trace_id) {
      const existing = eventsByTrace.get(event.trace_id) || []
      existing.push(event)
      eventsByTrace.set(event.trace_id, existing)
    } else {
      eventsWithoutTrace.push(event)
    }
  }

  // Sort each group by created_at ASC
  for (const [traceId, traceEvents] of eventsByTrace) {
    traceEvents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    eventsByTrace.set(traceId, traceEvents)
  }

  // Sort traces by most recent event
  const sortedTraces = Array.from(eventsByTrace.entries()).sort(
    (a, b) =>
      new Date(b[1][b[1].length - 1].created_at).getTime() -
      new Date(a[1][a[1].length - 1].created_at).getTime()
  )

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 font-semibold">Timeline de Eventos</h3>
      <div className="space-y-2">
        {sortedTraces.slice(0, 10).map(([traceId, traceEvents]) => (
          <TraceGroup key={traceId} traceId={traceId} events={traceEvents} />
        ))}
        {eventsWithoutTrace.slice(0, 5).map((event) => (
          <div key={event.id} className="rounded bg-muted px-3 py-2 text-sm">
            <span className="font-mono text-xs text-muted-foreground">
              {new Date(event.created_at).toLocaleString()}
            </span>
            <span className="ml-2 font-medium">{event.event_type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TraceGroup({ traceId, events }: { traceId: string; events: Event[] }) {
  const [expanded, setExpanded] = useState(false)

  const lastEvent = events[events.length - 1]

  return (
    <div className="rounded border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 hover:bg-muted"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="font-mono text-xs">{traceId.slice(0, 8)}...</span>
          <span className="text-sm font-medium">{lastEvent.event_type}</span>
          <span className="text-xs text-muted-foreground">
            ({events.length} eventos)
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(lastEvent.created_at).toLocaleString()}
        </span>
      </button>
      {expanded && (
        <div className="border-t bg-muted">
          {events.map((event) => (
            <div key={event.id} className="px-3 py-2 text-sm">
              <span className="font-mono text-xs text-muted-foreground">
                {new Date(event.created_at).toLocaleTimeString()}
              </span>
              <span className="ml-2 font-medium">{event.event_type}</span>
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <pre className="mt-1 text-xs text-muted-foreground">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

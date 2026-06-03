'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

interface Tab {
  label: string
  data: Record<string, unknown> | string | null
}

interface RawWebhookViewerProps {
  data: Record<string, unknown> | string | null | undefined
  title?: string
  defaultCollapsed?: boolean
  height?: string
  copyable?: boolean
  tabs?: Tab[]
}

function detectProvider(data: Record<string, unknown> | string | null | undefined): string | null {
  if (!data || typeof data === 'string') return null
  if (data.key || data.message || data.conversation) return 'wasender'
  if (data.provider_message_id || data.message_id) return 'n8n'
  return null
}

function highlightJSON(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(?:[^"\\]|\\.)*")\s*:/g,
      '<span style="color:hsl(220, 60%, 50%)">$1</span>:'
    )
    .replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      ': <span style="color:hsl(110, 50%, 45%)">$1</span>'
    )
    .replace(
      /:\s*(true|false|null)/g,
      ': <span style="color:hsl(30, 80%, 50%)">$1</span>'
    )
    .replace(
      /:\s*(-?\d+\.?\d*)/g,
      ': <span style="color:hsl(260, 60%, 55%)">$1</span>'
    )
}

function formatValue(data: Record<string, unknown> | string | null | undefined): string {
  if (data === null || data === undefined) return ''
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return data
    }
  }
  return JSON.stringify(data, null, 2)
}

export function RawWebhookViewer({
  data,
  title,
  defaultCollapsed = false,
  height = 'auto',
  copyable = true,
  tabs,
}: RawWebhookViewerProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const COLORS = useThemeColors()

  const hasData = data !== null && data !== undefined
  const providerLabel = hasData ? detectProvider(data) : null
  const rawJson = hasData ? formatValue(data) : ''
  const highlighted = rawJson ? highlightJSON(rawJson) : ''

  const handleCopy = useCallback(async () => {
    if (!rawJson) return
    try {
      await navigator.clipboard.writeText(rawJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = rawJson
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [rawJson])

  const hasTabs = tabs && tabs.length > 0
  const activeData = hasTabs ? tabs[activeTab].data : null
  const activeJson = hasTabs ? formatValue(activeData) : rawJson
  const activeHighlighted = activeJson ? highlightJSON(activeJson) : ''

  if (!hasData && (!hasTabs || tabs!.every((t) => t.data === null || t.data === undefined))) {
    return (
      <div className="rounded-lg border p-4">
        {title && <div className="text-sm font-medium text-muted-foreground mb-2">{title}</div>}
        <span className="text-sm text-muted-foreground">—</span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: COLORS.border }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-pointer select-none hover:bg-muted/30 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
        style={{ borderBottom: collapsed ? 'none' : `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
          )}
          {title && (
            <span className="text-sm font-medium truncate">{title}</span>
          )}
          {providerLabel && (
            <span
              className="rounded px-1.5 py-0.5 text-xs font-mono shrink-0"
              style={{
                backgroundColor: COLORS.primarySubtle,
                color: COLORS.primary,
              }}
            >
              {providerLabel}
            </span>
          )}
          {!hasData && (
            <span className="text-xs text-muted-foreground">empty</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {copyable && rawJson && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCopy()
              }}
              className="rounded p-1 hover:bg-muted transition-colors"
              title="Copy JSON"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div>
          {/* Tabs */}
          {hasTabs && tabs && tabs.length > 0 && (
            <div
              className="flex gap-0 px-4 pt-2"
              style={{ borderBottom: `1px solid ${COLORS.border}` }}
            >
              {tabs.map((tab, i) => (
                <button
                  key={tab.label}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveTab(i)
                  }}
                  className="px-3 py-1.5 text-xs font-medium transition-colors rounded-t-md"
                  style={{
                    color: activeTab === i ? COLORS.textPrimary : COLORS.textMuted,
                    backgroundColor: activeTab === i ? COLORS.surfaceSubtle : 'transparent',
                    border: activeTab === i
                      ? `1px solid ${COLORS.border}`
                      : '1px solid transparent',
                    borderBottom: activeTab === i ? `1px solid ${COLORS.surfaceSubtle}` : 'none',
                    marginBottom: activeTab === i ? '-1px' : '0',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* JSON */}
          <div
            className="overflow-auto font-mono text-xs leading-relaxed"
            style={{
              maxHeight: height !== 'auto' ? height : 'none',
              padding: '12px 16px',
              backgroundColor: COLORS.surfaceSubtle,
            }}
          >
            <pre
              className="whitespace-pre-wrap break-all m-0"
              dangerouslySetInnerHTML={{ __html: activeHighlighted || '—' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

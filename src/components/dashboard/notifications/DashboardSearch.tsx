'use client'

import { useRouter } from 'next/navigation'
import { SearchInput } from './SearchInput'
import { FileSearch } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useThemeColors } from '@/hooks/useThemeColors'

export function DashboardSearch() {
  const router = useRouter()
  const COLORS = useThemeColors()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3"
    >
      <div className="flex-1 max-w-md">
        <SearchInput
          placeholder="Buscar mensajes por ID, teléfono, trace..."
          onSearch={(term) => {
            if (term.length >= 3) {
              router.push(`/notificaciones/messages?q=${encodeURIComponent(term)}`)
            }
          }}
        />
      </div>
      <Link
        href="/notificaciones/messages"
        className="rounded-xl border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors inline-flex items-center gap-1.5 shrink-0"
        style={{ borderColor: COLORS.border }}
      >
        <FileSearch className="w-4 h-4" />
        Inspector
      </Link>
    </motion.div>
  )
}

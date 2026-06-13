import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import { WebSocket } from 'ws'

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WebSocket as any
}

// 'server-only' is a virtual package resolved by Next.js but not by vitest.
// Mock it as an empty module so the import chain doesn't fail in tests.
vi.mock('server-only', () => ({}))

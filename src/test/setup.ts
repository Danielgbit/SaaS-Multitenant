import '@testing-library/jest-dom/vitest'
import { WebSocket } from 'ws'

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WebSocket as any
}

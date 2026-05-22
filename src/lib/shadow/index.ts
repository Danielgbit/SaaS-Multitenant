/**
 * @deprecated Phase 2A shadow validation — consolidated into src/lib/notifications/shadow/.
 * Kept as stub so existing dynamic imports (with .catch(() => {})) continue working.
 */

const noopQueue = {
  enqueue: async (_fn: () => Promise<void>): Promise<void> => { /* no-op */ },
}

export const shadowQueue = noopQueue

export async function runShadowValidation(): Promise<void> {
  /* no-op — use src/lib/notifications/shadow/ instead */
}

import { describe, it, expect } from 'vitest'

describe('confirmByReception — status mapping logic', () => {
  type Action = 'complete' | 'no_show' | 'not_performed'

  function mapActionToAppointmentStatus(action: Action): string {
    switch (action) {
      case 'complete':
        return 'completed'
      case 'no_show':
        return 'no_show'
      case 'not_performed':
        return 'cancelled'
    }
  }

  it('maps not_performed to cancelled (doble L)', () => {
    const status = mapActionToAppointmentStatus('not_performed')
    expect(status).toBe('cancelled')
  })

  it('maps complete to completed', () => {
    const status = mapActionToAppointmentStatus('complete')
    expect(status).toBe('completed')
  })

  it('maps no_show to no_show', () => {
    const status = mapActionToAppointmentStatus('no_show')
    expect(status).toBe('no_show')
  })

  it('does NOT map not_performed to canceled (una L)', () => {
    const status = mapActionToAppointmentStatus('not_performed')
    expect(status).not.toBe('canceled')
  })
})

import { describe, it, expect } from 'vitest'
import {
  buildEmployeeMap, buildClientMap, buildServiceMap,
  enrichAppointmentsWithDetails,
} from '../transformers'
import type { Employee, Client, Service, AppointmentWithDetails } from '@/types/calendar'

const mockEmployees: Employee[] = [
  { id: 'e1', organization_id: 'org-1', name: 'Ana', phone: '123', active: true, created_at: '' },
  { id: 'e2', organization_id: 'org-1', name: 'Luis', phone: '456', active: true, created_at: '' },
]

const mockClients: Client[] = [
  { id: 'c1', organization_id: 'org-1', name: 'Carlos', phone: '789', email: null, notes: null, created_at: '' },
]

const mockServices: Service[] = [
  { id: 's1', organization_id: 'org-1', name: 'Corte', duration: 30, price: 25, active: true, created_at: '' },
]

describe('buildEmployeeMap', () => {
  it('mapea empleados por id', () => {
    const map = buildEmployeeMap(mockEmployees)
    expect(map.get('e1')?.name).toBe('Ana')
    expect(map.get('e2')?.name).toBe('Luis')
  })

  it('retorna mapa vacío para array vacío', () => {
    const map = buildEmployeeMap([])
    expect(map.size).toBe(0)
  })
})

describe('buildClientMap', () => {
  it('mapea clientes por id', () => {
    const map = buildClientMap(mockClients)
    expect(map.get('c1')?.name).toBe('Carlos')
  })
})

describe('buildServiceMap', () => {
  it('mapea servicios por id', () => {
    const map = buildServiceMap(mockServices)
    expect(map.get('s1')?.name).toBe('Corte')
  })
})

describe('enrichAppointmentsWithDetails', () => {
  const empMap = buildEmployeeMap(mockEmployees)
  const cliMap = buildClientMap(mockClients)
  const srvMap = buildServiceMap(mockServices)

  const rawAppointment = {
    id: 'apt-1',
    organization_id: 'org-1',
    client_id: 'c1',
    employee_id: 'e1',
    service_id: 's1',
    start_time: '2026-05-22T10:00:00Z',
    end_time: '2026-05-22T11:00:00Z',
    status: 'pending',
    created_at: '',
  }

  it('enriquece citas con datos de empleado, cliente y servicio', () => {
    const enriched = enrichAppointmentsWithDetails([rawAppointment], empMap, cliMap, srvMap)
    expect(enriched[0].employee?.name).toBe('Ana')
    expect(enriched[0].client?.name).toBe('Carlos')
    expect(enriched[0].service?.name).toBe('Corte')
  })

  it('maneja citas sin service_id', () => {
    const apt = { ...rawAppointment, service_id: undefined }
    const enriched = enrichAppointmentsWithDetails([apt], empMap, cliMap, srvMap)
    expect(enriched[0].service).toBeUndefined()
  })

  it('retorna array vacío para entrada vacía', () => {
    const enriched = enrichAppointmentsWithDetails([], empMap, cliMap, srvMap)
    expect(enriched).toEqual([])
  })

  it('no falla si un empleado no existe en el mapa', () => {
    const apt = { ...rawAppointment, employee_id: 'nonexistent' }
    const enriched = enrichAppointmentsWithDetails([apt], empMap, cliMap, srvMap)
    expect(enriched[0].employee).toBeUndefined()
  })
})

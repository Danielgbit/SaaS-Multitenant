'use client'

import { useMemo } from 'react'
import type { AppointmentWithDetails } from '@/types/calendar'

const TIME_WINDOW_MS = 5 * 60 * 1000

export interface ClusterGroup {
  timeKey: string
  appointments: AppointmentWithDetails[]
  isOverlapping: boolean
  totalCount: number
  primaryApt: AppointmentWithDetails
}

export function useAppointmentClusters(
  appointments: AppointmentWithDetails[],
  isAllEmployees: boolean
): {
  clusters: ClusterGroup[]
  renderAppointments: (
    renderCard: (apt: AppointmentWithDetails, index: number) => React.ReactNode,
    renderCluster: (cluster: ClusterGroup, index: number) => React.ReactNode
  ) => React.ReactNode[]
} {
  const clusters = useMemo(() => {
    if (!isAllEmployees) return []

    const sorted = [...appointments].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

    const result: ClusterGroup[] = []
    let i = 0

    while (i < sorted.length) {
      const current = sorted[i]
      const currentTime = new Date(current.start_time).getTime()

      const overlapping: AppointmentWithDetails[] = [current]

      let j = i + 1
      while (j < sorted.length) {
        const nextTime = new Date(sorted[j].start_time).getTime()
        if (Math.abs(nextTime - currentTime) <= TIME_WINDOW_MS) {
          overlapping.push(sorted[j])
          j++
        } else {
          break
        }
      }

      if (overlapping.length >= 2) {
        result.push({
          timeKey: new Date(current.start_time).toISOString(),
          appointments: overlapping,
          isOverlapping: true,
          totalCount: overlapping.length,
          primaryApt: overlapping[0]
        })
      }

      i = j
    }

    return result
  }, [appointments, isAllEmployees])

  const clusterMap = useMemo(() => {
    const map = new Map<string, ClusterGroup>()
    clusters.forEach(cluster => {
      cluster.appointments.forEach(apt => {
        map.set(apt.id, cluster)
      })
    })
    return map
  }, [clusters])

  const renderAppointments = (
    renderCard: (apt: AppointmentWithDetails, index: number) => React.ReactNode,
    renderCluster: (cluster: ClusterGroup, index: number) => React.ReactNode
  ) => {
    const result: React.ReactNode[] = []
    const usedIds = new Set<string>()
    let clusterIndex = 0

    appointments.forEach((apt, index) => {
      if (usedIds.has(apt.id)) return

      const cluster = clusterMap.get(apt.id)

      if (cluster && cluster.isOverlapping) {
        result.push(renderCluster(cluster, clusterIndex))
        cluster.appointments.forEach(a => usedIds.add(a.id))
        clusterIndex++
      } else {
        result.push(renderCard(apt, index))
      }
    })

    return result
  }

  return { clusters, renderAppointments }
}
'use client'

import React, { createContext, useContext, ReactNode } from 'react'

interface OrganizationContextType {
  organizationId: string | null
  role: string | null
  isLoading: boolean
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizationId: null,
  role: null,
  isLoading: true,
})

export function OrganizationProvider({
  children,
  organizationId,
  role,
}: {
  children: ReactNode
  organizationId: string | null
  role: string | null
}) {
  return (
    <OrganizationContext.Provider
      value={{
        organizationId,
        role,
        isLoading: false,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

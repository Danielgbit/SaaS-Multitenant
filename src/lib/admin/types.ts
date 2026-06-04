export interface MonthlyPoint {
  month: string
  count: number
}

export interface PlatformMetrics {
  totalOrganizations: number
  activeOrganizations: number
  suspendedOrganizations: number
  trialOrganizations: number
  activeSubscriptions: number

  totalUsers: number
  activeUsers: number

  mrr: number
  arr: number
  monthlyRevenue: number

  activePromoCodes: number

  organizationGrowth: MonthlyPoint[]
  userGrowth: MonthlyPoint[]
  revenueGrowth: MonthlyPoint[]
}

export interface PlatformUser {
  id: string
  email: string
  organizationCount: number
  primaryRole: string | null
  primaryOrgName: string | null
  lastSignInAt: string | null
  createdAt: string
  isActive: boolean
}

export interface OrganizationSummary {
  id: string
  name: string
  slug: string
  planName: string | null
  subscriptionStatus: string | null
  trialEndsAt: string | null
  status: string
  statusReason: string | null
  ownerEmail: string | null
  memberCount: number
  createdAt: string
}

export type OrganizationStatus = 'active' | 'suspended' | 'maintenance'

export interface OrganizationDetail {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
  statusReason: string | null
  createdAt: string

  subscription: {
    planName: string | null
    planPrice: number | null
    status: string | null
    trialEndsAt: string | null
    currentPeriodEnd: string | null
    stripeCustomerId: string | null
    cancelAtPeriodEnd: boolean | null
    canceledAt: string | null
  } | null

  members: Array<{
    userId: string
    email: string
    role: string
  }>

  memberCount: number
  ownerEmail: string | null
}

export interface OrganizationAccess {
  userId: string
  role: string
  organizationStatus: OrganizationStatus
}

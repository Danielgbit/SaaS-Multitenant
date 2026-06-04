import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PlatformMetrics, PlatformUser, OrganizationSummary, OrganizationDetail, OrganizationStatus, MonthlyPoint } from './types'

function groupByMonth(records: { created_at: string }[], lastMonths = 12): MonthlyPoint[] {
  const groups: Record<string, number> = {}
  const now = new Date()
  for (let i = lastMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toISOString().slice(0, 7)
    groups[key] = 0
  }
  for (const r of records) {
    const key = r.created_at.slice(0, 7)
    if (key in groups) groups[key]++
  }
  return Object.entries(groups).map(([month, count]) => ({ month, count }))
}

// ===================================================================
// getPlatformMetrics
// ===================================================================

export const getPlatformMetrics = unstable_cache(
  async (): Promise<PlatformMetrics> => {
    const admin = await createAdminClient()

    const [
      orgResult,
      subResult,
      activeSubResult,
      promoResult,
      revenueResult,
    ] = await Promise.all([
      admin.from('organizations').select('id, status, created_at').is('deleted_at', null),
      admin.from('subscriptions').select('status').eq('status', 'trial'),
      admin.from('subscriptions').select('plan_id').eq('status', 'active'),
      admin.from('promo_codes').select('id', { count: 'exact', head: true }).eq('is_active', true),
      admin.from('financial_events')
        .select('amount, occurred_at')
        .eq('event_type', 'payment_received')
        .gte('occurred_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ])

    const orgs = orgResult.data || []
    const totalOrgs = orgs.length
    const activeOrgs = orgs.filter(o => o.status === 'active').length
    const suspendedOrgs = orgs.filter(o => o.status === 'suspended').length
    const orgGrowth = groupByMonth(orgs)

    const trialOrgs = subResult.count ?? 0

    const activeSubIds = (activeSubResult.data || []).map(s => s.plan_id)
    const uniquePlanIds = [...new Set(activeSubIds)]

    let mrr = 0
    if (uniquePlanIds.length > 0) {
      const { data: plans } = await admin
        .from('plans')
        .select('id, price')
        .in('id', uniquePlanIds)

      const priceMap = new Map((plans || []).map(p => [p.id, p.price]))
      mrr = activeSubIds.reduce((sum, planId) => sum + (priceMap.get(planId) || 0), 0)
    }

    const monthlyRevenue = (revenueResult.data || []).reduce(
      (sum, e) => sum + e.amount, 0
    )

    const activePromoCodes = promoResult.count ?? 0

    let totalUsers = 0
    let activeUsers = 0
    let userGrowth: MonthlyPoint[] = []

    try {
      const { data: usersData } = await (admin.auth as any).admin.listUsers()
      const authUsers = usersData?.users || []
      totalUsers = authUsers.length
      const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000
      activeUsers = authUsers.filter((u: any) => {
        if (!u.last_sign_in_at) return false
        return new Date(u.last_sign_in_at).getTime() >= threshold
      }).length

      const now = new Date()
      const groups: Record<string, number> = {}
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        groups[d.toISOString().slice(0, 7)] = 0
      }
      for (const u of authUsers) {
        const key = u.created_at?.slice(0, 7)
        if (key && key in groups) groups[key]++
      }
      userGrowth = Object.entries(groups).map(([month, count]) => ({ month, count }))
    } catch {
    }

    return {
      totalOrganizations: totalOrgs,
      activeOrganizations: activeOrgs,
      suspendedOrganizations: suspendedOrgs,
      trialOrganizations: trialOrgs,
      activeSubscriptions: activeSubIds.length,
      totalUsers,
      activeUsers,
      mrr,
      arr: mrr * 12,
      monthlyRevenue,
      activePromoCodes,
      organizationGrowth: orgGrowth,
      userGrowth,
      revenueGrowth: [],
    }
  },
  ['platform-metrics'],
  { revalidate: 300, tags: ['platform-metrics'] }
)

// ===================================================================
// getPlatformUsers
// ===================================================================

export const getPlatformUsers = unstable_cache(
  async (): Promise<PlatformUser[]> => {
    const admin = await createAdminClient()

    let authUsers: any[] = []
    try {
      const { data: usersData } = await (admin.auth as any).admin.listUsers()
      authUsers = usersData?.users || []
    } catch {
      return []
    }

    const { data: members } = await admin
      .from('organization_members')
      .select('user_id, role, organization_id')

    const orgMap = new Map<string, { role: string; orgId: string }[]>()
    const userRoles = new Map<string, string>()
    const userOrgCount = new Map<string, number>()

    for (const m of members || []) {
      const list = orgMap.get(m.user_id) || []
      list.push({ role: m.role, orgId: m.organization_id })
      orgMap.set(m.user_id, list)
    }

    for (const [userId, entries] of orgMap) {
      userOrgCount.set(userId, entries.length)

      const owner = entries.find(e => e.role === 'owner')
      const admin_ = entries.find(e => e.role === 'admin')
      const staff = entries.find(e => e.role === 'staff')
      userRoles.set(userId, owner?.role || admin_?.role || staff?.role || 'empleado')
    }

    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name')

    const orgNameMap = new Map((orgs || []).map(o => [o.id, o.name]))

    return authUsers.map((u: any) => {
      const memberships = orgMap.get(u.id) || []
      const primaryOrgId = memberships[0]?.orgId

      return {
        id: u.id,
        email: u.email || '',
        organizationCount: userOrgCount.get(u.id) || 0,
        primaryRole: userRoles.get(u.id) || null,
        primaryOrgName: primaryOrgId ? orgNameMap.get(primaryOrgId) || null : null,
        lastSignInAt: u.last_sign_in_at || null,
        createdAt: u.created_at || '',
        isActive: !u.banned_until && !u.deleted_at,
      }
    })
  },
  ['platform-users'],
  { revalidate: 120, tags: ['platform-users'] }
)

// ===================================================================
// getOrganizationSummary
// ===================================================================

export const getOrganizationSummary = unstable_cache(
  async (): Promise<OrganizationSummary[]> => {
    const admin = await createAdminClient()

    const { data: orgs } = await admin
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        status,
        status_reason,
        created_at,
        subscriptions (
          status,
          trial_ends_at,
          plans (name)
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    const { data: members } = await admin
      .from('organization_members')
      .select('organization_id, user_id, role')

    const memberCountMap = new Map<string, number>()
    const ownerMap = new Map<string, string>()

    for (const m of members || []) {
      memberCountMap.set(m.organization_id, (memberCountMap.get(m.organization_id) || 0) + 1)
      if (m.role === 'owner' && !ownerMap.has(m.organization_id)) {
        ownerMap.set(m.organization_id, m.user_id)
      }
    }

    const { data: allProfiles } = await admin
      .from('user_profiles')
      .select('id, email')

    const userEmailMap = new Map<string, string>(
      (allProfiles || []).map(p => [p.id, p.email])
    )

    return (orgs || []).map(org => {
      const sub = (org.subscriptions as any)?.[0]
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        planName: sub?.plans?.name || null,
        subscriptionStatus: sub?.status || null,
        trialEndsAt: sub?.trial_ends_at || null,
        status: org.status || 'active',
        statusReason: org.status_reason || null,
        ownerEmail: userEmailMap.get(ownerMap.get(org.id) || '') || null,
        memberCount: memberCountMap.get(org.id) || 0,
        createdAt: org.created_at,
      }
    })
  },
  ['platform-organizations'],
  { revalidate: 300, tags: ['platform-organizations'] }
)

// ===================================================================
// getOrganizationById
// ===================================================================
const getOrganizationByIdCached = unstable_cache(
  async (id: string): Promise<OrganizationDetail | null> => {
    const admin = await createAdminClient()

    const { data: org, error: orgError } = await admin
      .from('organizations')
      .select(`
        id, name, slug, status, status_reason, created_at,
        subscriptions (
          status, trial_ends_at, current_period_end,
          cancel_at_period_end, canceled_at, stripe_customer_id,
          plans (name, price)
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (orgError || !org) return null

    const { data: members } = await admin
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', id)
      .order('role', { ascending: true })

    const memberUserIds = (members || []).map(m => m.user_id)
    const { data: profiles } = memberUserIds.length > 0
      ? await admin
          .from('user_profiles')
          .select('id, email')
          .in('id', memberUserIds)
      : { data: null }

    const emailMap = new Map<string, string>(
      (profiles || []).map(p => [p.id, p.email])
    )

    const sub = (org.subscriptions as any)?.[0]
    const owner = (members || []).find(m => m.role === 'owner')

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status as OrganizationStatus,
      statusReason: org.status_reason,
      createdAt: org.created_at,
      subscription: sub ? {
        planName: sub.plans?.name ?? null,
        planPrice: sub.plans?.price ?? null,
        status: sub.status ?? null,
        trialEndsAt: sub.trial_ends_at ?? null,
        currentPeriodEnd: sub.current_period_end ?? null,
        stripeCustomerId: sub.stripe_customer_id ?? null,
        cancelAtPeriodEnd: sub.cancel_at_period_end ?? null,
        canceledAt: sub.canceled_at ?? null,
      } : null,
      members: (members || []).map(m => ({
        userId: m.user_id,
        email: emailMap.get(m.user_id) || '—',
        role: m.role,
      })),
      memberCount: members?.length ?? 0,
      ownerEmail: owner ? emailMap.get(owner.user_id) ?? null : null,
    }
  },
  ['platform-organization'],
  { revalidate: 120, tags: ['platform-organizations'] }
)

export function getOrganizationById(id: string) {
  return getOrganizationByIdCached(id)
}

// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { serverEnv } from '@/lib/env/server'
import type { Database } from '@db/supabase'

const STRIPE_IDEMPOTENCY = new Map<string, number>()
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000
const IDEMPOTENCY_MAX_SIZE = 5000

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 })
  }

  const webhookSecret = serverEnv.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const eventId = event.id
  if (eventId) {
    const now = Date.now()
    const lastSeen = STRIPE_IDEMPOTENCY.get(eventId)
    if (lastSeen !== undefined && now - lastSeen < IDEMPOTENCY_TTL_MS) {
      return NextResponse.json({ received: true, deduplicated: true })
    }
    if (STRIPE_IDEMPOTENCY.size >= IDEMPOTENCY_MAX_SIZE) {
      for (const [id, ts] of STRIPE_IDEMPOTENCY) {
        if (now - ts >= IDEMPOTENCY_TTL_MS) STRIPE_IDEMPOTENCY.delete(id)
      }
      if (STRIPE_IDEMPOTENCY.size >= IDEMPOTENCY_MAX_SIZE) STRIPE_IDEMPOTENCY.clear()
    }
    STRIPE_IDEMPOTENCY.set(eventId, now)
  }

  const supabase = await createServiceRoleClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const organizationId = session.metadata?.organization_id
        const planId = session.metadata?.plan_id
        if (!organizationId || !planId) { console.error('Missing metadata'); break }

        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
        if (!subId) break

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'active', plan_id: planId, stripe_subscription_id: subId, trial_ends_at: null } satisfies Database['public']['Tables']['subscriptions']['Update'])
          .eq('organization_id', organizationId)
        if (error) throw error
        console.log('Checkout completed for org ' + organizationId)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const parentSub = invoice.parent?.subscription_details?.subscription
        if (!parentSub) break
        const subId = typeof parentSub === 'string' ? parentSub : parentSub.id

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subId)
          .single()
        if (!subscription) break

        const periodStart = new Date(invoice.period_start * 1000).toISOString()
        const periodEnd = new Date(invoice.period_end * 1000).toISOString()

        const { error: uErr } = await supabase
          .from('subscriptions')
          .update({ status: 'active', current_period_start: periodStart, current_period_end: periodEnd, cancel_at_period_end: false } satisfies Database['public']['Tables']['subscriptions']['Update'])
          .eq('organization_id', subscription.organization_id)
        if (uErr) throw uErr

        const { error: iErr } = await supabase
          .from('invoices')
          .insert({ organization_id: subscription.organization_id, stripe_invoice_id: invoice.id, invoice_number: invoice.number, subtotal_cents: invoice.subtotal, amount_cents: invoice.amount_paid, currency: invoice.currency, status: 'paid', period_start: periodStart, period_end: periodEnd, paid_at: new Date().toISOString(), invoice_pdf_url: invoice.invoice_pdf } satisfies Database['public']['Tables']['invoices']['Insert'])
        if (iErr) throw iErr

        console.log('Payment succeeded for ' + subId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const parentSub = invoice.parent?.subscription_details?.subscription
        if (!parentSub) break
        const subId = typeof parentSub === 'string' ? parentSub : parentSub.id

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subId)
          .single()
        if (!subscription) break

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'past_due' } satisfies Database['public']['Tables']['subscriptions']['Update'])
          .eq('organization_id', subscription.organization_id)
        if (error) throw error
        console.log('Payment failed for ' + subId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()
        if (!existingSub) break

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled', cancel_at_period_end: false, canceled_at: new Date().toISOString() } satisfies Database['public']['Tables']['subscriptions']['Update'])
          .eq('organization_id', existingSub.organization_id)
        if (error) throw error
        console.log('Subscription cancelled: ' + subscription.id)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()
        if (!existingSub) break

        const item = subscription.items.data[0]
        const updates: Database['public']['Tables']['subscriptions']['Update'] = { cancel_at_period_end: subscription.cancel_at_period_end }
        if (subscription.status === 'active' && item) {
          updates.status = 'active'
          updates.current_period_start = new Date(item.current_period_start * 1000).toISOString()
          updates.current_period_end = new Date(item.current_period_end * 1000).toISOString()
        }

        const { error } = await supabase.from('subscriptions').update(updates).eq('organization_id', existingSub.organization_id)
        if (error) throw error
        console.log('Subscription updated: ' + subscription.id)
        break
      }

      default:
        console.log('Unhandled event type: ' + event.type)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

import Stripe from 'stripe'
import { serverEnv } from '@/lib/env/server'

const getStripeSecretKey = () => {
  return serverEnv.STRIPE_SECRET_KEY
}

let stripeInstance: Stripe | null = null

export function getStripeInstance() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(getStripeSecretKey(), {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    })
  }
  return stripeInstance
}

export const stripe = {
  get webhooks() {
    return getStripeInstance().webhooks
  },
  get checkout() {
    return getStripeInstance().checkout
  },
  get customers() {
    return getStripeInstance().customers
  },
  get subscriptions() {
    return getStripeInstance().subscriptions
  },
  get billingPortal() {
    return getStripeInstance().billingPortal
  },
} as unknown as Stripe

export const STRIPE_PRICE_IDS = {
  basic: serverEnv.STRIPE_PRICE_BASIC_MONTHLY ?? null,
  professional: serverEnv.STRIPE_PRICE_PRO_MONTHLY ?? null,
} as const

export const STRIPE_WEBHOOK_SECRET = serverEnv.STRIPE_WEBHOOK_SECRET ?? ''

export const STRIPE_CUSTOMER_PORTAL_SETTINGS = {
  features: {
    invoice_history: { enabled: true },
    payment_methods: { enabled: true },
  },
} as const

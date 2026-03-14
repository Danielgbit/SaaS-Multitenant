import Stripe from 'stripe'

const getStripeSecretKey = () => {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return key
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
  basic: null,
  professional: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
} as const

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

export const STRIPE_CUSTOMER_PORTAL_SETTINGS = {
  features: {
    invoice_history: { enabled: true },
    payment_methods: { enabled: true },
  },
} as const

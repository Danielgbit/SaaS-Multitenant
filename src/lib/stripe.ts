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

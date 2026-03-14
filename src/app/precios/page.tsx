import { Metadata } from 'next'
import { getPlans } from '@/actions/billing/getPlans'
import { formatCurrency } from '@/lib/billing/utils'
import Link from 'next/link'
import { CheckCircle2, Calendar, Users, MessageSquare, BarChart3, Zap, HeadphonesIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Precios - Prügressy | Software de Citas para Profesionales',
  description: 'Planes desde 0€/mes. Software de gestión de citas para barberías, spas y profesionales. 30 días de prueba gratis.',
  keywords: 'software de citas, gestión de citas, agenda digital, programa para barberías, software spa, reserva de citas online',
  openGraph: {
    title: 'Planos Pricing - Prügressy | Software de Citas',
    description: 'Planes desde 0€/mes. Software de gestión de citas para profesionales.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://prugressy.com/precios',
  },
}

export default async function PricingPage() {
  const result = await getPlans()
  const plans = result.data || []

  const features = [
    { icon: Calendar, text: 'Calendario inteligente' },
    { icon: Users, text: 'Gestión de empleados' },
    { icon: MessageSquare, text: 'Recordatorios por WhatsApp' },
    { icon: BarChart3, text: 'Informes y analytics' },
    { icon: Zap, text: 'Reservas online 24/7' },
    { icon: HeadphonesIcon, text: 'Soporte prioritario' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF9' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#E8ECEE', backgroundColor: '#FFF' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-semibold" style={{ color: '#0F4C5C', fontFamily: 'Cormorant Garamond, serif' }}>
            Prügressy
          </Link>
          <nav className="flex items-center gap-6">
            <Link 
              href="/precios"
              className="text-sm font-medium"
              style={{ color: '#0F4C5C' }}
            >
              Precios
            </Link>
            <Link 
              href="/login"
              className="text-sm font-medium"
              style={{ color: '#5A6B70' }}
            >
              Iniciar sesión
            </Link>
            <Link 
              href="/register"
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#0F4C5C', color: '#FFF' }}
            >
              Empezar gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold mb-4" style={{ color: '#1A2B32', fontFamily: 'Cormorant Garamond, serif' }}>
          Planes para cada etapa de tu negocio
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: '#5A6B70' }}>
          Elige el plan que mejor se adapte a tus necesidades. 
          Todos incluyen 30 días de prueba gratis.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan: any) => {
            const isPopular = plan.name === 'Profesional'
            
            return (
              <div 
                key={plan.id}
                className={`relative bg-white rounded-2xl p-8 ${isPopular ? 'ring-2' : ''}`}
                style={{ 
                  border: `1px solid ${isPopular ? '#0F4C5C' : '#E8ECEE'}`,
                  boxShadow: isPopular ? '0 20px 40px rgba(15,76,92,0.15)' : '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: '#0F4C5C', color: '#FFF' }}>
                    Más popular
                  </div>
                )}

                <h3 className="text-xl font-semibold mb-2" style={{ color: '#1A2B32' }}>
                  {plan.name}
                </h3>
                
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold" style={{ color: '#1A2B32' }}>
                    {formatCurrency(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ color: '#5A6B70' }}>/mes</span>
                  )}
                </div>

                <p className="text-sm mb-6" style={{ color: '#5A6B70' }}>
                  {plan.description || 'Perfecto para profesionales independientes'}
                </p>

                <ul className="space-y-3 mb-8">
                  {(plan.features || []).map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#059669' }} />
                      <span style={{ color: '#1A2B32' }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/register?plan=${plan.id}`}
                  className="block w-full py-3 rounded-xl font-medium text-center transition-all"
                  style={{
                    backgroundColor: isPopular ? '#0F4C5C' : '#F8FAFB',
                    color: isPopular ? '#FFF' : '#0F4C5C',
                    border: isPopular ? 'none' : '1px solid #E8ECEE',
                  }}
                >
                  {plan.price === 0 ? 'Empezar gratis' : 'Comenzar prueba'}
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4" style={{ backgroundColor: '#FFF' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-12" style={{ color: '#1A2B32', fontFamily: 'Cormorant Garamond, serif' }}>
            Todo lo que necesitas para gestionar tu negocio
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#D1FAE5' }}>
                  <feature.icon className="w-5 h-5" style={{ color: '#059669' }} />
                </div>
                <div>
                  <h3 className="font-medium mb-1" style={{ color: '#1A2B32' }}>{feature.text}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Prügressy',
            description: 'Software de gestión de citas para profesionales',
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: '0',
              highPrice: '79.99',
              priceCurrency: 'EUR',
              offerCount: plans.length,
            },
          }),
        }}
      />

      {/* Footer */}
      <footer className="py-8 px-4 border-t" style={{ borderColor: '#E8ECEE' }}>
        <div className="max-w-6xl mx-auto text-center text-sm" style={{ color: '#5A6B70' }}>
          <p>© 2024 Prügressy. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

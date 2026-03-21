import { Metadata } from 'next'
import { getPlans } from '@/actions/billing/getPlans'
import { formatCurrency } from '@/lib/billing/utils'
import Link from 'next/link'
import { CheckCircle2, Calendar, Users, MessageSquare, BarChart3, Zap, HeadphonesIcon, Star, Shield, Sparkles, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Planes y Precios - Prügressy | Software de Citas para Profesionales Colombia',
  description: 'Planes desde $39.900 COP/mes. Software de gestión de citas para barberías, spas y profesionales en Colombia. 30 días de prueba gratis.',
  keywords: 'software de citas Colombia, gestión de citas, agenda digital, programa para barberías, software spa, reserva de citas online, precios saas',
  openGraph: {
    title: 'Planes y Precios - Prügressy | Software de Citas Colombia',
    description: 'Planes desde $39.900 COP/mes. Software de gestión de citas para profesionales.',
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
      <section className="py-16 md:py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-[#0F4C5C]/10 text-[#0F4C5C] mb-6">
            🇨🇴 Diseñado para negocios colombianos
          </span>
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-slate-800" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Planes para cada etapa de tu negocio
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Sin costos ocultos. WhatsApp incluido en todos los planes. 
            Prueba 30 días gratis.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan: any, index: number) => {
            const isPopular = plan.name === 'Profesional' || plan.name === 'Premium'
            const isBasic = plan.name === 'Básico'
            const currency = plan.currency || 'COP'
            
            return (
              <div 
                key={plan.id}
                className={`relative group animate-fade-in-up`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Popular Plan - Gradient Card */}
                {isPopular ? (
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#0F4C5C]/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0F4C5C] via-[#0C3E4A] to-[#0A2E38]" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                    
                    <div className="relative p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-amber-300" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                              <span className="text-xs text-amber-200">Más popular</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold text-white">
                            {formatCurrency(plan.price, currency)}
                          </span>
                          <span className="text-slate-300">/mes</span>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-8">
                        {plan.max_employees === -1 ? (
                          <li className="flex items-center gap-3 text-sm text-slate-200">
                            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span><strong>Empleados ilimitados</strong></span>
                          </li>
                        ) : (
                          <li className="flex items-center gap-3 text-sm text-slate-200">
                            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span><strong>{plan.max_employees} empleados</strong></span>
                          </li>
                        )}
                        {plan.max_services === -1 ? (
                          <li className="flex items-center gap-3 text-sm text-slate-200">
                            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span><strong>Servicios ilimitados</strong></span>
                          </li>
                        ) : (
                          <li className="flex items-center gap-3 text-sm text-slate-200">
                            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span><strong>{plan.max_services} servicios</strong></span>
                          </li>
                        )}
                        <li className="flex items-center gap-3 text-sm text-slate-200">
                          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span><strong>{plan.max_inventory_items === -1 ? 'Ilimitado' : plan.max_inventory_items} productos</strong> inventario</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-200">
                          <div className="w-5 h-5 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          </div>
                          <span><strong>WhatsApp Premium</strong> incluido</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-200">
                          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span><strong>Analytics completo</strong></span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-200">
                          <div className="w-5 h-5 rounded-lg bg-amber-500/30 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                          </div>
                          <span><strong>Soporte prioritario</strong></span>
                        </li>
                      </ul>

                      <Link
                        href={`/register?plan=${plan.id}`}
                        className="block w-full py-4 rounded-2xl font-medium text-center transition-all duration-200 bg-white text-[#0F4C5C] hover:bg-slate-100 shadow-lg shadow-white/25 flex items-center justify-center gap-2"
                      >
                        Comenzar prueba gratis
                        <ArrowRight className="w-5 h-5" />
                      </Link>

                      <p className="text-center text-xs text-slate-400 mt-4">
                        30 días de prueba · Sin tarjeta de crédito
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Basic Plan - Clean Card */
                  <div className="h-full rounded-3xl bg-white border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300">
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#0F4C5C]/10 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-[#0F4C5C]" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800">
                          {plan.name}
                        </h3>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold text-slate-800">
                            {formatCurrency(plan.price, currency)}
                          </span>
                          <span className="text-slate-500">/mes</span>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-8">
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span><strong>{plan.max_employees}</strong> empleados</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span><strong>{plan.max_services}</strong> servicios</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span><strong>{plan.max_inventory_items}</strong> productos inventario</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span><strong>WhatsApp Premium</strong> incluido</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                          <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span><strong>Analytics completo</strong></span>
                        </li>
                      </ul>

                      <Link
                        href={`/register?plan=${plan.id}`}
                        className="block w-full py-4 rounded-2xl font-medium text-center transition-all duration-200 bg-[#0F4C5C] text-white hover:bg-[#0C3E4A] flex items-center justify-center gap-2"
                      >
                        Comenzar prueba gratis
                        <ArrowRight className="w-5 h-5" />
                      </Link>

                      <p className="text-center text-xs text-slate-400 mt-4">
                        30 días de prueba · Sin tarjeta de crédito
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FFF' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-12 text-slate-800" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Todo lo que necesitas para gestionar tu negocio
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100">
                  <feature.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800">{feature.text}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-12 text-slate-800" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {[
              { q: '¿Necesito tarjeta de crédito para el trial?', a: 'No. Los 30 días de prueba son completamente gratuitos y sin compromiso.' },
              { q: '¿Puedo cambiar de plan después?', a: 'Sí. Puedes actualizar o downgradear tu plan en cualquier momento desde la configuración de tu cuenta.' },
              { q: '¿El WhatsApp está realmente incluido?', a: 'Sí, WhatsApp Premium con recordatorios automáticos está incluido en todos los planes.' },
              { q: '¿Qué pasa si paso los límites del plan?', a: 'Te notificaremos cuando alcances el 80% de uso. Puedes hacer upgrade en cualquier momento.' },
              { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí. Cancela cuando quieras y mantienes el acceso hasta el final del período pagado.' },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100">
                <h3 className="font-medium text-slate-800 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4" style={{ backgroundColor: '#0F4C5C' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Empieza tu prueba gratuita hoy
          </h2>
          <p className="text-slate-300 mb-8">
            Sin compromiso. Sin tarjeta de crédito. Configúralo en 5 minutos.
          </p>
          <Link 
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-medium bg-white text-[#0F4C5C] hover:bg-slate-100 transition-all"
          >
            Crear cuenta gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Prügressy',
            description: 'Software de gestión de citas para profesionales en Colombia',
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: '39900',
              highPrice: '79900',
              priceCurrency: 'COP',
              offerCount: plans.length,
            },
          }),
        }}
      />

      {/* Footer */}
      <footer className="py-8 px-4 border-t" style={{ borderColor: '#E8ECEE' }}>
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-500">
          <p>© 2024 Prügressy. Todos los derechos reservados.</p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}

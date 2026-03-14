import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY || '')

export function getResendInstance() {
  return resend
}

export const EMAIL_FROM = process.env.EMAIL_FROM || 'Prügressy <norespond@prugressy.com>'
export const CONTACT_EMAIL = 'contacto@focusidestudio.com'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    })
    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

export async function sendWhatsAppActivationRequestEmail({
  organizationName,
  contactName,
  businessPhone,
  planName,
}: {
  organizationName: string
  contactName: string
  businessPhone: string
  planName: string
}) {
  const html = `
    <h2>Nueva solicitud de activación de WhatsApp</h2>
    <p><strong>Organización:</strong> ${organizationName}</p>
    <p><strong>Plan:</strong> ${planName}</p>
    <p><strong>Persona de contacto:</strong> ${contactName}</p>
    <p><strong>Teléfono de negocio:</strong> ${businessPhone}</p>
    <p><strong>Fecha de solicitud:</strong> ${new Date().toLocaleString('es-ES')}</p>
  `

  return sendEmail({
    to: CONTACT_EMAIL,
    subject: 'Nueva solicitud de WhatsApp - Prügressy',
    html,
  })
}

export async function sendTrialExpiringEmail({
  to,
  organizationName,
  daysLeft,
}: {
  to: string
  organizationName: string
  daysLeft: number
}) {
  const html = `
    <h2>Tu trial de Prügressy está por terminar</h2>
    <p>Hola,</p>
    <p>Tu período de prueba de <strong>${organizationName}</strong> termina en <strong>${daysLeft} días</strong>.</p>
    <p>No pierdes tu acceso, pero después del trial necesitarás un plan activo para continuar usando todas las funcionalidades.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" style="background:#0F4C5C;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Actualizar plan</a></p>
    <p>¿Tienes preguntas? Responde a este email.</p>
    <p>Saludos,<br>Equipo Prügressy</p>
  `

  return sendEmail({
    to,
    subject: `Tu trial termina en ${daysLeft} días - Prügressy`,
    html,
  })
}

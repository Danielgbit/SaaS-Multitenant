export type EmailType = 
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'appointment_no_show'
  | 'employee_invitation'

interface EmailVariables {
  businessName: string
  clientName?: string
  serviceName?: string
  employeeName?: string
  date?: string
  time?: string
  duration?: string
  price?: string
  location?: string
  phone?: string
  invitationUrl?: string
  role?: string
}

const getEmailStyles = () => `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background-color: #f8fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-wrapper {
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #0F4C5C 0%, #1a6b7d 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .logo span {
      color: #5eead4;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #334155;
      margin-bottom: 24px;
    }
    .highlight-box {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      border-left: 4px solid #0F4C5C;
    }
    .highlight-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0F4C5C;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .highlight-value {
      font-size: 24px;
      font-weight: 700;
      color: #0F4C5C;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 24px 0;
    }
    .detail-item {
      background: #f8fafc;
      padding: 16px;
      border-radius: 10px;
    }
    .detail-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .detail-value {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #0F4C5C 0%, #1a6b7d 100%);
      color: #ffffff;
      padding: 14px 28px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 24px;
    }
    .footer {
      background: #f1f5f9;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 13px;
      color: #64748b;
    }
    .footer-link {
      color: #0F4C5C;
      text-decoration: none;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }
    .status-confirmed {
      background: #dcfce7;
      color: #16a34a;
    }
    .status-cancelled {
      background: #fee2e2;
      color: #dc2626;
    }
    .status-completed {
      background: #dbeafe;
      color: #2563eb;
    }
    .status-reminder {
      background: #fef3c7;
      color: #d97706;
    }
    @media (max-width: 600px) {
      .container {
        padding: 10px;
      }
      .content {
        padding: 24px 20px;
      }
      .details-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
`

export function getEmailTemplate(
  type: EmailType,
  variables: EmailVariables
): { subject: string; html: string } {
  const { businessName, clientName, serviceName, employeeName, date, time, duration, price, location, phone, invitationUrl, role } = variables

  const subjectMap: Record<EmailType, string> = {
    appointment_confirmation: `✅ Confirmación de tu cita en ${businessName}`,
    appointment_reminder: `⏰ Recordatorio: Tu cita en ${businessName} es mañana`,
    appointment_cancelled: `❌ Tu cita en ${businessName} ha sido cancelada`,
    appointment_completed: `¡Gracias por tu visita a ${businessName}!`,
    appointment_no_show: `Información sobre tu cita en ${businessName}`,
    employee_invitation: `Te han invitado a unirte a ${businessName}`,
  }

  const templates: Record<EmailType, string> = {
    appointment_confirmation: `
      <div class="email-wrapper">
        <div class="header">
          <div class="logo">Prügressy<span>.</span></div>
        </div>
        <div class="content">
          <p class="greeting">Hola <strong>${clientName}</strong>,</p>
          <p>Tu cita ha sido confirmada. Aquí tienes los detalles:</p>
          
          <div class="highlight-box">
            <div class="highlight-title">Servicio</div>
            <div class="highlight-value">${serviceName}</div>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Fecha</div>
              <div class="detail-value">${date}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Hora</div>
              <div class="detail-value">${time}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Duración</div>
              <div class="detail-value">${duration}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Profesional</div>
              <div class="detail-value">${employeeName}</div>
            </div>
            ${price ? `
            <div class="detail-item">
              <div class="detail-label">Precio</div>
              <div class="detail-value">${price}</div>
            </div>
            ` : ''}
          </div>
          
          ${location ? `<p style="margin-top: 16px; color: #64748b;">📍 ${location}</p>` : ''}
          ${phone ? `<p style="margin-top: 8px; color: #64748b;">📞 ${phone}</p>` : ''}
          
          <p style="margin-top: 24px; color: #64748b; font-size: 14px;">
            ¿Necesitas cambiar tu cita? Contáctanos con al menos 24 horas de anticipación.
          </p>
        </div>
        <div class="footer">
          <p class="footer-text">
            ¿Preguntas? <a href="mailto:contacto@focusidestudio.com" class="footer-link">Contáctanos</a>
          </p>
          <p class="footer-text" style="margin-top: 8px;">
            © ${new Date().getFullYear()} Prügressy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `,

    appointment_reminder: `
      <div class="email-wrapper">
        <div class="header">
          <div class="logo">Prügressy<span>.</span></div>
        </div>
        <div class="content">
          <p class="greeting">Hola <strong>${clientName}</strong>,</p>
          <p>Te recordamos que tienes una cita mañana:</p>
          
          <div class="highlight-box">
            <div class="highlight-title">Tu próxima cita</div>
            <div class="highlight-value">${serviceName}</div>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Fecha</div>
              <div class="detail-value">${date}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Hora</div>
              <div class="detail-value">${time}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Duración</div>
              <div class="detail-value">${duration}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Profesional</div>
              <div class="detail-value">${employeeName}</div>
            </div>
          </div>
          
          ${location ? `<p style="margin-top: 16px; color: #64748b;">📍 ${location}</p>` : ''}
          ${phone ? `<p style="margin-top: 8px; color: #64748b;">📞 ${phone}</p>` : ''}
          
          <p style="margin-top: 24px; color: #64748b; font-size: 14px;">
            Si necesitas cancelar o reprogramar, por favor háznoslo saber con anticipación.
          </p>
        </div>
        <div class="footer">
          <p class="footer-text">
            ¿Tienes alguna pregunta? <a href="mailto:contacto@focusidestudio.com" class="footer-link">Escríbenos</a>
          </p>
          <p class="footer-text" style="margin-top: 8px;">
            © ${new Date().getFullYear()} Prügressy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `,

    appointment_cancelled: `
      <div class="email-wrapper">
        <div class="header">
          <div class="logo">Prügressy<span>.</span></div>
        </div>
        <div class="content">
          <p class="greeting">Hola <strong>${clientName}</strong>,</p>
          <p>Tu cita ha sido cancelada. Aquí están los detalles:</p>
          
          <div class="highlight-box" style="background: #fef2f2; border-left-color: #dc2626;">
            <div class="highlight-title" style="color: #dc2626;">Cita cancelada</div>
            <div class="highlight-value" style="color: #dc2626;">${serviceName}</div>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Fecha</div>
              <div class="detail-value">${date}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Hora</div>
              <div class="detail-value">${time}</div>
            </div>
          </div>
          
          <p style="margin-top: 24px; color: #64748b; font-size: 14px;">
            Si deseas reprogramar, visita nuestra página de reservas o contáctanos.
          </p>
        </div>
        <div class="footer">
          <p class="footer-text">
            ¿Tienes alguna pregunta? <a href="mailto:contacto@focusidestudio.com" class="footer_link">Escríbenos</a>
          </p>
          <p class="footer-text" style="margin-top: 8px;">
            © ${new Date().getFullYear()} Prügressy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `,

    appointment_completed: `
      <div class="email-wrapper">
        <div class="header">
          <div class="logo">Prügressy<span>.</span></div>
        </div>
        <div class="content">
          <p class="greeting">Hola <strong>${clientName}</strong>,</p>
          <p>¡Gracias por visitarnos en <strong>${businessName}</strong>!</p>
          
          <div class="highlight-box" style="background: #f0fdf4; border-left-color: #16a34a;">
            <div class="highlight-title" style="color: #16a34a;">Servicio completado</div>
            <div class="highlight-value" style="color: #16a34a;">${serviceName}</div>
          </div>
          
          <p style="margin-top: 24px; color: #64748b; font-size: 14px;">
            Tu opinión nos importa. Si tienes un momento, nos encantaría conocer tu experiencia.
          </p>
        </div>
        <div class="footer">
          <p class="footer-text">
            ¡Te esperamos pronto! 🧘‍♀️
          </p>
          <p class="footer-text" style="margin-top: 8px;">
            © ${new Date().getFullYear()} Prügressy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `,

    appointment_no_show: `
      <div class="email-wrapper">
        <div class="header">
          <div class="logo">Prügressy<span>.</span></div>
        </div>
        <div class="content">
          <p class="greeting">Hola <strong>${clientName}</strong>,</p>
          <p>Notamos que no pudiste asistir a tu cita en <strong>${businessName}</strong>.</p>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Servicio</div>
              <div class="detail-value">${serviceName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Fecha</div>
              <div class="detail-value">${date}</div>
            </div>
          </div>
          
          <p style="margin-top: 24px; color: #64748b; font-size: 14px;">
            Si deseas reprogramar, estamos disponibles. Contáctanos para encontrar un nuevo horario.
          </p>
        </div>
        <div class="footer">
          <p class="footer-text">
            ¿Tienes alguna pregunta? <a href="mailto:contacto@focusidestudio.com" class="footer_link">Escríbenos</a>
          </p>
          <p class="footer-text" style="margin-top: 8px;">
            © ${new Date().getFullYear()} Prügressy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `,

    employee_invitation: `
      <div class="email-wrapper">
        <div class="header">
          <div class="logo">Prügressy<span>.</span></div>
        </div>
        <div class="content">
          <p class="greeting">Hola <strong>${employeeName}</strong>,</p>
          <p>Has sido invitado a unirte a <strong>${businessName}</strong> como <strong>${role}</strong>.</p>
          
          <div class="highlight-box">
            <div class="highlight-title">Tu nueva cuenta</div>
            <div class="highlight-value">${role === 'admin' ? 'Administrador' : 'Staff'}</div>
          </div>
          
          <p style="margin-top: 24px; color: #334155; font-size: 16px; text-align: center;">
            Para comenzar, acepta la invitación haciendo clic en el botón below.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${invitationUrl}" class="cta-button">
              Aceptar invitación
            </a>
          </div>
          
          <p style="margin-top: 24px; color: #64748b; font-size: 14px; text-align: center;">
            Este enlace expira en 7 días. Si no solicitaste esta invitación, puedes ignorar este correo.
          </p>
        </div>
        <div class="footer">
          <p class="footer-text">
            ¿Tienes alguna pregunta? <a href="mailto:soporte@prugressy.com" class="footer-link">Contáctanos</a>
          </p>
          <p class="footer-text" style="margin-top: 8px;">
            © ${new Date().getFullYear()} Prügressy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `,
  }

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${getEmailStyles()}
    </head>
    <body>
      <div class="container">
        ${templates[type]}
      </div>
    </body>
    </html>
  `

  return {
    subject: subjectMap[type],
    html,
  }
}

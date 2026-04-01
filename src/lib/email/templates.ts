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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f1f5f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .email-wrapper {
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 40px rgba(15, 76, 92, 0.12);
    }
    .header {
      background: linear-gradient(135deg, #0F4C5C 0%, #0a3d4a 50%, #062c38 100%);
      padding: 48px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(94, 234, 212, 0.1) 0%, transparent 50%);
      animation: pulse 4s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
    .header-content {
      position: relative;
      z-index: 1;
    }
    .logo {
      font-size: 32px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -1px;
      margin-bottom: 8px;
    }
    .logo-accent {
      color: #5eead4;
    }
    .header-subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 400;
    }
    .content {
      padding: 48px 40px;
    }
    .greeting {
      font-size: 20px;
      color: #0f172a;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .intro-text {
      font-size: 16px;
      color: #475569;
      margin-bottom: 32px;
      line-height: 1.7;
    }
    .highlight-box {
      background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
      border-radius: 16px;
      padding: 28px 32px;
      margin: 32px 0;
      border: 1px solid #99f6e4;
      position: relative;
    }
    .highlight-box::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #0F4C5C 0%, #5eead4 100%);
      border-radius: 4px 0 0 4px;
    }
    .highlight-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #0F4C5C;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .highlight-value {
      font-size: 28px;
      font-weight: 800;
      color: #0F4C5C;
      letter-spacing: -0.5px;
    }
    .role-badge {
      display: inline-block;
      background: linear-gradient(135deg, #0F4C5C 0%, #0a3d4a 100%);
      color: #ffffff;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 12px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 32px 0;
    }
    .detail-item {
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .detail-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .detail-value {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
    .cta-section {
      text-align: center;
      padding: 40px 0;
    }
    .cta-text {
      font-size: 16px;
      color: #475569;
      margin-bottom: 24px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #0F4C5C 0%, #0a3d4a 100%);
      color: #ffffff;
      padding: 18px 40px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 20px rgba(15, 76, 92, 0.4);
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #0a3d4a 0%, #062c38 100%);
      box-shadow: 0 6px 28px rgba(15, 76, 92, 0.5);
      transform: translateY(-2px);
    }
    .expiry-notice {
      margin-top: 28px;
      padding: 16px 20px;
      background: #fef3c7;
      border-radius: 10px;
      border-left: 4px solid #f59e0b;
    }
    .expiry-text {
      font-size: 13px;
      color: #92400e;
      font-weight: 500;
    }
    .footer {
      background: #f8fafc;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-brand {
      font-size: 16px;
      font-weight: 700;
      color: #0F4C5C;
      margin-bottom: 8px;
    }
    .footer-text {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .footer-link {
      color: #0F4C5C;
      text-decoration: none;
      font-weight: 500;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin: 24px 0;
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
    .warning-box {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
    }
    .success-box {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
    }
    @media (max-width: 600px) {
      .container {
        padding: 20px 16px;
      }
      .header {
        padding: 36px 24px;
      }
      .content {
        padding: 32px 24px;
      }
      .footer {
        padding: 24px;
      }
      .details-grid {
        grid-template-columns: 1fr;
      }
      .highlight-value {
        font-size: 24px;
      }
      .cta-button {
        padding: 16px 32px;
        font-size: 15px;
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
    appointment_confirmation: `Confirmacion de tu cita en ${businessName}`,
    appointment_reminder: `Recordatorio: Tu cita en ${businessName} es manana`,
    appointment_cancelled: `Tu cita en ${businessName} ha sido cancelada`,
    appointment_completed: `Gracias por tu visita a ${businessName}!`,
    appointment_no_show: `Informacion sobre tu cita en ${businessName}`,
    employee_invitation: `Te han invitado a unirte a ${businessName}`,
  }

  const templates: Record<EmailType, string> = {
    appointment_confirmation: `
      <div class="email-wrapper">
        <div class="header">
          <div class="header-content">
            <div class="logo">Prügressy<span class="logo-accent">.</span></div>
            <p class="header-subtitle">Confirmacion de cita</p>
          </div>
        </div>
        <div class="content">
          <p class="greeting">Hola ${clientName},</p>
          <p class="intro-text">Tu cita ha sido confirmada. A continuacion encontraras todos los detalles:</p>
          
          <div class="highlight-box">
            <div class="highlight-title">Servicio reservado</div>
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
              <div class="detail-label">Duracion</div>
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
          
          ${location ? `<p style="margin-top: 20px; color: #64748b; font-size: 14px;"><strong>Ubicacion:</strong> ${location}</p>` : ''}
          ${phone ? `<p style="margin-top: 8px; color: #64748b; font-size: 14px;"><strong>Telefono:</strong> ${phone}</p>` : ''}
          
          <div class="expiry-notice" style="margin-top: 24px; background: #f0fdfa; border-left-color: #10b981;">
            <p class="expiry-text" style="color: #065f46;">¿Necesitas cambiar tu cita? Contactanos con al menos 24 horas de anticipacion.</p>
          </div>
        </div>
        <div class="footer">
          <p class="footer-brand">Prügressy</p>
          <p class="footer-text">¿Preguntas?</p>
          <p class="footer-text">
            <a href="mailto:contacto@focusidestudio.com" class="footer-link">Contactanos</a>
          </p>
          <div class="divider"></div>
          <p class="footer-text">
            © ${new Date().getFullYear()} Prügressy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `,

    appointment_reminder: `
      <div class="email-wrapper">
        <div class="header">
          <div class="header-content">
            <div class="logo">Prügressy<span class="logo-accent">.</span></div>
            <p class="header-subtitle">Recordatorio de cita</p>
          </div>
        </div>
        <div class="content">
          <p class="greeting">Hola ${clientName},</p>
          <p class="intro-text">Te recordamos que tienes una cita pendiente para manana. Aqui estan los detalles:</p>
          
          <div class="highlight-box" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-color: #f59e0b;">
            <div class="highlight-title" style="color: #92400e;">Tu proxima cita</div>
            <div class="highlight-value" style="color: #92400e;">${serviceName}</div>
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
              <div class="detail-label">Duracion</div>
              <div class="detail-value">${duration}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Profesional</div>
              <div class="detail-value">${employeeName}</div>
            </div>
          </div>
          
          ${location ? `<p style="margin-top: 20px; color: #64748b; font-size: 14px;"><strong>Ubicacion:</strong> ${location}</p>` : ''}
          ${phone ? `<p style="margin-top: 8px; color: #64748b; font-size: 14px;"><strong>Telefono:</strong> ${phone}</p>` : ''}
          
          <div class="expiry-notice" style="margin-top: 24px; background: #fef3c7; border-left-color: #f59e0b;">
            <p class="expiry-text" style="color: #92400e;">Si necesitas cancelar o reprogramar, por favor avisanos con anticipacion.</p>
          </div>
        </div>
        <div class="footer">
          <p class="footer-brand">Prügressy</p>
          <p class="footer-text">¿Tienes alguna pregunta?</p>
          <p class="footer-text">
            <a href="mailto:contacto@focusidestudio.com" class="footer-link">Escríbenos</a>
          </p>
          <div class="divider"></div>
          <p class="footer-text">
            © ${new Date().getFullYear()} Prügressy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `,

    appointment_cancelled: `
      <div class="email-wrapper">
        <div class="header" style="background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);">
          <div class="header-content">
            <div class="logo">Prügressy<span class="logo-accent">.</span></div>
            <p class="header-subtitle">Cita cancelada</p>
          </div>
        </div>
        <div class="content">
          <p class="greeting">Hola ${clientName},</p>
          <p class="intro-text">Tu cita ha sido cancelada. Aqui estan los detalles:</p>
          
          <div class="highlight-box warning-box">
            <div class="highlight-title" style="color: #dc2626;">Servicio cancelado</div>
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
          
          <div class="expiry-notice" style="margin-top: 24px; background: #fef2f2; border-left-color: #dc2626;">
            <p class="expiry-text" style="color: #991b1b;">Si deseas reprogramar, visita nuestra pagina de reservas o contactanos.</p>
          </div>
        </div>
        <div class="footer">
          <p class="footer-brand">Prügressy</p>
          <p class="footer-text">¿Tienes alguna pregunta?</p>
          <p class="footer-text">
            <a href="mailto:contacto@focusidestudio.com" class="footer-link">Contactanos</a>
          </p>
          <div class="divider"></div>
          <p class="footer-text">
            © ${new Date().getFullYear()} Prügressy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `,

    appointment_completed: `
      <div class="email-wrapper">
        <div class="header" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">
          <div class="header-content">
            <div class="logo">Prügressy<span class="logo-accent">.</span></div>
            <p class="header-subtitle">Visita completada</p>
          </div>
        </div>
        <div class="content">
          <p class="greeting">Hola ${clientName},</p>
          <p class="intro-text">Gracias por visitarnos en <strong>${businessName}</strong>. Esperamos que hayas tenido una gran experiencia.</p>
          
          <div class="highlight-box success-box">
            <div class="highlight-title" style="color: #16a34a;">Servicio completado</div>
            <div class="highlight-value" style="color: #16a34a;">${serviceName}</div>
          </div>
          
          <div class="cta-section" style="padding: 24px 0;">
            <p class="cta-text">Tu opinion nos importa. Si tienes un momento, nos encantaria conocer tu experiencia con nosotros.</p>
          </div>
        </div>
        <div class="footer">
          <p class="footer-brand">Prügressy</p>
          <p class="footer-text">Te esperamos pronto!</p>
          <div class="divider"></div>
          <p class="footer-text">
            © ${new Date().getFullYear()} Prügressy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `,

    appointment_no_show: `
      <div class="email-wrapper">
        <div class="header" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
          <div class="header-content">
            <div class="logo">Prügressy<span class="logo-accent">.</span></div>
            <p class="header-subtitle">Informacion de cita</p>
          </div>
        </div>
        <div class="content">
          <p class="greeting">Hola ${clientName},</p>
          <p class="intro-text">Notamos que no pudiste asistir a tu cita en <strong>${businessName}</strong>. No te preocupes, estamos aqui para ayudarte.</p>
          
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
          
          <div class="expiry-notice" style="margin-top: 24px; background: #eef2ff; border-left-color: #6366f1;">
            <p class="expiry-text" style="color: #4338ca;">Si deseas reprogramar, estamos disponibles. Contactanos para encontrar un nuevo horario que te convenga.</p>
          </div>
        </div>
        <div class="footer">
          <p class="footer-brand">Prügressy</p>
          <p class="footer-text">¿Tienes alguna pregunta?</p>
          <p class="footer-text">
            <a href="mailto:contacto@focusidestudio.com" class="footer-link">Contactanos</a>
          </p>
          <div class="divider"></div>
          <p class="footer-text">
            © ${new Date().getFullYear()} Prügressy. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `,

    employee_invitation: `
      <div class="email-wrapper">
        <div class="header">
          <div class="header-content">
            <div class="logo">Prügressy<span class="logo-accent">.</span></div>
            <p class="header-subtitle">Invitacion al equipo</p>
          </div>
        </div>
        <div class="content">
          <p class="greeting">Hola ${employeeName},</p>
          <p class="intro-text">
            <strong>${businessName}</strong> te ha invitado a formar parte de su equipo en Prügressy. 
            Acepta esta invitacion para comenzar a gestionar tus servicios y clientes.
          </p>
          
          <div class="highlight-box">
            <div class="highlight-title">Tu rol en el equipo</div>
            <div class="highlight-value">${role === 'admin' ? 'Administrador' : 'Staff'}</div>
            <span class="role-badge">${role === 'admin' ? 'Acceso completo' : 'Acceso basico'}</span>
          </div>
          
          <div class="cta-section">
            <p class="cta-text">Haz clic en el boton de abajo para aceptar la invitacion y activar tu cuenta.</p>
            <a href="${invitationUrl}" class="cta-button">
              Aceptar invitacion
            </a>
          </div>
          
          <div class="expiry-notice">
            <p class="expiry-text">Este enlace expira en 7 dias. Si no solicitaste esta invitacion, puedes ignorar este correo electronico.</p>
          </div>
        </div>
        <div class="footer">
          <p class="footer-brand">Prügressy</p>
          <p class="footer-text">¿Tienes alguna pregunta?</p>
          <p class="footer-text">
            <a href="mailto:soporte@prugressy.com" class="footer-link">Contactanos</a>
          </p>
          <div class="divider"></div>
          <p class="footer-text">
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

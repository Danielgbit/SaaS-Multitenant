-- =========================================================================================
-- SEED: Default message templates for notification system
-- =========================================================================================
-- System-wide templates (organization_id = NULL) that all orgs can use as defaults
-- Templates have {{placeholders}} that get replaced at render time
-- Date: 13 Mayo 2026

INSERT INTO message_templates (organization_id, channel, type, name, subject, body, variables, is_default, is_active, version) VALUES

-- =========================================================================================
-- WHATSAPP TEMPLATES
-- =========================================================================================

(NULL, 'whatsapp', 'appointment_confirmation', 'Confirmación de cita', NULL,
'¡Hola {{clientName}}! Tu cita ha sido confirmada para el {{appointmentDate}} a las {{appointmentTime}}.

📍 {{businessName}}
💇 {{serviceName}}
👤 {{employeeName}}

Te esperamos. Si necesitas cancelar, usa este link: {{cancellationLink}}

¡Nos vemos pronto!',
'[
  {"name": "clientName", "description": "Nombre del cliente", "required": true, "example": "María García"},
  {"name": "appointmentDate", "description": "Fecha de la cita", "required": true, "example": "14 de mayo de 2026"},
  {"name": "appointmentTime", "description": "Hora de la cita", "required": true, "example": "2:00 PM"},
  {"name": "businessName", "description": "Nombre del negocio", "required": true, "example": "Spa Relax"},
  {"name": "serviceName", "description": "Nombre del servicio", "required": false, "example": "Masaje Relajante"},
  {"name": "employeeName", "description": "Nombre del empleado", "required": false, "example": "Carlos López"},
  {"name": "cancellationLink", "description": "Link para cancelar", "required": false}
]'::JSONB,
true, true, 1),

(NULL, 'whatsapp', 'appointment_reminder', 'Recordatorio de cita', NULL,
'¡Hola {{clientName}}! Te recordamos que tienes una cita mañana.

📅 {{appointmentDate}} a las {{appointmentTime}}
📍 {{businessName}}
💇 {{serviceName}}
👤 {{employeeName}}

¿Tienes alguna duda? Llámanos al {{businessPhone}}.

Confirma tu asistencia aquí: {{confirmationLink}}',
'[
  {"name": "clientName", "description": "Nombre del cliente", "required": true, "example": "María García"},
  {"name": "appointmentDate", "description": "Fecha de la cita", "required": true, "example": "14 de mayo de 2026"},
  {"name": "appointmentTime", "description": "Hora de la cita", "required": true, "example": "2:00 PM"},
  {"name": "businessName", "description": "Nombre del negocio", "required": true, "example": "Spa Relax"},
  {"name": "serviceName", "description": "Nombre del servicio", "required": false, "example": "Masaje Relajante"},
  {"name": "employeeName", "description": "Nombre del empleado", "required": false, "example": "Carlos López"},
  {"name": "businessPhone", "description": "Teléfono del negocio", "required": false, "example": "+57 300 123 4567"},
  {"name": "confirmationLink", "description": "Link para confirmar", "required": true}
]'::JSONB,
true, true, 1),

(NULL, 'whatsapp', 'appointment_cancelled', 'Cita cancelada', NULL,
'Hola {{clientName}}, tu cita del {{appointmentDate}} a las {{appointmentTime}} ha sido cancelada.

📍 {{businessName}}

¿Te gustaría reprogramar? Agenda aquí: {{rescheduleLink}}

¡Estamos para ayudarte!',
'[
  {"name": "clientName", "description": "Nombre del cliente", "required": true, "example": "María García"},
  {"name": "appointmentDate", "description": "Fecha de la cita", "required": true, "example": "14 de mayo de 2026"},
  {"name": "appointmentTime", "description": "Hora de la cita", "required": true, "example": "2:00 PM"},
  {"name": "businessName", "description": "Nombre del negocio", "required": true, "example": "Spa Relax"},
  {"name": "rescheduleLink", "description": "Link para reprogramar", "required": true}
]'::JSONB,
true, true, 1),

(NULL, 'whatsapp', 'appointment_completed', 'Cita completada', NULL,
'¡Gracias por tu visita, {{clientName}}! 🙏

Esperamos verte pronto en {{businessName}}.

Si fue tu primera vez, cuéntanos cómo fue tu experiencia. Siempre buscamos mejorar.

¡Hasta la próxima!',
'[
  {"name": "clientName", "description": "Nombre del cliente", "required": true, "example": "María García"},
  {"name": "businessName", "description": "Nombre del negocio", "required": true, "example": "Spa Relax"}
]'::JSONB,
true, true, 1),

(NULL, 'whatsapp', 'confirmation_request', 'Solicitud de confirmación', NULL,
'¡Hola {{clientName}}! 👋

Queremos confirmar tu cita del {{appointmentDate}} a las {{appointmentTime}} en {{businessName}}.

¿Confirmas tu asistencia?

👉 {{confirmationLink}}

Si no puedes asistir, por favor avísanos con anticipación para liberar tu espacio.',
'[
  {"name": "clientName", "description": "Nombre del cliente", "required": true, "example": "María García"},
  {"name": "appointmentDate", "description": "Fecha de la cita", "required": true, "example": "14 de mayo de 2026"},
  {"name": "appointmentTime", "description": "Hora de la cita", "required": true, "example": "2:00 PM"},
  {"name": "businessName", "description": "Nombre del negocio", "required": true, "example": "Spa Relax"},
  {"name": "confirmationLink", "description": "Link para confirmar", "required": true}
]'::JSONB,
true, true, 1),

(NULL, 'whatsapp', 'appointment_no_show', 'No asistencia', NULL,
'Hola {{clientName}}, lamentamos informarte que no asististe a tu cita del {{appointmentDate}} a las {{appointmentTime}} en {{businessName}}.

Si necesitas reprogramar, estamos aquí para ayudarte: {{rescheduleLink}}

¡Te esperamos pronto!',
'[
  {"name": "clientName", "description": "Nombre del cliente", "required": true, "example": "María García"},
  {"name": "appointmentDate", "description": "Fecha de la cita", "required": true, "example": "14 de mayo de 2026"},
  {"name": "appointmentTime", "description": "Hora de la cita", "required": true, "example": "2:00 PM"},
  {"name": "businessName", "description": "Nombre del negocio", "required": true, "example": "Spa Relax"},
  {"name": "rescheduleLink", "description": "Link para reprogramar", "required": false}
]'::JSONB,
true, true, 1),

-- =========================================================================================
-- EMAIL TEMPLATES
-- =========================================================================================

(NULL, 'email', 'appointment_confirmation', 'Confirmación de cita', '¡Tu cita ha sido confirmada! - {{businessName}}',
'<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #0F4C5C 0%, #1A6B7C 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✓ Confirmación de Cita</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 18px;">Hola <strong>{{clientName}}</strong>,</p>
    <p>Tu cita ha sido <strong>confirmada</strong> con éxito.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0F4C5C;">
      <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> {{appointmentDate}}</p>
      <p style="margin: 5px 0;"><strong>⏰ Hora:</strong> {{appointmentTime}}</p>
      <p style="margin: 5px 0;"><strong>📍 Servicio:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0;"><strong>👤 Profesional:</strong> {{employeeName}}</p>
      <p style="margin: 5px 0;"><strong>🏠 Negocio:</strong> {{businessName}}</p>
    </div>

    <p>Si necesitas cancelar o reprogramar, usa los botones abaixo:</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="{{confirmationLink}}" style="background: #0F4C5C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-right: 10px;">Confirmar</a>
      <a href="{{cancellationLink}}" style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Cancelar</a>
    </div>
    <p style="color: #666; font-size: 14px; margin-top: 20px;">{{businessName}} · {{businessAddress}}<br>{{businessPhone}}</p>
  </div>
</body>
</html>',
'[
  {"name": "clientName", "description": "Nombre del cliente", "required": true, "example": "María García"},
  {"name": "appointmentDate", "description": "Fecha de la cita", "required": true, "example": "14 de mayo de 2026"},
  {"name": "appointmentTime", "description": "Hora de la cita", "required": true, "example": "2:00 PM"},
  {"name": "businessName", "description": "Nombre del negocio", "required": true, "example": "Spa Relax"},
  {"name": "serviceName", "description": "Nombre del servicio", "required": false, "example": "Masaje Relajante"},
  {"name": "employeeName", "description": "Nombre del empleado", "required": false, "example": "Carlos López"},
  {"name": "businessAddress", "description": "Dirección del negocio", "required": false, "example": "Calle 123 #45-67, Bogotá"},
  {"name": "businessPhone", "description": "Teléfono del negocio", "required": false, "example": "+57 300 123 4567"},
  {"name": "confirmationLink", "description": "Link para confirmar", "required": true},
  {"name": "cancellationLink", "description": "Link para cancelar", "required": false}
]'::JSONB,
true, true, 1),

(NULL, 'email', 'appointment_reminder', 'Recordatorio de cita', 'Recordatorio: Tienes una cita mañana - {{businessName}}',
'<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #E67E22 0%, #F39C12 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Recordatorio de Cita</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 18px;">Hola <strong>{{clientName}}</strong>,</p>
    <p>Te recordamos que tienes una cita <strong>mañana</strong>.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F39C12;">
      <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> {{appointmentDate}}</p>
      <p style="margin: 5px 0;"><strong>⏰ Hora:</strong> {{appointmentTime}}</p>
      <p style="margin: 5px 0;"><strong>📍 Servicio:</strong> {{serviceName}}</p>
      <p style="margin: 5px 0;"><strong>👤 Profesional:</strong> {{employeeName}}</p>
      <p style="margin: 5px 0;"><strong>🏠 Negocio:</strong> {{businessName}}</p>
    </div>

    <p>¿Puedes confirmar tu asistencia?</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="{{confirmationLink}}" style="background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Sí, confirmo</a>
    </div>
    <p style="color: #666; font-size: 14px; margin-top: 20px;">{{businessName}} · {{businessAddress}}<br>{{businessPhone}}</p>
  </div>
</body>
</html>',
'[
  {"name": "clientName", "description": "Nombre del cliente", "required": true, "example": "María García"},
  {"name": "appointmentDate", "description": "Fecha de la cita", "required": true, "example": "14 de mayo de 2026"},
  {"name": "appointmentTime", "description": "Hora de la cita", "required": true, "example": "2:00 PM"},
  {"name": "businessName", "description": "Nombre del negocio", "required": true, "example": "Spa Relax"},
  {"name": "serviceName", "description": "Nombre del servicio", "required": false, "example": "Masaje Relajante"},
  {"name": "employeeName", "description": "Nombre del empleado", "required": false, "example": "Carlos López"},
  {"name": "businessAddress", "description": "Dirección del negocio", "required": false},
  {"name": "businessPhone", "description": "Teléfono del negocio", "required": false},
  {"name": "confirmationLink", "description": "Link para confirmar", "required": true}
]'::JSONB,
true, true, 1),

(NULL, 'email', 'appointment_cancelled', 'Cita cancelada', 'Tu cita ha sido cancelada - {{businessName}}',
'<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #C0392B 0%, #E74C3C 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✕ Cita Cancelada</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 18px;">Hola <strong>{{clientName}}</strong>,</p>
    <p>Lamentamos informarte que tu cita ha sido <strong>cancelada</strong>.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E74C3C;">
      <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> {{appointmentDate}}</p>
      <p style="margin: 5px 0;"><strong>⏰ Hora:</strong> {{appointmentTime}}</p>
      <p style="margin: 5px 0;"><strong>🏠 Negocio:</strong> {{businessName}}</p>
    </div>

    <p>¿Te gustaría reprogramar?</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="{{rescheduleLink}}" style="background: #0F4C5C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Reprogramar Cita</a>
    </div>
    <p style="color: #666; font-size: 14px; margin-top: 20px;">{{businessName}} · {{businessPhone}}</p>
  </div>
</body>
</html>',
'[
  {"name": "clientName", "description": "Nombre del cliente", "required": true, "example": "María García"},
  {"name": "appointmentDate", "description": "Fecha de la cita", "required": true, "example": "14 de mayo de 2026"},
  {"name": "appointmentTime", "description": "Hora de la cita", "required": true, "example": "2:00 PM"},
  {"name": "businessName", "description": "Nombre del negocio", "required": true, "example": "Spa Relax"},
  {"name": "businessPhone", "description": "Teléfono del negocio", "required": false},
  {"name": "rescheduleLink", "description": "Link para reprogramar", "required": true}
]'::JSONB,
true, true, 1),

(NULL, 'email', 'appointment_completed', 'Cita completada', '¡Gracias por tu visita! - {{businessName}}',
'<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #27AE60 0%, #2ECC71 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✓ ¡Cita Completada!</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 18px;">Hola <strong>{{clientName}}</strong>,</p>
    <p>¡Gracias por tu visita a <strong>{{businessName}}</strong>!</p>
    <p>Esperamos que hayas enjoyed tu experiencia con {{employeeName}}.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2ECC71;">
      <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> {{appointmentDate}}</p>
      <p style="margin: 5px 0;"><strong>💇 Servicio:</strong> {{serviceName}}</p>
    </div>

    <p style="color: #666; font-size: 14px; margin-top: 20px;">¡Te esperamos pronto!<br>{{businessName}} · {{businessPhone}}</p>
  </div>
</body>
</html>',
'[
  {"name": "clientName", "description": "Nombre del cliente", "required": true, "example": "María García"},
  {"name": "appointmentDate", "description": "Fecha de la cita", "required": true, "example": "14 de mayo de 2026"},
  {"name": "businessName", "description": "Nombre del negocio", "required": true, "example": "Spa Relax"},
  {"name": "serviceName", "description": "Nombre del servicio", "required": false, "example": "Masaje Relajante"},
  {"name": "employeeName", "description": "Nombre del empleado", "required": false, "example": "Carlos López"},
  {"name": "businessPhone", "description": "Teléfono del negocio", "required": false}
]'::JSONB,
true, true, 1),

(NULL, 'email', 'appointment_no_show', 'No asistencia registrada', 'No asististe a tu cita - {{businessName}}',
'<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #7F8C8D 0%, #95A5A6 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⚠ Cita No Completada</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 18px;">Hola <strong>{{clientName}}</strong>,</p>
    <p>Lamentamos informarte que no registraste asistencia a tu cita programada.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #95A5A6;">
      <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> {{appointmentDate}}</p>
      <p style="margin: 5px 0;"><strong>⏰ Hora:</strong> {{appointmentTime}}</p>
      <p style="margin: 5px 0;"><strong>🏠 Negocio:</strong> {{businessName}}</p>
    </div>

    <p>Si deseas reprogramar, estamos para ayudarte:</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="{{rescheduleLink}}" style="background: #0F4C5C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Agendar Nueva Cita</a>
    </div>
    <p style="color: #666; font-size: 14px; margin-top: 20px;">{{businessName}} · {{businessPhone}}</p>
  </div>
</body>
</html>',
'[
  {"name": "clientName", "description": "Nombre del cliente", "required": true, "example": "María García"},
  {"name": "appointmentDate", "description": "Fecha de la cita", "required": true, "example": "14 de mayo de 2026"},
  {"name": "appointmentTime", "description": "Hora de la cita", "required": true, "example": "2:00 PM"},
  {"name": "businessName", "description": "Nombre del negocio", "required": true, "example": "Spa Relax"},
  {"name": "businessPhone", "description": "Teléfono del negocio", "required": false},
  {"name": "rescheduleLink", "description": "Link para reprogramar", "required": false}
]'::JSONB,
true, true, 1)

ON CONFLICT DO NOTHING;

-- =========================================================================================
-- SEED: Default automation rules for new organizations
-- =========================================================================================

-- Note: automation_rules are created per-organization when org is created via trigger
-- This seeds the template association for the default rules
-- These will be created by the application when org is created

-- ROLLBACK:
-- DELETE FROM message_templates WHERE is_default = true AND organization_id IS NULL;
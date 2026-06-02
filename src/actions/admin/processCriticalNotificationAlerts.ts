import { sendEmail } from '@/lib/resend'
import { clientEnv } from '@/lib/env/client'
import { Database } from '@db/supabase'

type SupabaseClient = Awaited<ReturnType<typeof import('@/lib/supabase/service-role').createServiceRoleClient>>

function buildAlertEmailHtml(alert: { worker_name: string; code: string; message: string; created_at: string }) {
  const dashboardUrl = `${clientEnv?.NEXT_PUBLIC_APP_URL || ''}/admin/system/notifications`
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f8fafc">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <tr>
      <td style="background:#7f1d1d;padding:24px 32px;text-align:center">
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600">Alerta Crítica — Sistema de Notificaciones</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;border-bottom:1px solid #e2e8f0">Worker</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #e2e8f0;font-family:monospace">${alert.worker_name}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;border-bottom:1px solid #e2e8f0">Código</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #e2e8f0">${alert.code}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;border-bottom:1px solid #e2e8f0">Mensaje</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;text-align:right;border-bottom:1px solid #e2e8f0">${alert.message}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#64748b;font-size:14px;border-bottom:1px solid #e2e8f0">Detectado</td>
            <td style="padding:8px 0;color:#0f172a;font-size:14px;text-align:right;border-bottom:1px solid #e2e8f0">${new Date(alert.created_at).toLocaleString('es-ES')}</td>
          </tr>
        </table>
        <p style="margin:24px 0 0;text-align:center">
          <a href="${dashboardUrl}" style="display:inline-block;background:#0F4C5C;color:#ffffff;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:500;font-size:14px">Abrir Dashboard</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f1f5f9;padding:16px 32px;text-align:center;color:#94a3b8;font-size:12px">
        Este es un mensaje automático del sistema de monitoreo de Prügressy.
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function processCriticalNotificationAlerts(supabase: SupabaseClient) {
  const { data: alerts, error } = await supabase
    .from('notification_alert_events')
    .select('*')
    .eq('level', 'error')
    .is('resolved_at', null)
    .or('email_sent_at.is.null,in_app_sent_at.is.null')

  if (error) {
    console.error('[criticalAlerts] Query failed:', error.message)
    return
  }

  if (!alerts || alerts.length === 0) return

  // Fetch all admin emails once
  const { data: admins } = await supabase
    .from('organization_members')
    .select('user_id, organization_id, profiles!inner(email, full_name)')
    .in('role', ['owner', 'admin'])

  if (!admins || admins.length === 0) return

  // Deduplicate by user_id (an admin may belong to multiple orgs)
  const adminMap = new Map<string, { email: string; name: string; orgId: string }>()
  for (const a of admins) {
    const profile = (a as any).profiles
    if (!adminMap.has(a.user_id) && profile?.email) {
      adminMap.set(a.user_id, {
        email: profile.email,
        name: profile.full_name || profile.email,
        orgId: a.organization_id,
      })
    }
  }

  for (const alert of alerts) {
    let emailSentAt: string | null = null
    let inAppSentAt: string | null = null

    // Send email
    try {
      const subject = `[Alerta Crítica] ${alert.worker_name} — ${alert.code}`
      const html = buildAlertEmailHtml({
        worker_name: alert.worker_name,
        code: alert.code,
        message: alert.message,
        created_at: alert.created_at,
      })

      const results = await Promise.allSettled(
        [...adminMap.values()].map((admin) =>
          sendEmail({ to: admin.email, subject, html })
        )
      )

      const failures = results.filter((r) => r.status === 'rejected')
      if (failures.length > 0) {
        console.error(`[criticalAlerts] ${failures.length} email(s) failed for alert ${alert.id}`)
      }

      emailSentAt = new Date().toISOString()
    } catch (err) {
      console.error(`[criticalAlerts] Email send error for alert ${alert.id}:`, err)
    }

    // Create in-app notifications
    try {
      const notificationRows = [...adminMap.entries()].map(([userId, admin]) => ({
        organization_id: admin.orgId,
        user_id: userId,
        type: 'system_alert' as const,
        title: `Alerta crítica: ${alert.worker_name}`,
        message: alert.message,
        metadata: {
          alert_id: alert.id,
          worker_name: alert.worker_name,
          code: alert.code,
          level: 'error',
          link: '/admin/system/notifications',
        },
      }))

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notificationRows)

      if (notifError) {
        console.error(`[criticalAlerts] In-app insert error for alert ${alert.id}:`, notifError.message)
      } else {
        inAppSentAt = new Date().toISOString()
      }
    } catch (err) {
      console.error(`[criticalAlerts] In-app notification error for alert ${alert.id}:`, err)
    }

    // Update delivery timestamps granularly
    const updatePayload: Database['public']['Tables']['notification_alert_events']['Update'] = {}
    if (emailSentAt) updatePayload.email_sent_at = emailSentAt
    if (inAppSentAt) updatePayload.in_app_sent_at = inAppSentAt

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from('notification_alert_events')
        .update(updatePayload)
        .eq('id', alert.id)

      if (updateError) {
        console.error(`[criticalAlerts] Update error for alert ${alert.id}:`, updateError.message)
      }
    }
  }
}

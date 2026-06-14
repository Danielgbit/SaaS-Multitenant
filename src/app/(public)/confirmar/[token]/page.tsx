"use client";

/**
 * Public appointment confirmation page.
 *
 * This is a Client Component because the form needs local state for the
 * submit action. Data is fetched in useEffect on mount and re-validated
 * on token change.
 *
 * Defense in depth: token validation runs in BOTH this page and the server
 * route /api/confirmations/respond. Both implementations must use the same
 * canonical order: expired → used → invalidated.
 *
 * Scheduled for Server Component refactor in Fase 2A:
 * - Move data fetch to server action (uses service-role client)
 * - Render the page in RSC, ship only the 2 buttons as a client island
 * - Bundle size reduction: ~60-80% for this route
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useThemeColors } from "@/hooks/useThemeColors";
import { decideViewState } from "@/lib/appointments/confirmation-links/decideViewState";
import type { Database } from "@db/supabase";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Calendar,
  User,
  Scissors,
  Loader2,
} from "lucide-react";

export type AppointmentDetails = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "id" | "start_time" | "end_time" | "status" | "confirmation_status"
> & {
  organizations: { name: string } | null;
  appointment_services: Array<{
    service_id: string;
    services: Pick<
      Database["public"]["Tables"]["services"]["Row"],
      "name" | "duration"
    > | null;
  }> | null;
  employees: { name: string } | null;
  clients: { name: string; phone: string | null } | null;
};

/**
 * View states for the confirmation modal.
 *
 * - loading: initial, token being validated
 * - valid: form is shown, user can confirm or cancel
 * - invalid: token does not exist
 * - expired: token's 72h window has passed
 * - used: token was already used by a previous response
 * - success: user just confirmed
 * - cancelled: user cancelled or staff invalidated
 * - error: network or fetch failure (recoverable)
 *
 * Order: transient (loading) → form (valid) → terminal (success/cancelled/used/expired/invalid) → error
 */
type ViewState =
  | "loading"
  | "valid"
  | "invalid"
  | "expired"
  | "used"
  | "success"
  | "cancelled"
  | "error";

export default function ConfirmarPage() {
  const params = useParams();
  const token = params.token as string;
  const colors = useThemeColors();

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(
    null,
  );
  const [action, setAction] = useState<"confirm" | "cancel" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateAndFetch();
  }, [token]);

  async function validateAndFetch() {
    try {
      const supabase = createClient();

      const { data: tokenData, error: tokenError } = await supabase
        .from("confirmation_tokens")
        .select("*")
        .eq("token", token)
        .single();

      // Early state check using token data only (preserves perf: skips appointment query for terminal states)
      const earlyState = decideViewState(tokenData, null, tokenError);
      if (earlyState !== "valid") {
        setViewState(earlyState);
        return;
      }

      // Only fetch appointment if token is valid
      const { data: appt, error: apptError } = await supabase
        .from("appointments")
        .select(
          `
          id,
          start_time,
          end_time,
          status,
          confirmation_status,
          organizations!inner(name),
          employees!inner(name),
          clients!inner(name, phone),
          appointment_services!inner(
            service_id,
            services!inner(name, duration)
          )
        `,
        )
        .eq("id", tokenData!.appointment_id)
        .maybeSingle();

      const finalState = decideViewState(tokenData, appt, apptError);
      // TODO Fase 2A: replace with Zod parse once server action is in place
      if (finalState === "valid" && appt)
        setAppointment(appt as AppointmentDetails);
      setViewState(finalState);
    } catch (e) {
      console.error("[ConfirmarPage] Error:", e);
      setViewState("error");
    }
  }

  async function handleResponse(responseAction: "confirm" | "cancel") {
    setSubmitting(true);
    setAction(responseAction);

    try {
      const res = await fetch("/api/confirmations/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: responseAction }),
      });

      const data = await res.json();

      if (data.success) {
        setViewState(responseAction === "confirm" ? "success" : "cancelled");
      } else {
        setError(data.error || "Error al procesar la respuesta");
        setViewState("error");
      }
    } catch (e) {
      setError("Error de conexión");
      setViewState("error");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Bogota",
    });
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Bogota",
    });
  }

  const pageBg = { background: colors.primaryGradient };
  const cardStyle = {
    backgroundColor: colors.surface,
    boxShadow: colors.shadow.xl,
  };
  const subtleBg = { backgroundColor: colors.surfaceSubtle };

  if (viewState === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={pageBg}
      >
        <div className="text-center" style={{ color: colors.surface }}>
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
          <p>Verificando tu confirmación...</p>
        </div>
      </div>
    );
  }

  if (viewState === "invalid" || viewState === "error") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={pageBg}
      >
        <div
          className="rounded-2xl p-8 max-w-md w-full text-center"
          style={cardStyle}
        >
          <AlertCircle
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: colors.error }}
          />
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: colors.textPrimary }}
          >
            Enlace inválido
          </h1>
          <p style={{ color: colors.textSecondary }}>
            {viewState === "invalid"
              ? "Este enlace de confirmación no existe o ya no es válido."
              : error || "Ocurrió un error al procesar tu solicitud."}
          </p>
        </div>
      </div>
    );
  }

  if (viewState === "expired") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={pageBg}
      >
        <div
          className="rounded-2xl p-8 max-w-md w-full text-center"
          style={cardStyle}
        >
          <Clock
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: colors.warning }}
          />
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: colors.textPrimary }}
          >
            Enlace expirado
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Este enlace de confirmación ha expirado. Por favor contacta al
            negocio para reprogramar tu cita.
          </p>
        </div>
      </div>
    );
  }

  if (viewState === "used") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={pageBg}
      >
        <div
          className="rounded-2xl p-8 max-w-md w-full text-center"
          style={cardStyle}
        >
          <CheckCircle2
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: colors.success }}
          />
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: colors.textPrimary }}
          >
            Ya confirmado
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Ya confirmaste tu asistencia anteriormente. ¡Gracias!
          </p>
        </div>
      </div>
    );
  }

  if (viewState === "cancelled") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={pageBg}
      >
        <div
          className="rounded-2xl p-8 max-w-md w-full text-center"
          style={cardStyle}
        >
          <Ban
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: colors.error }}
          />
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: colors.textPrimary }}
          >
            Cita cancelada
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Esta cita ha sido cancelada. Si deseas reprogramar, por favor
            contacta al negocio.
          </p>
        </div>
      </div>
    );
  }

  if (viewState === "success") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: colors.success }}
      >
        <div
          className="rounded-2xl p-8 max-w-md w-full text-center"
          style={cardStyle}
        >
          <CheckCircle2
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: colors.success }}
          />
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: colors.textPrimary }}
          >
            ¡Confirmado!
          </h1>
          <p className="mb-4" style={{ color: colors.textSecondary }}>
            Tu asistencia ha sido confirmada. ¡Nos vemos pronto!
          </p>
          {appointment && (
            <div className="rounded-xl p-4 text-left" style={subtleBg}>
              <p className="font-medium" style={{ color: colors.primary }}>
                {appointment.organizations?.name}
              </p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {formatDate(appointment.start_time)} a las{" "}
                {formatTime(appointment.start_time)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="min-h-screen p-4" style={pageBg}>
      <div className="max-w-md mx-auto">
        <div
          className="rounded-2xl shadow-xl overflow-hidden"
          style={{ backgroundColor: colors.surface }}
        >
          <div
            className="p-6 text-center"
            style={{ background: colors.primaryGradient }}
          >
            <h1
              className="text-2xl font-bold"
              style={{ color: colors.surface }}
            >
              Confirmar Asistencia
            </h1>
            <p className="mt-1" style={{ color: colors.textOnPrimary }}>
              {appointment.organizations?.name}
            </p>
          </div>

          <div className="p-6">
            <div className="rounded-xl p-4 mb-6" style={subtleBg}>
              <h2
                className="font-semibold mb-3"
                style={{ color: colors.textPrimary }}
              >
                Detalles de tu cita
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: colors.textMuted }}
                  />
                  <span style={{ color: colors.textPrimary }}>
                    {formatDate(appointment.start_time)}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: colors.textMuted }}
                  />
                  <span style={{ color: colors.textPrimary }}>
                    {formatTime(appointment.start_time)}
                  </span>
                </div>
                {appointment.appointment_services &&
                  appointment.appointment_services.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Scissors
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: colors.textMuted }}
                      />
                      <span style={{ color: colors.textPrimary }}>
                        {appointment.appointment_services
                          .map((as) => as?.services?.name)
                          .filter((name): name is string => Boolean(name))
                          .join(" + ")}
                      </span>
                    </div>
                  )}
                {appointment.employees && (
                  <div className="flex items-start gap-2">
                    <User
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: colors.textMuted }}
                    />
                    <span style={{ color: colors.textPrimary }}>
                      {appointment.employees.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <p
              className="text-center mb-6"
              style={{ color: colors.textSecondary }}
            >
              Hola{" "}
              <span
                className="font-semibold"
                style={{ color: colors.textPrimary }}
              >
                {appointment.clients?.name}
              </span>
              , ¿puedes confirmar tu asistencia?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleResponse("confirm")}
                disabled={submitting}
                className="w-full py-4 px-6 font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  {
                    backgroundColor:
                      submitting && action === "confirm"
                        ? colors.success
                        : colors.success,
                    color: colors.surface,
                    "--tw-ring-color": colors.borderFocus,
                  } as React.CSSProperties
                }
              >
                {submitting && action === "confirm" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {submitting && action === "confirm"
                  ? "Confirmando..."
                  : "Sí, confirmo mi asistencia"}
              </button>

              <button
                onClick={() => handleResponse("cancel")}
                disabled={submitting}
                className="w-full py-4 px-6 font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  {
                    backgroundColor: colors.surface,
                    border: `2px solid ${colors.border}`,
                    color: colors.textSecondary,
                    "--tw-ring-color": colors.borderFocus,
                  } as React.CSSProperties
                }
              >
                {submitting && action === "cancel" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                {submitting && action === "cancel"
                  ? "Cancelando..."
                  : "No puedo asistir"}
              </button>
            </div>

            {error && (
              <p
                className="mt-4 text-sm text-center"
                style={{ color: colors.error }}
              >
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

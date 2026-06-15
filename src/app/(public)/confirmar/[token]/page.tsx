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
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  pageBg as createPageBg,
  subtleBg as createSubtleBg,
} from "@/lib/appointments/confirmation-links/styles";
import { validateConfirmationResponse } from "@/lib/appointments/confirmation-links/validateConfirmationResponse";
import {
  formatDate,
  formatTime,
} from "@/lib/appointments/confirmation-links/formatDateTime";
import { ViewStateRenderer } from "./ViewStateRenderer";
import type { AppointmentDetails } from "@/types/appointments";
import type { ViewState } from "@/lib/appointments/confirmation-links/decideViewState";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Scissors,
  Loader2,
} from "lucide-react";

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
      const { viewState: next, appointment: appt } =
        await validateConfirmationResponse(token);
      if (appt) setAppointment(appt);
      setViewState(next);
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

  const pageBg = createPageBg(colors);
  const subtleBg = createSubtleBg(colors);

  // Render non-form view states (loading, invalid, error, expired, used, cancelled, success)
  if (viewState !== "valid") {
    return (
      <ViewStateRenderer
        state={viewState}
        appointment={appointment}
        error={error}
      />
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

"use client";

import { useThemeColors } from "@/hooks/useThemeColors";
import type { ViewState } from "@/lib/appointments/confirmation-links/decideViewState";
import type { AppointmentDetails } from "@/types/appointments";
import { AlertCircle, Ban, CheckCircle2, Clock, Loader2 } from "lucide-react";

interface Props {
  state: ViewState;
  appointment: AppointmentDetails | null;
  error?: string | null;
}

/**
 * Renders the 7 non-form view states of the confirmation modal:
 * loading, invalid, error, expired, used, cancelled, success.
 *
 * The 'valid' state (form view) is rendered directly in page.tsx because
 * it needs access to local state (submitting, action, error) and event
 * handlers (onConfirm, onCancel).
 */
export function ViewStateRenderer({ state, appointment, error }: Props) {
  const colors = useThemeColors();

  const pageBg = { background: colors.primaryGradient };
  const cardStyle = {
    backgroundColor: colors.surface,
    boxShadow: colors.shadow.xl,
  };
  const subtleBg = { backgroundColor: colors.surfaceSubtle };

  if (state === "loading") {
    return <LoadingView colors={colors} pageBg={pageBg} />;
  }

  if (state === "invalid" || state === "error") {
    return (
      <ErrorView
        colors={colors}
        cardStyle={cardStyle}
        pageBg={pageBg}
        state={state}
        error={error ?? null}
      />
    );
  }

  if (state === "expired") {
    return (
      <ExpiredView colors={colors} cardStyle={cardStyle} pageBg={pageBg} />
    );
  }

  if (state === "used") {
    return <UsedView colors={colors} cardStyle={cardStyle} pageBg={pageBg} />;
  }

  if (state === "cancelled") {
    return (
      <CancelledView colors={colors} cardStyle={cardStyle} pageBg={pageBg} />
    );
  }

  if (state === "success") {
    return (
      <SuccessView
        colors={colors}
        cardStyle={cardStyle}
        subtleBg={subtleBg}
        appointment={appointment}
      />
    );
  }

  // 'valid' should not be rendered through this component; caller handles it.
  return null;
}

type ColorTokens = ReturnType<typeof useThemeColors>;

function LoadingView({
  colors,
  pageBg,
}: {
  colors: ColorTokens;
  pageBg: React.CSSProperties;
}) {
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

function ErrorView({
  colors,
  cardStyle,
  pageBg,
  state,
  error,
}: {
  colors: ColorTokens;
  cardStyle: React.CSSProperties;
  pageBg: React.CSSProperties;
  state: "invalid" | "error";
  error: string | null;
}) {
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
          {state === "invalid"
            ? "Este enlace de confirmación no existe o ya no es válido."
            : error || "Ocurrió un error al procesar tu solicitud."}
        </p>
      </div>
    </div>
  );
}

function ExpiredView({
  colors,
  cardStyle,
  pageBg,
}: {
  colors: ColorTokens;
  cardStyle: React.CSSProperties;
  pageBg: React.CSSProperties;
}) {
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
          Este enlace de confirmación ha expirado. Por favor contacta al negocio
          para reprogramar tu cita.
        </p>
      </div>
    </div>
  );
}

function UsedView({
  colors,
  cardStyle,
  pageBg,
}: {
  colors: ColorTokens;
  cardStyle: React.CSSProperties;
  pageBg: React.CSSProperties;
}) {
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

function CancelledView({
  colors,
  cardStyle,
  pageBg,
}: {
  colors: ColorTokens;
  cardStyle: React.CSSProperties;
  pageBg: React.CSSProperties;
}) {
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
          Esta cita ha sido cancelada. Si deseas reprogramar, por favor contacta
          al negocio.
        </p>
      </div>
    </div>
  );
}

function SuccessView({
  colors,
  cardStyle,
  subtleBg,
  appointment,
}: {
  colors: ColorTokens;
  cardStyle: React.CSSProperties;
  subtleBg: React.CSSProperties;
  appointment: AppointmentDetails | null;
}) {
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

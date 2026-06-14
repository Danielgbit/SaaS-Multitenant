"use server";

import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { decideViewState, type ViewState } from "./decideViewState";
import type { AppointmentDetails } from "@/types/appointments";

/**
 * Zod schema for the appointment data returned by the confirmation query.
 *
 * Note: !inner joins guarantee non-null for organizations/employees/clients,
 * but we keep .nullable() for defensive parsing (Supabase could change behavior).
 */
const AppointmentSchema = z.object({
  id: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  status: z.string(),
  confirmation_status: z.string(),
  organizations: z.object({ name: z.string() }).nullable(),
  appointment_services: z
    .array(
      z.object({
        service_id: z.string(),
            services: z
              .object({
                name: z.string(),
                duration: z.number(),
              })
              .nullable(),
      }),
    )
    .nullable(),
  employees: z.object({ name: z.string() }).nullable(),
  clients: z
    .object({ name: z.string(), phone: z.string().nullable() })
    .nullable(),
});

interface ValidationResult {
  viewState: ViewState;
  appointment: AppointmentDetails | null;
}

/**
 * Server action: validates a confirmation token and returns the view state
 * + appointment data (if valid).
 *
 * Uses service-role client to bypass RLS. The token itself is the authorization
 * (UUID v4 with 122 bits of entropy).
 *
 * Zod schema validates the Supabase response shape at runtime, closing the
 * type-safety hole of the previous `as AppointmentDetails` cast.
 */
export async function validateConfirmationResponse(
  token: string,
): Promise<ValidationResult> {
  const supabase = await createServiceRoleClient();

  const { data: tokenData, error: tokenError } = await supabase
    .from("confirmation_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    return {
      viewState: decideViewState(null, null, tokenError?.message ?? null),
      appointment: null,
    };
  }

  // Early state check (preserves perf: skip appointment query for terminal token states)
  const earlyState = decideViewState(tokenData, null, null);
  if (earlyState !== "valid") {
    return { viewState: earlyState, appointment: null };
  }

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
    .eq("id", tokenData.appointment_id)
    .maybeSingle();

  // Zod validation (catches schema drift, RLS nulls, unexpected fields)
  if (appt) {
    const parsed = AppointmentSchema.safeParse(appt);
    if (!parsed.success) {
      console.error(
        "[validateConfirmationResponse] Zod validation failed:",
        parsed.error,
      );
      return { viewState: "error", appointment: null };
    }
    const finalState = decideViewState(tokenData, parsed.data, null);
    return {
      viewState: finalState,
      appointment: finalState === "valid" ? parsed.data : null,
    };
  }

  const finalState = decideViewState(
    tokenData,
    null,
    apptError?.message ?? null,
  );
  return { viewState: finalState, appointment: null };
}

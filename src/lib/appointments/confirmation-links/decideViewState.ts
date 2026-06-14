import type { Database } from "@db/supabase";

type TokenRow = Pick<
  Database["public"]["Tables"]["confirmation_tokens"]["Row"],
  "used_at" | "invalidated_at" | "expires_at"
>;

type AppointmentRow = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "status"
>;

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
 */
export type ViewState =
  | "loading"
  | "valid"
  | "invalid"
  | "expired"
  | "used"
  | "success"
  | "cancelled"
  | "error";

/**
 * Pure function: derives the view state from token + appointment data.
 *
 * Canonical ordering: expired → used → invalidated → cancelled-by-appointment.
 * Must match tokens.ts:62-76 (server-side validation).
 *
 * @param token - confirmation_tokens row (or null if not found)
 * @param appointment - appointments row (or null if not yet fetched / fetch failed)
 * @param fetchError - non-null if any query failed (string message or Error)
 */
export function decideViewState(
  token: TokenRow | null,
  appointment: AppointmentRow | null,
  fetchError: string | Error | null,
): ViewState {
  if (fetchError != null) return "error";
  if (!token) return "invalid";

  const now = Date.now();
  const expiresAt = new Date(token.expires_at).getTime();

  if (now > expiresAt) return "expired";
  if (token.used_at) return "used";
  if (token.invalidated_at) return "cancelled";
  if (appointment?.status === "cancelled") return "cancelled";
  if (!appointment) return "error";

  return "valid";
}

import type { Database } from "@db/supabase";

/**
 * Shape returned by the confirmation page's appointment query.
 *
 * Built from Pick<> over Database['public']['Tables']['appointments']['Row']
 * to avoid the AGENTS.md prohibition on hand-rolled interface duplicates.
 *
 * The nested relations are also Pick<>-ed, not duplicated.
 */
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

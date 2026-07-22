import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

interface LogParams {
  supabase: SupabaseClient;
  orgId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Writes an append-only audit entry. Called from every server action that
 * touches a sensitive record (expense decisions, bill approvals, role
 * changes, invites). Failures are logged but never block the primary
 * action — an audit-log outage shouldn't take down the product.
 */
export async function logAuditEvent({
  supabase,
  orgId,
  actorId,
  action,
  entityType,
  entityId,
  metadata = {},
}: LogParams) {
  const { error } = await supabase.from("audit_logs").insert({
    org_id: orgId,
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata,
  });

  if (error) {
    console.error("audit log write failed", error);
  }
}

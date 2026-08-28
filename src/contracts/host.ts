/**
 * The host adapter contract.
 *
 * Everything the shared Workspace needs from the application it is mounted in,
 * and nothing more. Motion Mind supplies one implementation over its router and
 * auth; Campus supplies another over its own. The shared code never imports
 * either host's router, auth hook, or Supabase singleton — which is what makes
 * one implementation serve both.
 *
 * `supabase` is INJECTED rather than imported. The two hosts construct their
 * clients differently (one hard-codes its URL and key, the other reads
 * environment variables and supports the newer key format), and a package that
 * reached for a module-level singleton would bind itself to one of them.
 */

/** Which application is presenting Workspace. Presentation and telemetry only. */
export type WorkspaceHostId = "motion_mind" | "campus";

/** The signed-in member, as the host already knows them. */
export interface WorkspaceAccount {
  userId: string | null;
  loading: boolean;
  firstName?: string;
}

/**
 * What a host provides. Deliberately small: identity, navigation, and the
 * authenticated data client.
 *
 * `supabase` is typed as `unknown` here because contracts carries no
 * dependencies at all — the client area narrows it to a real SupabaseClient.
 */
export interface WorkspaceHost {
  hostId: WorkspaceHostId;
  supabase: unknown;
  account: WorkspaceAccount;
  navigate: (to: string) => void;
  /** Where this host serves a Workspace area. Both hosts answer identically. */
  workspaceHref: (area?: string) => string;
  /** Where a canonical editor should return the member to, when applicable. */
  returnTo?: { href: string; label: string };
}

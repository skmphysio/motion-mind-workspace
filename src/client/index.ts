/**
 * The Workspace data client — framework-independent by construction.
 *
 * NOTHING HERE MAY IMPORT REACT, a React Query binding, a router, or a
 * module-level Supabase singleton. `scripts/check-boundaries.mjs` enforces that
 * in CI, and the rule is negative-tested so it fails when violated rather than
 * merely existing.
 *
 * The reason is not tidiness. The two hosts construct their Supabase clients
 * differently — Motion Mind hard-codes its URL and key, Campus reads
 * environment variables and supports the newer opaque key format — so a package
 * that imported a singleton would bind itself to one host and stop being
 * shared code. Injection is what keeps one implementation serving both.
 */
import { buildContentPreview } from "../contracts/index.js";

/**
 * The narrow slice of a Supabase client this package uses. Structural, so a
 * real `SupabaseClient` from either host satisfies it without this package
 * taking a dependency on the SDK.
 */
export interface WorkspaceDatabase {
  from: (table: string) => unknown;
  rpc: (fn: string, args?: Record<string, unknown>) => unknown;
}

export interface WorkspaceClientOptions {
  /** The host's own authenticated client. Never constructed here. */
  database: WorkspaceDatabase;
}

export interface WorkspaceClient {
  /**
   * The canonical note preview rule, applied through the client so every write
   * path in both hosts derives `content_preview` identically. Campus and Motion
   * Mind previously each had their own copy and the two disagreed past the cap.
   */
  notePreview: (text: string | null | undefined) => string;
  /** The injected database, for operations added in later releases. */
  readonly database: WorkspaceDatabase;
}

export function createWorkspaceClient(options: WorkspaceClientOptions): WorkspaceClient {
  const { database } = options;
  return {
    database,
    notePreview: (text) => buildContentPreview(text),
  };
}

/**
 * The Workspace companion — the floating Mentor and Notebook panel.
 *
 * RELEASE 1 SHIPS THIS AREA'S CONTRACT, NOT ITS IMPLEMENTATION. The panel,
 * launcher, transcript, composer, history and context picker are extracted from
 * Motion Mind in Release 2, behind these types. Declaring the boundary now is
 * what lets Release 1 verify the subpath, the export map and the type
 * resolution, so Release 2 changes code rather than packaging.
 *
 * The types below are real and load-bearing: a host can already write its
 * adapter against them, and the shape is what the extraction must satisfy.
 */
import type { PersonalWorkspaceSurfaceContext, WorkspaceHost } from "../contracts/index.js";

/** How much of the companion is showing. */
export type CompanionPresence = "closed" | "standard" | "expanded" | "minimized";

/** Which tool the member is looking at. Independent of presence and of split. */
export type CompanionMode = "mentor" | "notebook";

export interface CompanionMountProps {
  host: WorkspaceHost;
  /**
   * The surface the member is standing in, registered by the host screen.
   * Identifiers and display hints only — the gateway re-reads every referenced
   * record under the caller's own JWT, so nothing here can widen access.
   */
  surface: PersonalWorkspaceSurfaceContext | null;
}

/**
 * Where a host mounts the companion: exactly once, at its application boundary.
 * More than one mount would mean two conversation states over one account.
 */
export const COMPANION_MOUNT_RULE =
  "Mount the Workspace companion exactly once per application, at the app boundary." as const;

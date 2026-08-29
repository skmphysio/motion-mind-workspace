/**
 * Full-page Workspace surfaces — Home, My Learning, Notebook, Growth Book,
 * Profile, Account.
 *
 * RELEASE 1 SHIPS THIS AREA'S CONTRACT, NOT ITS IMPLEMENTATION. The pages are
 * extracted in Releases 3 and 4. This subpath exists now so the export map,
 * type resolution and — the property that actually mattered — LAZY LOADING are
 * verified before any page depends on them.
 *
 * This area is designed to be imported lazily:
 *
 *     const Workspace = lazy(() => import('@motionmindpkg/workspace/surfaces'));
 *
 * Verified in Release 1: a consumer that eagerly imports `contracts` and
 * `companion` and lazily imports this area keeps this area's code out of the
 * entry chunk entirely. That is what makes one package safe — heavy editors and
 * document tooling stay behind a dynamic import instead of inflating first load.
 */
import type { WorkspaceArea, WorkspaceHost } from "../contracts/index.js";

export interface WorkspaceSurfaceProps {
  host: WorkspaceHost;
  area: WorkspaceArea;
}

/**
 * Areas whose implementation is heavy enough that a host must load them
 * lazily: rich text editing, document rendering and file viewers live here.
 */
export const LAZY_REQUIRED_AREAS: readonly WorkspaceArea[] = ["notebook", "growth"] as const;

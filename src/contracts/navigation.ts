/**
 * The Workspace route model — one vocabulary, both hosts.
 *
 * The product is Workspace. Motion Mind serves it at motionmind.pro/workspace and
 * Campus at campus.motionmind.pro/workspace, with matching child paths, so a
 * member moving between the two never has to relearn where anything lives.
 *
 * Paths are built HERE rather than written into screens, so neither host
 * hand-assembles the other's URLs — which is what lets a redirect, a checkout
 * return, or a "continue in Notebook" link resolve correctly in whichever host
 * the member is standing in.
 *
 * Internal names are deliberately NOT part of this vocabulary. Database tables,
 * RPCs, storage buckets and existing source directories keep names containing
 * "dashboard"; renaming stable objects would add migration risk without
 * changing anything a member sees.
 */

/** The Workspace destinations, in navigation order. */
export const WORKSPACE_AREAS = [
  "home",
  "learning",
  "notebook",
  "growth",
  "profile",
  "account",
] as const;

export type WorkspaceArea = (typeof WORKSPACE_AREAS)[number];

/** The route prefix. Identical in both hosts — that is the point. */
export const WORKSPACE_PREFIX = "/workspace";

/** Member-facing labels. The word "Dashboard" appears nowhere. */
export const WORKSPACE_AREA_LABEL: Record<WorkspaceArea, string> = {
  home: "Workspace",
  learning: "My Learning",
  notebook: "Notebook",
  growth: "Growth Book",
  profile: "Profile",
  account: "Account",
};

/** The canonical path for a Workspace area, in either host. */
export function workspacePath(area: WorkspaceArea = "home"): string {
  return area === "home" ? WORKSPACE_PREFIX : `${WORKSPACE_PREFIX}/${area}`;
}

/**
 * The `/dashboard` compatibility map.
 *
 * Old links must keep working, so every retired prefix resolves to its
 * Workspace equivalent. Longest match wins, and the remainder of the path plus
 * any query and fragment are preserved — a bookmark deep inside the Notebook
 * lands exactly where it used to.
 */
const LEGACY_PREFIXES: { from: string; to: WorkspaceArea }[] = [
  { from: "/dashboard/learning", to: "learning" },
  { from: "/dashboard/notebook", to: "notebook" },
  { from: "/dashboard/growth", to: "growth" },
  { from: "/dashboard/profile", to: "profile" },
  { from: "/dashboard/account", to: "account" },
  { from: "/dashboard", to: "home" },
];

/**
 * Resolve a legacy `/dashboard…` URL to its Workspace equivalent, or null when
 * the path is not a legacy Workspace path (so a caller never redirects a route
 * that merely starts with similar text).
 */
export function resolveLegacyWorkspacePath(pathname: string): string | null {
  const match = LEGACY_PREFIXES.find(
    (entry) => pathname === entry.from || pathname.startsWith(`${entry.from}/`),
  );
  if (!match) return null;
  const remainder = pathname.slice(match.from.length);
  return `${workspacePath(match.to)}${remainder}`;
}

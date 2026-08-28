/**
 * React bindings for the Workspace client.
 *
 * This is the ONLY area below the companion that may touch React. Hooks live
 * here rather than in `client` so the data layer stays usable — and testable —
 * without a renderer, and so a host that wants only the data operations is not
 * forced to take a React dependency.
 */
import { createContext, createElement, useContext, useMemo, type ReactNode } from "react";
import { createWorkspaceClient, type WorkspaceClient, type WorkspaceDatabase } from "../client/index.js";
import type { WorkspaceHost } from "../contracts/index.js";

interface WorkspaceContextValue {
  client: WorkspaceClient;
  host: WorkspaceHost;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export interface WorkspaceProviderProps {
  host: WorkspaceHost;
  children: ReactNode;
}

/**
 * Mounts the shared Workspace against one host. The client is memoised on the
 * host's database identity, so a host re-render never rebuilds it.
 */
export function WorkspaceProvider(props: WorkspaceProviderProps) {
  const { host, children } = props;
  const value = useMemo<WorkspaceContextValue>(
    () => ({
      host,
      client: createWorkspaceClient({ database: host.supabase as WorkspaceDatabase }),
    }),
    [host],
  );
  return createElement(WorkspaceContext.Provider, { value }, children);
}

/** Null outside the provider, so a component can render in isolation in tests. */
export function useWorkspace(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext);
}

export function useWorkspaceClient(): WorkspaceClient | null {
  return useContext(WorkspaceContext)?.client ?? null;
}

export function useWorkspaceHost(): WorkspaceHost | null {
  return useContext(WorkspaceContext)?.host ?? null;
}

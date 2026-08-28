# @motionmind/workspace-contracts

Framework-independent contracts for the Motion Mind **personal Workspace** — the individual's
persistent layer across Motion Mind and Motion Mind Campus.

Zero runtime dependencies. No React, no Supabase, no router. Compiles under both consuming
applications' TypeScript configurations, including Campus's `strict` +
`exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`.

## What is here

- `PersonalWorkspaceSurfaceContext` — what a host screen registers
- `AiChatContext` — the wire context the ai-gateway accepts
- `toAiChatContext` — the mapping between them
- `conversationKey` — conversation identity
- `buildContentPreview` — the single note-preview rule for the ecosystem
- Shared vocabulary mirroring database CHECK constraints and edge-function allowlists

## Status

`0.0.0-alpha.0` is a **release-pipeline rehearsal**. It is deliberately not consumed by any
application. The complete Layer 1 surface lands in `0.1.0`.

## Rules

The client supplies identifiers and display hints only. Content is never sent on the wire; the
gateway re-reads every referenced record under the caller's own JWT, so authorisation is decided by
RLS server-side. Nothing in this package can widen access.

No Supabase URL or key is ever compiled into this package. The authenticated client is always
injected by the host.

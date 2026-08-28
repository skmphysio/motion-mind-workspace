/**
 * The context contracts of the personal Workspace.
 *
 * TWO TYPES, DELIBERATELY SEPARATE.
 *
 * `PersonalWorkspaceSurfaceContext` is what a HOST SCREEN registers: where the
 * member is standing, in the vocabulary of the product. `AiChatContext` is the
 * WIRE type the ai-gateway already accepts. Keeping them apart means a screen
 * never has to know the gateway's field names, and the gateway's contract can
 * gain a field without every screen learning about it.
 *
 * Everything either type carries is an IDENTIFIER or a DISPLAY HINT. Content is
 * never sent. The gateway re-reads every referenced record under the caller's
 * own JWT, so authorisation is decided by RLS server-side and nothing the
 * client asserts can widen it.
 */

// WorkspaceHostId has ONE definition, in ./host.ts, imported here.
import type { WorkspaceHostId } from "./host.js";

/** What kind of place the member is standing in. */
export type WorkspaceSurfaceKind =
  | "perspective"
  | "explorer"
  | "campus_course"
  | "notebook"
  | "growth_book"
  | "workspace";

/**
 * The wire context accepted by the ai-gateway.
 *
 * This is the union of what both frontends previously sent separately. The two
 * campus fields were already parsed server-side (`scope.ts`) but had no place
 * in the canonical client type, so no canonical surface could express Campus
 * context. They are declared here for the first time.
 *
 * The explicit-attachment fields (`notebook_note_ids`, `growth_context`,
 * `attachment_ids`, `library_item_ids`) are NEVER populated automatically.
 * Having a record open is not attaching it.
 */
export interface AiChatContext {
  topic_id?: string;
  section_id?: string;
  slide_id?: string;
  /** Conversation resource scope: both present, or neither. */
  resource_type?: "explorer_topic" | "perspective_article" | "author_library_project";
  resource_id?: string;
  confirmed_question?: string;
  external_consent?: boolean;
  notebook_note_ids?: string[];
  growth_context?: { kind: string; id: string }[];
  attachment_ids?: string[];
  library_item_ids?: string[];
  author_evidence_consent?: boolean;
  /** Campus surface scope. Hints, never grants — the gateway re-checks membership. */
  campus_institution_id?: string;
  campus_offering_id?: string;
}

/**
 * What a host screen registers with the Workspace companion.
 *
 * `contextLabel` is for the MEMBER — it names the context visibly so they can
 * see what the Mentor has been told. It is never sent as content.
 */
export interface PersonalWorkspaceSurfaceContext {
  host: WorkspaceHostId;
  surface: WorkspaceSurfaceKind;
  contextLabel: string;
  /** An existing gateway assistant key. Surfaces never invent routes. */
  assistant: string;
  contentId?: string;
  chapterId?: string;
  institutionId?: string;
  offeringId?: string;
}

/**
 * Surface context → wire context.
 *
 * Every field is added by conditional spread rather than assigned as possibly
 * `undefined`. That is what makes this clean under `exactOptionalPropertyTypes`
 * — and it also means an absent identifier contributes no key at all, so the
 * gateway sees "no scope" rather than "scope: undefined".
 */
export function toAiChatContext(surface: PersonalWorkspaceSurfaceContext): AiChatContext {
  switch (surface.surface) {
    case "explorer":
      return {
        ...(surface.contentId ? { topic_id: surface.contentId } : {}),
        ...(surface.chapterId ? { section_id: surface.chapterId } : {}),
      };
    case "perspective":
      // The pair is both-or-neither, matching the database CHECK.
      return surface.contentId
        ? { resource_type: "perspective_article", resource_id: surface.contentId }
        : {};
    case "campus_course":
      return {
        ...(surface.institutionId ? { campus_institution_id: surface.institutionId } : {}),
        ...(surface.offeringId ? { campus_offering_id: surface.offeringId } : {}),
      };
    case "notebook":
    case "growth_book":
    case "workspace":
      // Deliberately empty: the personal workspaces supply no automatic
      // content context. What the Mentor sees from them is attached by the
      // member, explicitly, and travels in the attachment fields instead.
      return {};
  }
}

/**
 * A stable key for the active conversation.
 *
 * It changes when the assistant route or the meaningful subject changes, so a
 * new subject starts a new thread rather than silently continuing the last one.
 * Moving between pages of the same subject keeps the thread.
 */
export function conversationKey(surface: PersonalWorkspaceSurfaceContext | null): string {
  if (!surface) return "none";
  const subject = surface.contentId ?? surface.offeringId ?? surface.institutionId ?? "";
  return `${surface.assistant}::${subject}`;
}

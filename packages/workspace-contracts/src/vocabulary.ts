/**
 * Shared vocabulary mirroring database CHECK constraints and edge-function
 * allowlists. These are CLIENT MIRRORS of server rules, never the rule itself:
 * the server decides, and a mirror that drifts fails loudly in test rather
 * than quietly widening anything.
 */

/** `knowledge_items.item_type` values that are uploaded documents, not notes. */
export const DOCUMENT_TYPES = ["pdf", "doc", "presentation", "image", "text_file"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** `knowledge_items.item_type` values produced by the Mentor. */
export const AI_TYPES = ["ai_response", "ai_conversation"] as const;

/** The canonical plain-text note type (schema CHECK). */
export const QUICK_NOTE_TYPE = "quick_note";

/** Where an explicitly attached record came from. */
export type MentorContextSource = "notebook" | "growth" | "file";

/** The specific record type. Mirrors the edge loaders' allowlists. */
export type MentorContextKind = "note" | "goal" | "entry" | "reflection" | "record" | "file";

/**
 * Per-source attachment caps, mirroring the caps the edge functions enforce.
 * The client cap is a courtesy so the member is told before they send; the
 * server cap is the one that actually holds, and neither depends on the other.
 */
export const MENTOR_CONTEXT_CAPS: Record<MentorContextSource, number> = {
  notebook: 3,
  growth: 4,
  file: 3,
};

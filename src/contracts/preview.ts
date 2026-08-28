/**
 * THE note-preview rule — one implementation for the whole ecosystem.
 *
 * Campus and Motion Mind each had their own copy, and Campus's comment claimed
 * they matched. They did not: over the cap, Motion Mind truncated at 279 and
 * appended an ellipsis while Campus sliced a bare 280, so the same note
 * previewed differently depending on where it was written. Both wrote to the
 * same `knowledge_items.content_preview` column.
 *
 * This is the Motion Mind behaviour, which is the one already in the data.
 */
export const PREVIEW_MAX_CHARS = 280;

export function buildContentPreview(text: string | null | undefined): string {
  const collapsed = (text ?? "").replace(/\s+/g, " ").trim();
  return collapsed.length > PREVIEW_MAX_CHARS
    ? collapsed.slice(0, PREVIEW_MAX_CHARS - 1).trimEnd() + "…"
    : collapsed;
}

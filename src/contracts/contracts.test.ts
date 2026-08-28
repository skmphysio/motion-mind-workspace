import { describe, expect, it } from "vitest";
import {
  buildContentPreview,
  conversationKey,
  DOCUMENT_TYPES,
  MENTOR_CONTEXT_CAPS,
  PREVIEW_MAX_CHARS,
  toAiChatContext,
  type PersonalWorkspaceSurfaceContext,
} from "./index.js";

const base = { host: "motion_mind", contextLabel: "x", assistant: "personal_mentor" } as const;
const s = (o: Partial<PersonalWorkspaceSurfaceContext>): PersonalWorkspaceSurfaceContext =>
  ({ ...base, surface: "workspace", ...o }) as PersonalWorkspaceSurfaceContext;

describe("buildContentPreview — the rule that used to differ per host", () => {
  it("matches the Motion Mind behaviour already in the data", () => {
    const out = buildContentPreview("x".repeat(500));
    expect(out).toHaveLength(PREVIEW_MAX_CHARS);
    expect(out.endsWith("…")).toBe(true);
    // The Campus implementation produced a bare 280-char slice with no ellipsis.
    expect(out).not.toBe("x".repeat(PREVIEW_MAX_CHARS));
  });

  it("leaves anything within the cap untouched", () => {
    expect(buildContentPreview("hello world")).toBe("hello world");
    expect(buildContentPreview("x".repeat(PREVIEW_MAX_CHARS))).toHaveLength(PREVIEW_MAX_CHARS);
    expect(buildContentPreview("x".repeat(PREVIEW_MAX_CHARS))).not.toContain("…");
  });

  it("collapses whitespace and trims", () => {
    expect(buildContentPreview("  a\n\nb\tc  ")).toBe("a b c");
  });

  it("is null-safe", () => {
    expect(buildContentPreview(null)).toBe("");
    expect(buildContentPreview(undefined)).toBe("");
  });

  it("does not leave a dangling space before the ellipsis", () => {
    expect(buildContentPreview("a ".repeat(400)).endsWith(" …")).toBe(false);
  });
});

describe("toAiChatContext", () => {
  it("expresses Campus context — which no canonical client could do before", () => {
    expect(
      toAiChatContext(s({ surface: "campus_course", institutionId: "i1", offeringId: "o1" })),
    ).toEqual({ campus_institution_id: "i1", campus_offering_id: "o1" });
  });

  it("maps Explorer topic and chapter", () => {
    expect(toAiChatContext(s({ surface: "explorer", contentId: "t1", chapterId: "c1" }))).toEqual({
      topic_id: "t1",
      section_id: "c1",
    });
  });

  it("keeps the Perspective resource pair both-or-neither", () => {
    expect(toAiChatContext(s({ surface: "perspective", contentId: "a1" }))).toEqual({
      resource_type: "perspective_article",
      resource_id: "a1",
    });
    expect(toAiChatContext(s({ surface: "perspective" }))).toEqual({});
  });

  it("sends no automatic content context from the personal workspaces", () => {
    expect(toAiChatContext(s({ surface: "notebook" }))).toEqual({});
    expect(toAiChatContext(s({ surface: "growth_book" }))).toEqual({});
    expect(toAiChatContext(s({ surface: "workspace" }))).toEqual({});
  });

  it("omits absent identifiers entirely rather than sending undefined", () => {
    const out = toAiChatContext(s({ surface: "explorer", contentId: "t1" }));
    expect(Object.prototype.hasOwnProperty.call(out, "section_id")).toBe(false);
  });
});

describe("conversationKey", () => {
  it("changes with the subject, so a new subject starts a new thread", () => {
    const a = conversationKey(s({ surface: "explorer", assistant: "explorer_mentor", contentId: "t1" }));
    const b = conversationKey(s({ surface: "explorer", assistant: "explorer_mentor", contentId: "t2" }));
    expect(a).not.toBe(b);
  });

  it("is stable across pages of the same subject", () => {
    const one = s({ surface: "campus_course", assistant: "campus_mentor", institutionId: "i1", offeringId: "o1" });
    expect(conversationKey(one)).toBe(conversationKey({ ...one, contextLabel: "another page" }));
  });

  it("handles no surface", () => {
    expect(conversationKey(null)).toBe("none");
  });
});

describe("vocabulary mirrors", () => {
  it("pins the document types the context picker filters on", () => {
    expect([...DOCUMENT_TYPES]).toEqual(["pdf", "doc", "presentation", "image", "text_file"]);
  });
  it("pins the per-source attachment caps the edge functions enforce", () => {
    expect(MENTOR_CONTEXT_CAPS).toEqual({ notebook: 3, growth: 4, file: 3 });
  });
});

export type {
  AiChatContext,
  PersonalWorkspaceSurfaceContext,
  WorkspaceHostId,
  WorkspaceSurfaceKind,
} from "./context.js";
export { conversationKey, toAiChatContext } from "./context.js";

export { PREVIEW_MAX_CHARS, buildContentPreview } from "./preview.js";

export type { DocumentType, MentorContextKind, MentorContextSource } from "./vocabulary.js";
export {
  AI_TYPES,
  DOCUMENT_TYPES,
  MENTOR_CONTEXT_CAPS,
  QUICK_NOTE_TYPE,
} from "./vocabulary.js";

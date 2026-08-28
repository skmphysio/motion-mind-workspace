export type {
  AiChatContext,
  PersonalWorkspaceSurfaceContext,
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

export type { WorkspaceArea } from "./navigation.js";
export {
  WORKSPACE_AREA_LABEL,
  WORKSPACE_AREAS,
  WORKSPACE_PREFIX,
  resolveLegacyWorkspacePath,
  workspacePath,
} from "./navigation.js";

export type { WorkspaceAccount, WorkspaceHost, WorkspaceHostId } from "./host.js";

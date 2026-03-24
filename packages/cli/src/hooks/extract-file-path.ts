/**
 * Extracts the edited file path from AI tool hook JSON payloads.
 *
 * Supports:
 * - Claude Code / Factory AI / Copilot  — tool_input.file_path
 * - Gemini CLI                           — arguments.file_path (write_* / edit_* tools only)
 * - Cursor                               — filePath (camelCase top-level)
 * - Windsurf                             — file_path (top-level, no tool_input wrapper)
 * - Cline                                — file (top-level)
 */
export function extractFilePath(input: unknown): string | null {
  if (typeof input !== 'object' || input === null) return null;
  const obj = input as Record<string, unknown>;

  // Claude Code / Factory AI / Copilot — tool_input.file_path
  const toolInput = obj['tool_input'];
  if (typeof toolInput === 'object' && toolInput !== null) {
    const filePath = (toolInput as Record<string, unknown>)['file_path'];
    if (typeof filePath === 'string') return filePath;
  }

  // Gemini CLI — arguments.file_path (only for write_*/edit_* tools)
  const toolName = obj['tool_name'];
  if (typeof toolName === 'string' && /^write_|^edit_/.test(toolName)) {
    const args = obj['arguments'];
    if (typeof args === 'object' && args !== null) {
      const filePath = (args as Record<string, unknown>)['file_path'];
      if (typeof filePath === 'string') return filePath;
    }
  }

  // Cursor — filePath (camelCase)
  if (typeof obj['filePath'] === 'string') return obj['filePath'];

  // Windsurf — file_path (top-level, only when no tool_input wrapper)
  if (typeof obj['file_path'] === 'string' && !toolInput) return obj['file_path'];

  // Cline — file
  if (typeof obj['file'] === 'string') return obj['file'];

  return null;
}

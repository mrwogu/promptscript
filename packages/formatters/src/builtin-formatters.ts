/**
 * Exhaustive mapping of built-in targets to their formatter classes.
 *
 * This map is the single source of truth for formatter registration.
 * Adding a new built-in target requires:
 * 1. One entry in `TARGET_DEFINITIONS` (packages/core/src/target-catalog.ts)
 * 2. One entry in `BUILTIN_FORMATTERS` (this file)
 *
 * TypeScript enforces exhaustiveness via `satisfies Record<KnownTarget, FormatterClass>`,
 * so the compiler fails when a known target lacks a formatter.
 *
 * @module builtin-formatters
 */

import type { KnownTarget } from '@promptscript/core';
import type { FormatterClass } from './types.js';

// Original 7
import { GitHubFormatter } from './formatters/github.js';
import { ClaudeFormatter } from './formatters/claude.js';
import { CursorFormatter } from './formatters/cursor.js';
import { AntigravityFormatter } from './formatters/antigravity.js';
import { FactoryFormatter } from './formatters/factory.js';
import { OpenCodeFormatter } from './formatters/opencode.js';
import { GeminiFormatter } from './formatters/gemini.js';
// Tier 1
import { WindsurfFormatter } from './formatters/windsurf.js';
import { ClineFormatter } from './formatters/cline.js';
import { RooFormatter } from './formatters/roo.js';
import { CodexFormatter } from './formatters/codex.js';
import { ContinueFormatter } from './formatters/continue.js';
// Tier 2
import { AugmentFormatter } from './formatters/augment.js';
import { GooseFormatter } from './formatters/goose.js';
import { KiloFormatter } from './formatters/kilo.js';
import { AmpFormatter } from './formatters/amp.js';
import { TraeFormatter } from './formatters/trae.js';
import { JunieFormatter } from './formatters/junie.js';
import { KiroFormatter } from './formatters/kiro.js';
// Tier 3
import { CortexFormatter } from './formatters/cortex.js';
import { CrushFormatter } from './formatters/crush.js';
import { CommandCodeFormatter } from './formatters/command-code.js';
import { KodeFormatter } from './formatters/kode.js';
import { McpjamFormatter } from './formatters/mcpjam.js';
import { MistralVibeFormatter } from './formatters/mistral-vibe.js';
import { MuxFormatter } from './formatters/mux.js';
import { OpenHandsFormatter } from './formatters/openhands.js';
import { PiFormatter } from './formatters/pi.js';
import { QoderFormatter } from './formatters/qoder.js';
import { QwenCodeFormatter } from './formatters/qwen-code.js';
import { ZencoderFormatter } from './formatters/zencoder.js';
import { NeovateFormatter } from './formatters/neovate.js';
import { PochiFormatter } from './formatters/pochi.js';
import { AdalFormatter } from './formatters/adal.js';
import { IflowFormatter } from './formatters/iflow.js';
import { OpenClawFormatter } from './formatters/openclaw.js';
import { CodeBuddyFormatter } from './formatters/codebuddy.js';
// AGENTS.md-only targets
import { AiderFormatter } from './formatters/aider.js';
import { AmazonQFormatter } from './formatters/amazon-q.js';
import { WarpFormatter } from './formatters/warp.js';
import { ZedFormatter } from './formatters/zed.js';
import { JulesFormatter } from './formatters/jules.js';
import { DevinFormatter } from './formatters/devin.js';
// Grok Build
import { GrokFormatter } from './formatters/grok.js';
import { KimiFormatter } from './formatters/kimi.js';
import { MimoFormatter } from './formatters/mimo.js';
import { DeepAgentsFormatter } from './formatters/deep-agents.js';
import { ForgecodeFormatter } from './formatters/forgecode.js';

/**
 * Exhaustive map of built-in target names to their formatter classes.
 * `satisfies Record<KnownTarget, FormatterClass>` ensures every known
 * target has a formatter.
 */
export const BUILTIN_FORMATTERS = {
  // Original 7
  github: GitHubFormatter,
  claude: ClaudeFormatter,
  cursor: CursorFormatter,
  antigravity: AntigravityFormatter,
  factory: FactoryFormatter,
  opencode: OpenCodeFormatter,
  gemini: GeminiFormatter,
  // Tier 1
  windsurf: WindsurfFormatter,
  cline: ClineFormatter,
  roo: RooFormatter,
  codex: CodexFormatter,
  continue: ContinueFormatter,
  // Tier 2
  augment: AugmentFormatter,
  goose: GooseFormatter,
  kilo: KiloFormatter,
  amp: AmpFormatter,
  trae: TraeFormatter,
  junie: JunieFormatter,
  kiro: KiroFormatter,
  // Tier 3
  cortex: CortexFormatter,
  crush: CrushFormatter,
  'command-code': CommandCodeFormatter,
  kode: KodeFormatter,
  mcpjam: McpjamFormatter,
  'mistral-vibe': MistralVibeFormatter,
  mux: MuxFormatter,
  openhands: OpenHandsFormatter,
  pi: PiFormatter,
  qoder: QoderFormatter,
  'qwen-code': QwenCodeFormatter,
  zencoder: ZencoderFormatter,
  neovate: NeovateFormatter,
  pochi: PochiFormatter,
  adal: AdalFormatter,
  iflow: IflowFormatter,
  openclaw: OpenClawFormatter,
  codebuddy: CodeBuddyFormatter,
  // AGENTS.md-only targets
  aider: AiderFormatter,
  'amazon-q': AmazonQFormatter,
  warp: WarpFormatter,
  zed: ZedFormatter,
  jules: JulesFormatter,
  devin: DevinFormatter,
  grok: GrokFormatter,
  // Priority B CLI agents
  kimi: KimiFormatter,
  mimo: MimoFormatter,
  'deep-agents': DeepAgentsFormatter,
  forgecode: ForgecodeFormatter,
} as const satisfies Record<KnownTarget, FormatterClass>;

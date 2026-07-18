import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';

/** Valid reasoningEffort values (union of Factory and Codex accepted values). */
const VALID_REASONING_EFFORT = new Set(['low', 'medium', 'high']);

/** Valid sandboxMode values (fixture-confirmed from Codex agent TOML). */
const VALID_SANDBOX_MODE = new Set(['read-only', 'workspace-write', 'danger-full-access']);

/**
 * PS033: Valid agent configuration fields.
 *
 * Validates portable and target-specific agent properties in the @agents
 * block. Checks:
 * - `reasoningEffort` values against the fixture-confirmed enum
 * - `sandboxMode` values against Codex fixture-confirmed values
 * - `nicknameCandidates` as a non-empty unique string array
 * - Rejects `modelReasoningEffort` (duplicate of `reasoningEffort`)
 * - Rejects `developerInstructions` (use `content` instead)
 * - Rejects generic agent `mode` (not portable)
 */
export const validAgentConfig: ValidationRule = {
  id: 'PS033',
  name: 'valid-agent-config',
  description: 'Agent fields must match portable and target-specific schemas',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const agentsBlock = ctx.ast.blocks.find((b) => b.name === 'agents');
    if (!agentsBlock || agentsBlock.content.type !== 'ObjectContent') return;

    for (const [agentName, agentValue] of Object.entries(agentsBlock.content.properties)) {
      if (typeof agentValue !== 'object' || agentValue === null || Array.isArray(agentValue))
        continue;

      const agent = agentValue as Record<string, Value>;

      // Validate reasoningEffort
      const reasoningEffort = agent['reasoningEffort'];
      if (reasoningEffort !== undefined) {
        if (typeof reasoningEffort !== 'string') {
          ctx.report({
            message: `Agent "${agentName}": reasoningEffort must be a string`,
            location: agentsBlock.loc,
            severity: 'error',
          });
        } else if (!VALID_REASONING_EFFORT.has(reasoningEffort)) {
          ctx.report({
            message: `Agent "${agentName}": invalid reasoningEffort "${reasoningEffort}"`,
            location: agentsBlock.loc,
            suggestion: `Valid values: ${[...VALID_REASONING_EFFORT].join(', ')}`,
            severity: 'error',
          });
        }
      }

      // Validate sandboxMode
      const sandboxMode = agent['sandboxMode'];
      if (sandboxMode !== undefined) {
        if (typeof sandboxMode !== 'string') {
          ctx.report({
            message: `Agent "${agentName}": sandboxMode must be a string`,
            location: agentsBlock.loc,
            severity: 'error',
          });
        } else if (!VALID_SANDBOX_MODE.has(sandboxMode)) {
          ctx.report({
            message: `Agent "${agentName}": invalid sandboxMode "${sandboxMode}"`,
            location: agentsBlock.loc,
            suggestion: `Valid values: ${[...VALID_SANDBOX_MODE].join(', ')}`,
            severity: 'error',
          });
        }
      }

      // Validate nicknameCandidates
      const nicknameCandidates = agent['nicknameCandidates'];
      if (nicknameCandidates !== undefined) {
        if (!Array.isArray(nicknameCandidates)) {
          ctx.report({
            message: `Agent "${agentName}": nicknameCandidates must be an array`,
            location: agentsBlock.loc,
            severity: 'error',
          });
        } else if (nicknameCandidates.length === 0) {
          ctx.report({
            message: `Agent "${agentName}": nicknameCandidates must not be empty`,
            location: agentsBlock.loc,
            severity: 'error',
          });
        } else {
          const seen = new Set<string>();
          for (const candidate of nicknameCandidates) {
            if (typeof candidate !== 'string') {
              ctx.report({
                message: `Agent "${agentName}": nicknameCandidates must contain only strings`,
                location: agentsBlock.loc,
                severity: 'error',
              });
              break;
            }
            if (seen.has(candidate)) {
              ctx.report({
                message: `Agent "${agentName}": duplicate nicknameCandidate "${candidate}"`,
                location: agentsBlock.loc,
                severity: 'error',
              });
            }
            seen.add(candidate);
          }
        }
      }

      // Reject forbidden fields
      if (agent['modelReasoningEffort'] !== undefined) {
        ctx.report({
          message: `Agent "${agentName}": modelReasoningEffort is not a portable field, use reasoningEffort instead`,
          location: agentsBlock.loc,
          severity: 'error',
        });
      }

      if (agent['developerInstructions'] !== undefined) {
        ctx.report({
          message: `Agent "${agentName}": developerInstructions is not a portable field, use content instead`,
          location: agentsBlock.loc,
          severity: 'error',
        });
      }

      if (agent['mode'] !== undefined) {
        ctx.report({
          message: `Agent "${agentName}": generic agent mode is not portable, use sandboxMode for Codex sandbox settings`,
          location: agentsBlock.loc,
          severity: 'error',
        });
      }
    }
  },
};

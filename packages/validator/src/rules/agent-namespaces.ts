import type { ValidationRule } from '../types.js';

/**
 * PS039: Valid namespaced agent definitions.
 *
 * Qualified names must contain non-empty portable segments, and recorded
 * provenance must agree with the namespace encoded in the resolved name.
 */
export const agentNamespaces: ValidationRule = {
  id: 'PS039',
  name: 'agent-namespaces',
  description: 'Namespaced agent names must be well-formed and match provenance',
  defaultSeverity: 'error',
  validate: (ctx) => {
    const agentsBlock = ctx.ast.blocks.find((block) => block.name === 'agents');
    if (
      !agentsBlock ||
      (agentsBlock.content.type !== 'ObjectContent' && agentsBlock.content.type !== 'MixedContent')
    ) {
      return;
    }

    for (const name of Object.keys(agentsBlock.content.properties)) {
      const segments = name.split('.');
      if (segments.length < 2) continue;
      if (segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))) {
        ctx.report({
          message: `Agent "${name}" has an invalid namespace or name segment.`,
          location: agentsBlock.loc,
          suggestion:
            'Use dot-separated alphanumeric, hyphen, or underscore segments such as team.reviewer.',
          severity: 'error',
        });
        continue;
      }

      const provenanceEntries =
        ctx.ast.agentProvenance?.filter((entry) => entry.name === name) ?? [];
      for (const provenance of provenanceEntries) {
        if (!provenance.namespace || name.startsWith(`${provenance.namespace}.`)) continue;
        ctx.report({
          message: `Agent "${name}" does not match its recorded namespace "${provenance.namespace}".`,
          location: agentsBlock.loc,
          suggestion: 'Import the agent with the namespace recorded in its provenance.',
          severity: 'error',
        });
      }
    }
  },
};

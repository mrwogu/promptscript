import { describe, expect, it } from 'vitest';
import { buildSkillPhaseSection } from '../skill-phase.js';

describe('buildSkillPhaseSection', () => {
  it('keeps every context block and the instructions in order', () => {
    expect(
      buildSkillPhaseSection(
        {
          phaseNumber: 2,
          name: 'Release',
          contextBlocks: [
            { blockType: 'knowledge', text: 'Release facts.' },
            { blockType: 'restrictions', text: 'Do not publish drafts.' },
            { blockType: 'standards', text: 'Run checks.' },
          ],
          skillContent: 'Publish the release.',
        },
        'release.prs'
      )
    ).toBe(
      [
        '## Phase 2: Release',
        '<!-- composed-from: release.prs -->',
        '',
        '### Knowledge',
        'Release facts.',
        '',
        '### Restrictions',
        'Do not publish drafts.',
        '',
        '### Standards',
        'Run checks.',
        '',
        '### Instructions',
        'Publish the release.',
      ].join('\n')
    );
  });

  it('omits the instructions heading when no instructions are present', () => {
    expect(
      buildSkillPhaseSection({ phaseNumber: 1, name: 'Check', contextBlocks: [] }, 'check.prs')
    ).toBe('## Phase 1: Check\n<!-- composed-from: check.prs -->');
  });
});

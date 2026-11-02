import { describe, expect, it } from 'vitest';
import { buildSkillPhaseSection, getSkillPhaseSourceLabel } from '../skill-phase.js';

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

describe('getSkillPhaseSourceLabel', () => {
  it('returns the path relative to the project root', () => {
    expect(getSkillPhaseSourceLabel('/work/app/phases/a/check.prs', '/work/app')).toBe(
      'phases/a/check.prs'
    );
  });

  it('gives different labels to the same file name in different folders', () => {
    const first = getSkillPhaseSourceLabel('/work/app/a/check.prs', '/work/app');
    const second = getSkillPhaseSourceLabel('/work/app/b/check.prs', '/work/app');
    expect(first).not.toBe(second);
  });

  it('uses forward slashes for Windows paths', () => {
    expect(getSkillPhaseSourceLabel('C:\\work\\app\\phases\\check.prs', 'C:\\work\\app\\')).toBe(
      'phases/check.prs'
    );
  });

  it('falls back to the file name outside the root', () => {
    expect(getSkillPhaseSourceLabel('/other/shared/check.prs', '/work/app')).toBe('check.prs');
  });

  it('does not treat a sibling folder with the same prefix as inside the root', () => {
    expect(getSkillPhaseSourceLabel('/work/app-extra/check.prs', '/work/app')).toBe('check.prs');
  });

  it('never returns parent segments', () => {
    expect(getSkillPhaseSourceLabel('/work/app/../secret/check.prs', '/work/app')).toBe(
      'check.prs'
    );
  });

  it('handles virtual paths without a leading slash', () => {
    expect(getSkillPhaseSourceLabel('app/phases/check.prs', 'app')).toBe('phases/check.prs');
    expect(getSkillPhaseSourceLabel('phases/check.prs', '')).toBe('phases/check.prs');
    expect(getSkillPhaseSourceLabel('other/check.prs', 'app')).toBe('check.prs');
  });

  it('does not expose a drive path at the virtual root', () => {
    expect(getSkillPhaseSourceLabel('C:\\work\\check.prs', '')).toBe('check.prs');
    expect(getSkillPhaseSourceLabel('c:/work/check.prs', '')).toBe('check.prs');
  });

  it('ignores trailing slashes when it picks the file name', () => {
    expect(getSkillPhaseSourceLabel('/work/check.prs/')).toBe('check.prs');
  });

  it('preserves labels with long separator runs', () => {
    const separators = '/'.repeat(65536);
    expect(getSkillPhaseSourceLabel(`app/${separators}check.prs`, 'app')).toBe('check.prs');
    expect(getSkillPhaseSourceLabel(`/work/check.prs${separators}`)).toBe('check.prs');
  });

  it('preserves empty sources and sources made only of slashes', () => {
    expect(getSkillPhaseSourceLabel('')).toBe('');
    expect(getSkillPhaseSourceLabel('///')).toBe('///');
  });

  it('uses the file name when no root is given', () => {
    expect(getSkillPhaseSourceLabel('/work/app/phases/check.prs')).toBe('check.prs');
    expect(getSkillPhaseSourceLabel('C:\\work\\check.prs')).toBe('check.prs');
  });
});

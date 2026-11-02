import { describe, expect, it } from 'vitest';
import { individualRosters, outsideRosterWarning } from './roster.js';

describe('individualRosters', () => {
  it('keeps only roles that list user handles', () => {
    const governance = {
      roles: {
        legal: ['@jane', '@bob'],
        team: ['@jane', '@acme/legal'],
        mail: ['jane@example.com'],
        empty: [],
        odd: 'nope',
        numbers: [1],
      },
    };

    const rosters = individualRosters(governance);

    expect([...rosters.keys()]).toEqual(['legal']);
  });

  it('returns nothing without a roles section', () => {
    expect(individualRosters(undefined).size).toBe(0);
    expect(individualRosters({ roles: 'x' }).size).toBe(0);
  });
});

describe('outsideRosterWarning', () => {
  const rosters = new Map([['legal', ['@jane']]]);

  it('adds the location when a file is given and escapes hidden characters', () => {
    const warning = outsideRosterWarning(rosters, 'legal', '@ev\u200be', 'a.json', 'a.json');

    expect(warning?.location).toEqual({ file: 'a.json' });
    expect(warning?.message).toContain(String.raw`@ev\u200Be approved as legal`);
  });

  it('is silent for a listed approver and for a role without a roster', () => {
    expect(outsideRosterWarning(rosters, 'legal', '@JANE', 'x')).toBeUndefined();
    expect(outsideRosterWarning(rosters, 'other', '@eve', 'x')).toBeUndefined();
  });
});

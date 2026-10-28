import { describe, expect, it } from 'vitest';
import type { AuditEvent } from './events.js';
import { cefExtensionValue, cefHeaderValue, cefLine, textLines } from './format.js';

const HASH = `sha256-${'a'.repeat(64)}`;
const HEAD = 'f'.repeat(40);

const approved: AuditEvent = {
  type: 'approved',
  commit: 'c'.repeat(40),
  at: '2026-10-22T09:14:03+02:00',
  author: { name: 'Jane Doe', email: 'jane@example.com' },
  committer: { name: 'Jane Doe', email: 'jane@example.com' },
  path: '.promptscript/approvals/legal/acme-support/refund-reply/x.jane.json',
  mainline: true,
  prompt: 'acme-support/refund-reply',
  contentHash: HASH,
  role: 'legal',
  environment: 'prod',
  approver: '@jane',
  approverSource: 'asserted',
  recordCreatedAt: '2026-10-22T07:14:00.000Z',
  comment: 'ok=fine\nsecond line',
  state: 'well-formed',
};

describe('CEF escaping', () => {
  it.each([
    ['plain', 'plain'],
    ['a|b', 'a\\|b'],
    ['back\\slash', 'back\\\\slash'],
    ['a=b', 'a=b'],
    ['bell\u0007\u009b[2J', 'bell[2J'],
    ['line\nbreak', 'linebreak'],
  ])('escapes the header value %j', (input, expected) => {
    // Arrange, Act
    const escaped = cefHeaderValue(input);

    // Assert
    expect(escaped).toBe(expected);
  });

  it.each([
    ['plain', 'plain'],
    ['a=b', 'a\\=b'],
    ['back\\slash', 'back\\\\slash'],
    ['a|b', 'a|b'],
    ['one\ntwo\r\nthree\rfour', 'one\\ntwo\\nthree\\nfour'],
    ['esc\u001b[31m\u202eflip\u200b', 'esc[31mflip'],
    ['\\=', '\\\\\\='],
  ])('escapes the extension value %j', (input, expected) => {
    // Arrange, Act
    const escaped = cefExtensionValue(input);

    // Assert
    expect(escaped).toBe(expected);
  });
});

describe('cefLine', () => {
  it('writes the header, severity and every field of an approval', () => {
    // Arrange, Act
    const line = cefLine(approved, HEAD, '1.2.3');

    // Assert
    expect(line).toBe(
      [
        'CEF:0|PromptScript|prs|1.2.3|prs-approved|Prompt approved|5|',
        `rt=${Date.parse(approved.at)} act=approved suser=jane@example.com duser=@jane`,
        ` filePath=${approved.path}`,
        ' cs1=acme-support/refund-reply cs1Label=prompt',
        ` cs2=${HASH} cs2Label=contentHash cs3=legal cs3Label=role cs4=prod cs4Label=environment`,
        ` cs5=${'c'.repeat(40)} cs5Label=commit outcome=well-formed msg=ok\\=fine\\nsecond line`,
        ` flexString1=${HEAD} flexString1Label=head`,
        ' flexString2=asserted flexString2Label=approverSource cn3=1 cn3Label=mainline',
      ].join('')
    );
  });

  it('gives each event type its severity', () => {
    // Arrange
    const types: [AuditEvent['type'], number][] = [
      ['changed', 3],
      ['approval-removed', 6],
      ['promoted', 6],
      ['rolled-back', 7],
      ['label-removed', 7],
      ['generated', 3],
      ['config-changed', 6],
    ];

    // Act
    const severities = types.map(
      ([type]) => cefLine({ ...approved, type }, HEAD, '1').split('|')[6]
    );

    // Assert
    expect(severities).toEqual(types.map(([, severity]) => String(severity)));
  });

  it('puts the change of a file event into outcome', () => {
    // Arrange
    const event: AuditEvent = {
      type: 'changed',
      commit: approved.commit,
      at: approved.at,
      author: approved.author,
      committer: approved.committer,
      path: 'a.prs',
      mainline: true,
      change: 'D',
    };

    // Act
    const line = cefLine(event, HEAD, '1');

    // Assert
    expect(line).toContain('outcome=deleted');
    expect(line).not.toContain('cs2=');
  });
});

describe('merge and environment markers', () => {
  it('marks an event of a merge and of an unconfigured environment in CEF and text', () => {
    // Arrange
    const event: AuditEvent = {
      ...approved,
      type: 'promoted',
      viaMerge: true,
      configured: false,
    };

    // Act
    const line = cefLine(event, HEAD, '1');
    const text = textLines(event)[0] ?? '';

    // Assert
    expect(line).toContain(' cn1=1 cn1Label=viaMerge cn2=0 cn2Label=configured');
    expect(text).toContain('  [via merge]  [environment not configured]  by Jane Doe');
  });

  it('writes a dropped label entry with its parent and the dropped hash', () => {
    // Arrange
    const event: AuditEvent = {
      type: 'merge-dropped',
      commit: approved.commit,
      at: approved.at,
      author: approved.author,
      committer: approved.committer,
      path: '.promptscript/releases/prod.json',
      mainline: false,
      viaMerge: true,
      parent: 'd'.repeat(40),
      environment: 'prod',
      prompt: 'acme-support/refund-reply',
      contentHash: HASH,
      droppedContentHash: `sha256-${'b'.repeat(64)}`,
    };

    // Act
    const line = cefLine(event, HEAD, '1');
    const text = textLines(event)[0] ?? '';

    // Assert
    expect(line).toMatch(
      /^CEF:0\|PromptScript\|prs\|1\|prs-merge-dropped\|Merge dropped a change\|7\|/
    );
    expect(line).toContain(` cs6=${'d'.repeat(40)} cs6Label=parent`);
    expect(line).toContain(` cn3=0 cn3Label=mainline oldFileHash=sha256-${'b'.repeat(64)}`);
    expect(text).toContain(
      `acme-support/refund-reply  env=prod  dropped=sha256-${'b'.repeat(64)}  parent=dddddddddddd  [via merge]  [side branch]`
    );
  });

  it('writes a dropped record and a dropped CODEOWNERS section with the parent', () => {
    // Arrange
    const record: AuditEvent = {
      ...approved,
      type: 'merge-dropped',
      parent: 'e'.repeat(40),
      change: 'D',
      viaMerge: true,
    };
    const section: AuditEvent = {
      type: 'merge-dropped',
      commit: approved.commit,
      at: approved.at,
      author: approved.author,
      committer: approved.committer,
      path: '.github/CODEOWNERS',
      mainline: true,
      viaMerge: true,
      parent: 'e'.repeat(40),
    };

    // Act
    const recordText = textLines(record)[0] ?? '';
    const sectionText = textLines(section)[0] ?? '';

    // Assert
    expect(recordText).toContain(
      `merge-dropped  cccccccccccc  change=D  state=well-formed  ${approved.path}  parent=eeeeeeeeeeee  [via merge]`
    );
    expect(sectionText).toContain(
      'merge-dropped  cccccccccccc  change=M  .github/CODEOWNERS  parent=eeeeeeeeeeee'
    );
  });

  it('leaves both markers out of a plain event', () => {
    // Arrange, Act
    const line = cefLine(approved, HEAD, '1');

    // Assert
    expect(line).not.toContain('cn1');
    expect(line).not.toContain('cn2');
  });
});

describe('textLines', () => {
  it('starts with the content hash and indents the comment lines', () => {
    // Arrange, Act
    const lines = textLines(approved);

    // Assert
    expect(lines[0]?.startsWith(`${HASH}  ${approved.at}  approved  cccccccccccc  `)).toBe(true);
    expect(lines[0]).toContain(
      'role=legal  approver=@jane (asserted)  env=prod  state=well-formed'
    );
    expect(lines.slice(1)).toEqual(['    comment: ok=fine', '      second line']);
  });

  it('strips control, bidi and zero-width characters from Git and record fields', () => {
    // Arrange
    const event: AuditEvent = {
      ...approved,
      author: { name: 'Evil\u001b[2J\u202e', email: 'e\u200b@x\u2028' },
      comment: 'hi\u0007\u2029there',
    };

    // Act
    const text = textLines(event).join('\n');

    // Assert
    expect(text).toContain('by Evil[2J <e@x>');
    expect(text).toContain('comment: hithere');
    // eslint-disable-next-line no-control-regex
    expect(text).not.toMatch(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u200b\u2028\u2029\u202e]/);
  });

  it('shows a dash for events without a hash', () => {
    // Arrange
    const event: AuditEvent = { ...approved, type: 'generated', path: '.github/CODEOWNERS' };
    delete event.contentHash;
    delete event.comment;

    // Act
    const lines = textLines(event);

    // Assert
    expect(lines).toEqual([
      `-  ${approved.at}  generated  cccccccccccc  .github/CODEOWNERS  by Jane Doe <jane@example.com>`,
    ]);
  });
});

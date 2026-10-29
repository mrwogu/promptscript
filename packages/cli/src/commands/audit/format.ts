import { stripControlCharacters } from '../release/git.js';
import type { AuditEvent, AuditEventType } from './events.js';

/** CEF severity and name of each event type. */
const CEF_TYPES: Readonly<Record<AuditEventType, { name: string; severity: number }>> = {
  changed: { name: 'Prompt file changed', severity: 3 },
  approved: { name: 'Prompt approved', severity: 5 },
  'approval-removed': { name: 'Approval removed', severity: 6 },
  promoted: { name: 'Prompt promoted', severity: 6 },
  'rolled-back': { name: 'Prompt rolled back', severity: 7 },
  'label-removed': { name: 'Prompt removed from label', severity: 7 },
  'merge-dropped': { name: 'Merge dropped a change', severity: 7 },
  generated: { name: 'CODEOWNERS section generated', severity: 3 },
  'config-changed': { name: 'Config changed', severity: 6 },
};

const CHANGE_WORDS = { A: 'added', M: 'modified', D: 'deleted' } as const;

/** A CEF header value: `\` and `|` escaped, control characters dropped. */
export function cefHeaderValue(value: string): string {
  return stripControlCharacters(
    value.replaceAll('\\', String.raw`\\`).replaceAll('|', String.raw`\|`)
  );
}

/**
 * A CEF extension value: `\` and `=` escaped, line breaks as `\n`, other control
 * characters dropped.
 */
export function cefExtensionValue(value: string): string {
  const escaped = value
    .replaceAll('\\', String.raw`\\`)
    .replaceAll('=', String.raw`\=`)
    .replace(/\r\n|\r|\n/g, String.raw`\n`);
  return stripControlCharacters(escaped);
}

/** One CEF line for an event; `head` is the commit the log was read from. */
export function cefLine(event: AuditEvent, head: string, version: string): string {
  const { name, severity } = CEF_TYPES[event.type];
  const header = [
    'CEF:0',
    'PromptScript',
    'prs',
    cefHeaderValue(version),
    `prs-${event.type}`,
    name,
    String(severity),
  ].join('|');
  const custom: [string, string | undefined][] = [
    ['prompt', event.prompt],
    ['contentHash', event.contentHash],
    ['role', event.role],
    ['environment', event.environment],
    ['commit', event.commit],
    // A dropped change has no previous hash; its sixth field names the parent instead.
    event.type === 'merge-dropped'
      ? ['parent', event.parent]
      : ['previousContentHash', event.previousContentHash],
  ];
  const outcome =
    event.state ?? (event.change === undefined ? undefined : CHANGE_WORDS[event.change]);
  const fields: [string, string | undefined][] = [
    ['rt', String(Date.parse(event.at))],
    ['act', event.type],
    ['suser', event.author.email],
    ['duser', event.approver],
    ['filePath', event.path],
    ...custom.flatMap(([label, value], index): [string, string | undefined][] => [
      [`cs${index + 1}`, value],
      [`cs${index + 1}Label`, value === undefined ? undefined : label],
    ]),
    ['outcome', outcome],
    ['msg', event.comment],
    ['flexString1', head],
    ['flexString1Label', 'head'],
    ['flexString2', event.approverSource],
    ['flexString2Label', event.approverSource === undefined ? undefined : 'approverSource'],
    ['cn1', event.viaMerge === true ? '1' : undefined],
    ['cn1Label', event.viaMerge === true ? 'viaMerge' : undefined],
    ['cn2', event.configured === false ? '0' : undefined],
    ['cn2Label', event.configured === false ? 'configured' : undefined],
    ['cn3', event.mainline ? '1' : '0'],
    ['cn3Label', 'mainline'],
    ['oldFileHash', event.droppedContentHash],
  ];
  const extension = fields
    .flatMap(([key, value]) => (value === undefined ? [] : [`${key}=${cefExtensionValue(value)}`]))
    .join(' ');
  return `${header}|${extension}`;
}

const shown = (value: string): string => stripControlCharacters(value);

function person(event: AuditEvent): string {
  return `by ${shown(event.author.name)} <${shown(event.author.email)}>`;
}

function details(event: AuditEvent): string[] {
  switch (event.type) {
    case 'approved':
    case 'approval-removed':
      return event.prompt === undefined
        ? [`state=${event.state ?? 'invalid'}`, shown(event.path)]
        : [
            shown(event.prompt),
            `role=${shown(event.role ?? '')}`,
            `approver=${shown(event.approver ?? '')} (${event.approverSource ?? 'asserted'})`,
            `env=${shown(event.environment ?? 'all')}`,
            `state=${event.state ?? 'well-formed'}`,
            shown(event.path),
          ];
    case 'promoted':
    case 'rolled-back':
    case 'label-removed':
      return [
        shown(event.prompt ?? ''),
        `env=${shown(event.environment ?? '')}`,
        `previous=${event.previousContentHash ?? '-'}`,
      ];
    case 'changed':
    case 'config-changed':
      return [event.change ?? 'M', shown(event.path)];
    case 'generated':
      return [shown(event.path)];
    case 'merge-dropped':
      return droppedDetails(event);
  }
}

/** What the merge dropped: a label entry, a record change or the CODEOWNERS section. */
function droppedDetails(event: AuditEvent): string[] {
  const parent = `parent=${(event.parent ?? '').slice(0, 12)}`;
  if (event.role === undefined && event.environment !== undefined) {
    return [
      shown(event.prompt ?? '-'),
      `env=${shown(event.environment)}`,
      `dropped=${event.droppedContentHash ?? '-'}`,
      parent,
    ];
  }
  return [
    `change=${event.change ?? 'M'}`,
    ...(event.state === undefined ? [] : [`state=${event.state}`]),
    shown(event.path),
    parent,
  ];
}

/**
 * One event as text: the content hash first (`-` without one), then the time, the type,
 * the commit and the details. A comment follows on indented lines.
 */
export function textLines(event: AuditEvent): string[] {
  const line = [
    event.contentHash ?? '-',
    shown(event.at),
    event.type,
    event.commit.slice(0, 12),
    ...details(event),
    ...(event.viaMerge === true ? ['[via merge]'] : []),
    ...(event.mainline ? [] : ['[side branch]']),
    ...(event.configured === false ? ['[environment not configured]'] : []),
    person(event),
  ].join('  ');
  const comment =
    event.comment === undefined
      ? []
      : event.comment
          .split('\n')
          .map((text, index) => `    ${index === 0 ? 'comment: ' : '  '}${shown(text)}`);
  return [line, ...comment];
}

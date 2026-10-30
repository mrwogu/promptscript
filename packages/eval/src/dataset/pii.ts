import { EVAL_CODES, type EvalCode } from '../errors.js';

// Letters, marks and digits of any script, so `józef@firma.pl` and `jan@münchen.de` count
const EMAIL_LOCAL_CHAR = /[\p{L}\p{M}\p{N}_.%+-]/u;
const EMAIL_DOMAIN = /^(?:[\p{L}\p{M}\p{N}-]+\.)+[\p{L}\p{M}]{2,}/u;
// Up to three of these between two digits still read as one number
const CARD_SEPARATORS = '[ \\-\u2013\u2014_/,]';
// A run of digits with separators between them, whatever stands next to it
const DIGIT_RUN = new RegExp(`(?<!\\d)\\d(?:${CARD_SEPARATORS}{0,3}\\d)*(?!\\d)`, 'g');
const CARD_SEPARATOR_RUN = new RegExp(`${CARD_SEPARATORS}+`);
// A group longer than this is an id, not a card with something glued to it, and is not slid over
const MAX_SLID_GROUP = 64;
const LETTER = /\p{L}/u;
const IBAN_START = /(?=[A-Za-z]{2}\d{2})/g;
const IBAN_CHAR = /^[A-Za-z\d]$/;
const MIN_CARD_DIGITS = 13;
const MAX_CARD_DIGITS = 19;
const MAX_IBAN_SEPARATORS = 8;
const MAX_SCRUB_ROUNDS = 4;

// IBAN lengths of the EU member states, the United Kingdom, Switzerland and Norway.
const IBAN_LENGTHS: Readonly<Record<string, number>> = {
  AT: 20,
  BE: 16,
  BG: 22,
  CH: 21,
  CY: 28,
  CZ: 24,
  DE: 22,
  DK: 18,
  EE: 20,
  ES: 24,
  FI: 18,
  FR: 27,
  GB: 22,
  GR: 27,
  HR: 21,
  HU: 28,
  IE: 22,
  IT: 27,
  LT: 20,
  LU: 20,
  LV: 21,
  MT: 31,
  NL: 18,
  NO: 15,
  PL: 28,
  PT: 25,
  RO: 24,
  SE: 24,
  SI: 19,
  SK: 24,
};

/** Half-open range of a value, in UTF-16 units. */
interface Span {
  start: number;
  end: number;
}

// Looks around each `@` instead of running one pattern over the whole text,
// so the scan stays linear on long values. The span is the whole address.
function findEmails(text: string): Span[] {
  const spans: Span[] = [];
  for (let at = text.indexOf('@'); at !== -1; at = text.indexOf('@', at + 1)) {
    if (at === 0 || !EMAIL_LOCAL_CHAR.test(text.charAt(at - 1))) continue;
    const domain = EMAIL_DOMAIN.exec(text.slice(at + 1, at + 254));
    if (domain === null) continue;
    let start = at - 1;
    while (start > 0 && EMAIL_LOCAL_CHAR.test(text.charAt(start - 1))) start--;
    spans.push({ start, end: at + 1 + domain[0].length });
  }
  return spans;
}

function passesLuhn(digits: string): boolean {
  let sum = 0;
  for (let index = 0; index < digits.length; index++) {
    let digit = Number(digits.charAt(digits.length - 1 - index));
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// Where a window may start and end: at the borders of the groups and, inside a group that
// may be slid over, at every position. Positions count digits of the run without separators.
function cardBorders(
  groups: string[],
  mayGlue: boolean
): { digits: string; starts: number[]; ends: Set<number> } {
  let digits = '';
  const starts: number[] = [];
  const ends = new Set<number>();
  for (const group of groups) {
    const slide = mayGlue && group.length > MAX_CARD_DIGITS && group.length <= MAX_SLID_GROUP;
    for (let index = 0; index < group.length; index++) {
      if (index === 0 || slide) starts.push(digits.length + index);
      if (index === group.length - 1 || slide) ends.add(digits.length + index + 1);
    }
    digits += group;
  }
  return { digits, starts, ends };
}

// A card number may stand next to other digits: a quantity, a date, an order number, or more
// digits glued to it. So the windows of 13 to 19 digits are tried that start and end at a group
// border, and, inside a group of up to 64 digits, at every position. One that passes the Luhn
// check takes the whole run with it. That errs on the side of replacing too much. A run that
// has letters stuck to it is an IBAN or an id, so `detectPii` does not slide over its digits, to
// keep dataset scans quiet; `scrubPii` always does, since a card can hide in such an id too.
function runHasCard(run: string, mayGlue: boolean): boolean {
  const { digits, starts, ends } = cardBorders(run.split(CARD_SEPARATOR_RUN), mayGlue);
  for (const start of starts) {
    const last = Math.min(start + MAX_CARD_DIGITS, digits.length);
    for (let end = start + MIN_CARD_DIGITS; end <= last; end++) {
      if (ends.has(end) && passesLuhn(digits.slice(start, end))) return true;
    }
  }
  return false;
}

function findCards(text: string, slideAlways: boolean): Span[] {
  const spans: Span[] = [];
  for (const match of text.matchAll(DIGIT_RUN)) {
    if (match[0].length < MIN_CARD_DIGITS) continue;
    const start = match.index;
    const end = start + match[0].length;
    const lettered = LETTER.test(text.charAt(start - 1)) || LETTER.test(text.charAt(end));
    if (runHasCard(match[0], slideAlways || !lettered)) spans.push({ start, end });
  }
  return spans;
}

// Remainder of the IBAN check: first four characters moved to the end,
// letters as 10-35, mod 97. A valid IBAN gives 1.
function ibanRemainder(iban: string): number {
  let remainder = 0;
  for (const char of iban.slice(4) + iban.slice(0, 4)) {
    const value = Number.parseInt(char, 36);
    remainder = (remainder * (value > 9 ? 100 : 10) + value) % 97;
  }
  return remainder;
}

// The IBAN of `length` characters starting at `start`, in capitals, with spaces or dashes
// allowed between characters, or undefined when the text ends first. The end index is
// after the last character of the IBAN.
function readIban(
  text: string,
  start: number,
  length: number
): { iban: string; end: number } | undefined {
  let iban = '';
  let index = start;
  while (index < text.length && iban.length < length) {
    const char = text.charAt(index);
    if (IBAN_CHAR.test(char)) {
      iban += char.toUpperCase();
      index++;
      continue;
    }
    let next = index;
    while (
      next < text.length &&
      next - index < MAX_IBAN_SEPARATORS &&
      /[ -]/.test(text.charAt(next))
    ) {
      next++;
    }
    if (next === index || !IBAN_CHAR.test(text.charAt(next))) break;
    index = next;
  }
  return iban.length === length ? { iban, end: index } : undefined;
}

function findIbans(text: string): Span[] {
  const spans: Span[] = [];
  for (const match of text.matchAll(IBAN_START)) {
    const country = text.slice(match.index, match.index + 2).toUpperCase();
    const length = Object.hasOwn(IBAN_LENGTHS, country) ? IBAN_LENGTHS[country] : undefined;
    if (length === undefined) continue;
    const found = readIban(text, match.index, length);
    if (found !== undefined && ibanRemainder(found.iban) === 1) {
      spans.push({ start: match.index, end: found.end });
    }
  }
  return spans;
}

/**
 * Find personal data in one dataset value: an email address, a payment card
 * number of 13 to 19 digits that passes the Luhn check, or an IBAN of one of
 * 30 European countries that passes the mod-97 check. Spaces and dashes
 * inside numbers are ignored.
 *
 * @param text - One string value of a row
 * @returns The PII codes that fired, in email, card, IBAN order
 */
export function detectPii(text: string): EvalCode[] {
  const codes: EvalCode[] = [];
  if (findEmails(text).length > 0) codes.push(EVAL_CODES.PII_EMAIL);
  if (findCards(text, false).length > 0) codes.push(EVAL_CODES.PII_CARD);
  if (findIbans(text).length > 0) codes.push(EVAL_CODES.PII_IBAN);
  return codes;
}

/** Number of values {@link scrubPii} replaced, by kind. */
export interface ScrubCounts {
  email: number;
  card: number;
  iban: number;
}

// Merges overlapping spans, so two addresses that share text give one replacement
function mergeSpans(spans: readonly Span[]): Span[] {
  const merged: Span[] = [];
  for (const span of [...spans].sort((a, b) => a.start - b.start)) {
    const last = merged.at(-1);
    if (last !== undefined && span.start <= last.end) {
      last.end = Math.max(last.end, span.end);
    } else {
      merged.push({ ...span });
    }
  }
  return merged;
}

function replaceSpans(text: string, spans: readonly Span[], token: string): string {
  let result = '';
  let from = 0;
  for (const span of mergeSpans(spans)) {
    result += text.slice(from, span.start) + token;
    from = span.end;
  }
  return result + text.slice(from);
}

/**
 * Replace the personal data {@link detectPii} finds in one value with `[email]`,
 * `[card]` or `[iban]`. It uses the same detectors, so it finds what the
 * scan finds and nothing more: names, phone numbers, postal addresses and ids
 * in free text stay. It passes over the text in the order email, IBAN, card until
 * nothing is left to replace (at most four rounds), so a card-like run inside an address or an
 * IBAN goes with it and a value that stood next to a replaced one is found. Run `detectPii` on
 * the result to catch a bug in the replacer.
 *
 * @param text - One string value
 * @returns The scrubbed text and how many values of each kind were replaced
 */
export function scrubPii(text: string): { text: string; counts: ScrubCounts } {
  const counts: ScrubCounts = { email: 0, card: 0, iban: 0 };
  let result = text;
  const steps: Array<[keyof ScrubCounts, (value: string) => Span[]]> = [
    ['email', findEmails],
    ['iban', findIbans],
    ['card', (value) => findCards(value, true)],
  ];
  // A replacement can uncover a value that stood next to it, such as an IBAN glued to a card
  // number, so the passes repeat until nothing is left to replace
  for (let round = 0; round < MAX_SCRUB_ROUNDS; round++) {
    let replaced = false;
    for (const [kind, find] of steps) {
      const spans = find(result);
      if (spans.length === 0) continue;
      counts[kind] += mergeSpans(spans).length;
      result = replaceSpans(result, spans, `[${kind}]`);
      replaced = true;
    }
    if (!replaced) break;
  }
  return { text: result, counts };
}

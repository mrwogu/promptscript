import { EVAL_CODES, type EvalCode } from '../errors.js';

const EMAIL_LOCAL_CHAR = /[\w.%+-]/;
const EMAIL_DOMAIN = /^(?:[A-Za-z\d-]+\.)+[A-Za-z]{2,}/;
const CARD_CANDIDATE = /(?<![\d-])\d(?:[ -]?\d){12,18}(?!\d)/g;
const IBAN_START = /\b[A-Z]{2}\d{2}/g;
const IBAN_CHAR = /^[A-Z\d]$/;

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

// Looks around each `@` instead of running one pattern over the whole text,
// so the scan stays linear on long values.
function hasEmail(text: string): boolean {
  for (let at = text.indexOf('@'); at !== -1; at = text.indexOf('@', at + 1)) {
    if (
      at > 0 &&
      EMAIL_LOCAL_CHAR.test(text.charAt(at - 1)) &&
      EMAIL_DOMAIN.test(text.slice(at + 1, at + 254))
    ) {
      return true;
    }
  }
  return false;
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

function hasCard(text: string): boolean {
  for (const match of text.matchAll(CARD_CANDIDATE)) {
    if (passesLuhn(match[0].replaceAll(/[ -]/g, ''))) return true;
  }
  return false;
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

// The IBAN of `length` characters starting at `start`, with single spaces or
// dashes allowed between characters, or undefined when it does not end there.
function readIban(text: string, start: number, length: number): string | undefined {
  let iban = '';
  let index = start;
  while (index < text.length && iban.length < length) {
    const char = text.charAt(index);
    if (IBAN_CHAR.test(char)) {
      iban += char;
    } else if ((char !== ' ' && char !== '-') || !IBAN_CHAR.test(text.charAt(index + 1))) {
      break;
    }
    index++;
  }
  return iban.length === length && !IBAN_CHAR.test(text.charAt(index)) ? iban : undefined;
}

function hasIban(text: string): boolean {
  for (const match of text.matchAll(IBAN_START)) {
    const country = match[0].slice(0, 2);
    const length = Object.hasOwn(IBAN_LENGTHS, country) ? IBAN_LENGTHS[country] : undefined;
    if (length === undefined) continue;
    const iban = readIban(text, match.index, length);
    if (iban !== undefined && ibanRemainder(iban) === 1) return true;
  }
  return false;
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
  if (hasEmail(text)) codes.push(EVAL_CODES.PII_EMAIL);
  if (hasCard(text)) codes.push(EVAL_CODES.PII_CARD);
  if (hasIban(text)) codes.push(EVAL_CODES.PII_IBAN);
  return codes;
}

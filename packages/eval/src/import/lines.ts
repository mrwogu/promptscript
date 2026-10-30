import { Buffer } from 'node:buffer';
import { createReadStream } from 'node:fs';

/** One line of a sample file: its text, or the reason it cannot be used. */
export type SampleLine =
  { line: number; text: string } | { line: number; problem: 'too-long' | 'not-utf8' };

/** Limits of {@link readSampleLines}. */
export interface SampleLineLimits {
  /** Longest line in bytes */
  maxLineBytes: number;
}

/**
 * Split a file into lines while counting bytes. A line over the cap is dropped as it
 * streams past and never buffered, so one hostile line costs no memory; it is reported
 * as a problem and the next line is read. Each line is strict UTF-8. A final empty
 * fragment is no line.
 */
export async function* readSampleLines(
  file: string,
  limits: SampleLineLimits
): AsyncGenerator<SampleLine> {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let parts: Buffer[] = [];
  let size = 0;
  let line = 1;
  let tooLong = false;

  const add = (part: Buffer): void => {
    if (tooLong) return;
    size += part.length;
    if (size > limits.maxLineBytes) {
      tooLong = true;
      parts = [];
      return;
    }
    parts.push(part);
  };
  const take = (): SampleLine => {
    const number = line;
    line += 1;
    let result: SampleLine;
    if (tooLong) {
      result = { line: number, problem: 'too-long' };
    } else {
      try {
        // The decoder drops a byte order mark at the start of a line
        const text = decoder.decode(Buffer.concat(parts));
        result = { line: number, text: text.endsWith('\r') ? text.slice(0, -1) : text };
      } catch {
        result = { line: number, problem: 'not-utf8' };
      }
    }
    parts = [];
    size = 0;
    tooLong = false;
    return result;
  };

  for await (const chunk of createReadStream(file) as AsyncIterable<Buffer>) {
    let start = 0;
    for (let end = chunk.indexOf(0x0a); end !== -1; end = chunk.indexOf(0x0a, start)) {
      add(chunk.subarray(start, end));
      yield take();
      start = end + 1;
    }
    add(chunk.subarray(start));
  }
  if (size > 0 || tooLong) yield take();
}

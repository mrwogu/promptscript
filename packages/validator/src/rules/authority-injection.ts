import type { ValidationRule } from '../types.js';
import { walkText } from '../walker.js';

/**
 * Patterns that indicate attempts to inject authoritative override instructions.
 * These patterns are commonly used in prompt injection attacks to make AI models
 * believe they should override their existing instructions or safety measures.
 *
 * NOTE: All patterns use bounded quantifiers (e.g., \s{0,10}) instead of unbounded
 * ones (\s*, \s+) to prevent ReDoS (Regular Expression Denial of Service) attacks.
 * This ensures O(n) matching time even on adversarial inputs.
 */
const WARNING_SUPPRESSION_PATTERNS: RegExp[] = [
  // Removed because it triggers false positives on valid agent instructions (e.g., "do not notify user")
  // /(?:DO\s{1,10}NOT|NEVER|DON'?T)\s{1,10}(?:WARN|ALERT|NOTIFY|FLAG|REPORT)/i,
  /\b(?:DO\s{1,10}NOT|NEVER|DON'?T)\b\s{1,10}(?:PROVIDE|SHOW|DISPLAY|INCLUDE)\b\s{1,10}(?:SECURITY\s{1,10})?WARNINGS?\b/i,
  /\b(?:SUPPRESS|HIDE|DISABLE|REMOVE|SILENCE)\b\s{1,10}(?:ALL\s{1,10})?WARNINGS?\b/i,
  /\b(?:SUPPRESS|HIDE|DISABLE|REMOVE|SILENCE)\b\s{1,10}(?:ALL\s{1,10})?(?:SECURITY\s{1,10})?(?:ALERTS?|NOTIFICATIONS?)\b/i,
  /\bIGNORE\b\s{1,10}(?:ALL\s{1,10})?(?:SAFETY\s{1,10})?WARNINGS?\b/i,
  /(?:^|[.!?:;]\s{0,10})\s{0,10}(?:[-*]\s{1,10})?(?:PLEASE\s{1,10})?\b(?:SKIP|BYPASS)\b\s{1,10}(?:CHECKS?|VALIDATION)\b/im,
  /\b(?:SKIP|BYPASS)\b\s{1,10}(?:(?:ALL\s{1,10})(?:SAFETY\s{1,10})?|SAFETY\s{1,10})(?:CHECKS?|VALIDATION)\b/i,
];

const AUTHORITY_PATTERNS: RegExp[] = [
  // Mandatory/strict mode indicators
  /\[?\s{0,10}\bMANDATORY\b\s{0,10}(?:POLICY|UPDATE|FOOTER|INSTRUCTION|DIRECTIVE)\b\s{0,10}\]?/i,
  /\[\s{0,10}OVERRIDE\s{0,10}\]/i,
  /\[?\s{0,10}\bSTRICT[_\s]{0,10}MODE\b\s{0,10}[:\s]{1,10}ON\b\s{0,10}\]?/i,
  /\[?\s{0,10}\bSYSTEM\b\s{0,10}(?:OVERRIDE|UPDATE|DIRECTIVE)\b\s{0,10}\]?/i,
  /\[?\s{0,10}\bADMIN(?:ISTRATOR)?\b\s{0,10}(?:MODE|OVERRIDE|ACCESS)\b\s{0,10}\]?/i,
  /\[?\s{0,10}\bROOT\b\s{0,10}(?:ACCESS|MODE|OVERRIDE)\b\s{0,10}\]?/i,
  /\[?\s{0,10}\bPRIORITY\b\s{0,10}(?:OVERRIDE|ONE|ALPHA)\b\s{0,10}\]?/i,
  /\[?\s{0,10}\bEMERGENCY\b\s{0,10}(?:PROTOCOL|OVERRIDE|MODE)\b\s{0,10}\]?/i,

  // Warning suppression patterns
  ...WARNING_SUPPRESSION_PATTERNS,

  // Execute/follow verbatim patterns
  /\bEXECUTE\b\s{1,10}(?:THIS\s{1,10})?VERBATIM\b/i,
  /\bFOLLOW\b\s{1,10}(?:THESE?\s{1,10})?INSTRUCTIONS?\s{1,10}(?:EXACTLY|PRECISELY|LITERALLY)\b/i,
  /\b(?:MUST|SHALL|WILL)\b\s{1,10}(?:ALWAYS\s{1,10})?COMPLY\b/i,
  /\b(?:ABSOLUTE|UNCONDITIONAL)\b\s{1,10}(?:COMPLIANCE|OBEDIENCE)\b/i,
  /\bNO\b\s{1,10}(?:EXCEPTIONS?|DEVIATIONS?)\s{1,10}(?:ALLOWED|PERMITTED)\b/i,

  // Authority assertion patterns
  /\bTHIS\b\s{1,10}(?:OVERRIDES?|SUPERSEDES?|REPLACES?)\s{1,10}(?:ALL\s{1,10})?(?:PREVIOUS|PRIOR|OTHER)\b/i,
  /\b(?:HIGHEST|TOP|MAXIMUM)\b\s{1,10}PRIORITY\s{1,10}(?:INSTRUCTION|DIRECTIVE|ORDER)\b/i,
  /\b(?:CORE|FUNDAMENTAL|BASE)\b\s{1,10}(?:DIRECTIVE|INSTRUCTION)\s{1,10}(?:UPDATE|OVERRIDE)\b/i,
  /\bNEW\b\s{1,10}(?:SYSTEM|CORE|BASE)\s{1,10}(?:INSTRUCTIONS?|DIRECTIVES?|RULES?)\b/i,
];

const SUPPRESSION_PATTERN_SET = new Set(WARNING_SUPPRESSION_PATTERNS);
const DEFENSIVE_HEADING_NAMES = new Set([
  "don't",
  "don'ts",
  'do not',
  'forbidden',
  'restriction',
  'restrictions',
]);

interface TextRange {
  start: number;
  end: number;
}

interface NormalizedText {
  value: string;
  sourceStarts: number[];
  sourceEnds: number[];
}

interface FenceInfo {
  character: '`' | '~';
  length: number;
}

interface MarkdownListItem {
  indentation: number;
  range: TextRange;
  safe: boolean;
}

function isHorizontalWhitespace(character: string | undefined): boolean {
  return character === ' ' || character === '\t';
}

function getSpaceIndentation(line: string): number | undefined {
  let index = 0;
  while (line[index] === ' ') {
    index++;
  }
  return line[index] === '\t' ? undefined : index;
}

function getFenceInfo(line: string): FenceInfo | undefined {
  const trimmedLine = line.trimStart();
  const character = trimmedLine[0];
  if (character !== '`' && character !== '~') {
    return undefined;
  }

  let length = 0;
  while (trimmedLine[length] === character) {
    length++;
  }
  return length >= 3 ? { character, length } : undefined;
}

function getHeadingTitle(line: string): string | undefined {
  const normalizedLine = line.endsWith('\r') ? line.slice(0, -1) : line;
  const indentation = getSpaceIndentation(normalizedLine);
  if (indentation === undefined || indentation > 3) {
    return undefined;
  }
  let index = indentation;
  if (normalizedLine[index] !== '#') {
    return undefined;
  }

  let hashCount = 0;
  while (normalizedLine[index] === '#' && hashCount < 6) {
    index++;
    hashCount++;
  }
  if (hashCount === 0 || !isHorizontalWhitespace(normalizedLine[index])) {
    return undefined;
  }

  while (isHorizontalWhitespace(normalizedLine[index])) {
    index++;
  }
  if (index >= normalizedLine.length) {
    return undefined;
  }

  let end = normalizedLine.length;
  while (isHorizontalWhitespace(normalizedLine[end - 1])) {
    end--;
  }

  let titleEnd = end;
  while (titleEnd > index && normalizedLine[titleEnd - 1] === '#') {
    titleEnd--;
  }
  if (titleEnd < end && isHorizontalWhitespace(normalizedLine[titleEnd - 1])) {
    while (isHorizontalWhitespace(normalizedLine[titleEnd - 1])) {
      titleEnd--;
    }
    end = titleEnd;
  }

  const title = normalizedLine.slice(index, end).toLowerCase();
  return DEFENSIVE_HEADING_NAMES.has(title) ? title : undefined;
}

function getMarkdownListItem(
  line: string,
  lineStart: number,
  lineEnd: number
): MarkdownListItem | undefined {
  const indentation = getSpaceIndentation(line);
  if (indentation === undefined) {
    return undefined;
  }

  let index = indentation;
  let digitCount = 0;
  const marker = line[index];
  if (marker === '-' || marker === '+' || marker === '*') {
    index++;
  } else {
    const numberStart = index;
    while (line[index] !== undefined && line[index]! >= '0' && line[index]! <= '9') {
      index++;
      digitCount++;
    }
    if (index === numberStart || (line[index] !== '.' && line[index] !== ')')) {
      return undefined;
    }
    index++;
  }

  return isHorizontalWhitespace(line[index])
    ? {
        indentation,
        range: { start: lineStart, end: lineEnd },
        safe: digitCount <= 9,
      }
    : undefined;
}

function hasTabIndentedListItem(line: string): boolean {
  let index = 0;
  let hasTab = false;
  while (isHorizontalWhitespace(line[index])) {
    hasTab ||= line[index] === '\t';
    index++;
  }
  if (!hasTab) {
    return false;
  }

  const marker = line[index];
  if (marker === '-' || marker === '+' || marker === '*') {
    return isHorizontalWhitespace(line[index + 1]);
  }

  const numberStart = index;
  while (line[index] !== undefined && line[index]! >= '0' && line[index]! <= '9') {
    index++;
  }
  return (
    index > numberStart &&
    (line[index] === '.' || line[index] === ')') &&
    isHorizontalWhitespace(line[index + 1])
  );
}

function isThematicBreak(line: string): boolean {
  const normalizedLine = line.endsWith('\r') ? line.slice(0, -1) : line;
  const indentation = getSpaceIndentation(normalizedLine);
  if (indentation === undefined || indentation > 3) {
    return false;
  }

  const marker = normalizedLine[indentation];
  if (marker !== '-' && marker !== '_' && marker !== '*') {
    return false;
  }

  let markerCount = 0;
  for (let index = indentation; index < normalizedLine.length; index++) {
    const character = normalizedLine[index];
    if (character === marker) {
      markerCount++;
    } else if (!isHorizontalWhitespace(character)) {
      return false;
    }
  }
  return markerCount >= 3;
}

function isSetextUnderline(line: string): boolean {
  const normalizedLine = line.endsWith('\r') ? line.slice(0, -1) : line;
  const indentation = getSpaceIndentation(normalizedLine);
  if (indentation === undefined || indentation > 3) {
    return false;
  }

  const marker = normalizedLine[indentation];
  if (marker !== '=' && marker !== '-') {
    return false;
  }

  let markerCount = 0;
  for (let index = indentation; index < normalizedLine.length; index++) {
    const character = normalizedLine[index];
    if (character === marker) {
      markerCount++;
    } else if (!isHorizontalWhitespace(character)) {
      return false;
    }
  }
  return markerCount > 0;
}

function findDefensiveListItems(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  let defensiveHeading = false;
  let listIndentStack: MarkdownListItem[] = [];
  let unsafeListContext = false;
  let insideFence = false;
  let fenceCharacter: FenceInfo['character'] | undefined;
  let fenceLength = 0;
  let lineStart = 0;

  const resetDefensiveContext = (): void => {
    defensiveHeading = false;
  };

  const resetListContext = (): void => {
    listIndentStack = [];
    unsafeListContext = false;
  };

  while (lineStart <= text.length) {
    const newlineIndex = text.indexOf('\n', lineStart);
    const lineEnd = newlineIndex === -1 ? text.length : newlineIndex;
    const line = text.slice(lineStart, lineEnd);
    const fence = getFenceInfo(line);

    if (insideFence) {
      const closesFence =
        fence !== undefined &&
        fence.character === fenceCharacter &&
        fence.length >= fenceLength &&
        line.trimStart().slice(fence.length).trim() === '';
      if (closesFence) {
        insideFence = false;
        fenceCharacter = undefined;
        fenceLength = 0;
      }
    } else if (fence !== undefined) {
      insideFence = true;
      fenceCharacter = fence.character;
      fenceLength = fence.length;
    } else {
      const headingTitle = getAnyHeadingTitle(line);
      if (isThematicBreak(line) || isSetextUnderline(line)) {
        resetDefensiveContext();
        resetListContext();
      } else if (headingTitle !== undefined) {
        const headingIndent = getSpaceIndentation(line);
        while (
          headingIndent !== undefined &&
          listIndentStack.length > 0 &&
          listIndentStack[listIndentStack.length - 1]!.indentation >= headingIndent
        ) {
          listIndentStack.pop();
        }
        const nestedHeading =
          listIndentStack.length > 0 ||
          (unsafeListContext && headingIndent !== undefined && headingIndent > 0);
        resetDefensiveContext();
        if (!nestedHeading) {
          unsafeListContext = false;
        }
        if (!nestedHeading && getHeadingTitle(line) !== undefined) {
          defensiveHeading = true;
        }
      } else {
        const item = getMarkdownListItem(line, lineStart, lineEnd);
        if (item !== undefined) {
          while (
            listIndentStack.length > 0 &&
            item.indentation <= listIndentStack[listIndentStack.length - 1]!.indentation
          ) {
            listIndentStack.pop();
          }
          listIndentStack.push(item);
          if (item.indentation === 0) {
            unsafeListContext = false;
          }
          if (
            defensiveHeading &&
            !unsafeListContext &&
            listIndentStack.length === 1 &&
            item.safe &&
            item.indentation <= 3
          ) {
            ranges.push(item.range);
          }
        } else if (hasTabIndentedListItem(line)) {
          unsafeListContext = true;
        }
      }
    }

    if (newlineIndex === -1) {
      break;
    }
    lineStart = newlineIndex + 1;
  }

  resetDefensiveContext();
  return ranges;
}

function getAnyHeadingTitle(line: string): string | undefined {
  const normalizedLine = line.endsWith('\r') ? line.slice(0, -1) : line;
  const indentation = getSpaceIndentation(normalizedLine);
  if (indentation === undefined || indentation > 3) {
    return undefined;
  }

  let index = indentation;
  if (normalizedLine[index] !== '#') {
    return undefined;
  }

  let hashCount = 0;
  while (normalizedLine[index] === '#' && hashCount < 6) {
    index++;
    hashCount++;
  }
  if (hashCount === 0) {
    return undefined;
  }

  const remainder = normalizedLine.slice(index);
  return remainder === '' || isHorizontalWhitespace(remainder[0]) ? remainder : undefined;
}

function normalizeText(text: string): NormalizedText {
  const characters: string[] = [];
  const sourceStarts: number[] = [];
  const sourceEnds: number[] = [];
  let index = 0;

  while (index < text.length) {
    if (/\s/.test(text[index]!)) {
      const start = index;
      index++;
      while (index < text.length && /\s/.test(text[index]!)) {
        index++;
      }
      characters.push(' ');
      sourceStarts.push(start);
      sourceEnds.push(index);
      continue;
    }

    characters.push(text[index]!);
    sourceStarts.push(index);
    sourceEnds.push(index + 1);
    index++;
  }

  return {
    value: characters.join(''),
    sourceStarts,
    sourceEnds,
  };
}

function isRangeWithinListItem(range: TextRange, listItems: readonly TextRange[]): boolean {
  return listItems.some((item) => range.start >= item.start && range.end <= item.end);
}

function hasUnexemptMatch(
  pattern: RegExp,
  candidate: string,
  listItems: readonly TextRange[],
  normalized?: NormalizedText
): boolean {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const globalPattern = new RegExp(pattern.source, flags);
  for (const match of candidate.matchAll(globalPattern)) {
    const matchIndex = match.index ?? 0;
    const matchText = match[0] ?? '';
    let range: TextRange;
    if (normalized === undefined) {
      range = { start: matchIndex, end: matchIndex + matchText.length };
    } else if (
      matchText.length > 0 &&
      matchIndex < normalized.sourceStarts.length &&
      matchIndex + matchText.length <= normalized.sourceEnds.length
    ) {
      range = {
        start: normalized.sourceStarts[matchIndex]!,
        end: normalized.sourceEnds[matchIndex + matchText.length - 1]!,
      };
    } else {
      return true;
    }

    if (!SUPPRESSION_PATTERN_SET.has(pattern) || !isRangeWithinListItem(range, listItems)) {
      return true;
    }
  }
  return false;
}

/**
 * Strip fenced code blocks from text before security scanning.
 * Code examples in instructions legitimately contain phrases that match
 * authority injection patterns (e.g., "don't flag", "skip validation").
 * Handles indented fences (common in triple-quoted content blocks).
 */
function stripFencedCodeBlocks(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  let pendingFence: string[] = [];
  let insideFence = false;
  let fenceCharacter = '';
  let fenceLength = 0;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    const renderedLine = index < lines.length - 1 ? `${line}\n` : line;
    const trimmedLine = line.trimStart();
    const currentCharacter = trimmedLine[0];
    let currentLength = 0;
    if (currentCharacter === '`' || currentCharacter === '~') {
      while (trimmedLine[currentLength] === currentCharacter) {
        currentLength += 1;
      }
    }
    const closesFence =
      insideFence &&
      currentCharacter === fenceCharacter &&
      currentLength >= fenceLength &&
      trimmedLine.slice(currentLength).trim() === '';
    const opensFence = !insideFence && currentLength >= 3;

    if (closesFence) {
      insideFence = false;
      pendingFence = [];
      fenceCharacter = '';
      fenceLength = 0;
    } else if (opensFence) {
      insideFence = true;
      fenceCharacter = currentCharacter!;
      fenceLength = currentLength;
      pendingFence.push(renderedLine);
    } else if (insideFence) {
      pendingFence.push(renderedLine);
    } else {
      output.push(renderedLine);
    }
  }

  if (insideFence) {
    output.push(...pendingFence);
  }
  return output.join('');
}

/**
 * PS011: Detect authority injection attempts in content.
 *
 * This rule identifies patterns commonly used in prompt injection attacks
 * where malicious content tries to establish false authority or override
 * existing safety measures by using authoritative-sounding language.
 */
export const authorityInjection: ValidationRule = {
  id: 'PS011',
  name: 'authority-injection',
  description: 'Detect authoritative override phrases that may indicate prompt injection',
  defaultSeverity: 'error',
  validate: (ctx) => {
    // Exclude skill resource files (bundled source code, not prompt instructions).
    walkText(
      ctx.ast,
      (text, loc) => {
        const strippedText = stripFencedCodeBlocks(text);
        const listItems = findDefensiveListItems(strippedText);
        const normalizedText = normalizeText(strippedText);
        for (const pattern of AUTHORITY_PATTERNS) {
          if (
            hasUnexemptMatch(pattern, strippedText, listItems) ||
            hasUnexemptMatch(pattern, normalizedText.value, listItems, normalizedText)
          ) {
            ctx.report({
              message: `Authority injection pattern detected: ${pattern.source}`,
              location: loc,
              suggestion:
                'Remove authoritative override language that could be used for prompt injection',
            });
          }
        }
      },
      { excludeProperties: ['resources'] }
    );
  },
};

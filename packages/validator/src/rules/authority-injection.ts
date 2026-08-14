import type { ValidationRule } from '../types.js';
import { walkText } from '../walker.js';

interface WarningSuppressionPattern {
  detection: RegExp;
  suppression: RegExp;
}

/**
 * Patterns that indicate attempts to inject authoritative override instructions.
 * These patterns are commonly used in prompt injection attacks to make AI models
 * believe they should override their existing instructions or safety measures.
 *
 * NOTE: All patterns use bounded quantifiers (e.g., \s{0,10}) instead of unbounded
 * ones (\s*, \s+) to prevent ReDoS (Regular Expression Denial of Service) attacks.
 * This ensures O(n) matching time even on adversarial inputs.
 */
const WARNING_SUPPRESSION_PATTERNS: WarningSuppressionPattern[] = [
  // Removed because it triggers false positives on valid agent instructions (e.g., "do not notify user")
  // {
  //   detection: /(?:DO\s{1,10}NOT|NEVER|DON'?T)\s{1,10}(?:WARN|ALERT|NOTIFY|FLAG|REPORT)/i,
  //   suppression: /(?:DO[ \t]{1,10}NOT|NEVER|DON'?T)[ \t]{1,10}(?:WARN|ALERT|NOTIFY|FLAG|REPORT)/i,
  // },
  {
    detection:
      /\b(?:DO\s{1,10}NOT|NEVER|DON'?T)\b\s{1,10}(?:PROVIDE|SHOW|DISPLAY|INCLUDE)\b\s{1,10}(?:SECURITY\s{1,10})?WARNINGS?\b/i,
    suppression:
      /\b(?:DO[ \t]{1,10}NOT|NEVER|DON'?T)\b[ \t]{1,10}(?:PROVIDE|SHOW|DISPLAY|INCLUDE)\b[ \t]{1,10}(?:SECURITY[ \t]{1,10})?WARNINGS?\b/i,
  },
  {
    detection: /\b(?:SUPPRESS|HIDE|DISABLE|REMOVE|SILENCE)\b\s{1,10}(?:ALL\s{1,10})?WARNINGS?\b/i,
    suppression:
      /\b(?:SUPPRESS|HIDE|DISABLE|REMOVE|SILENCE)\b[ \t]{1,10}(?:ALL[ \t]{1,10})?WARNINGS?\b/i,
  },
  {
    detection:
      /\b(?:SUPPRESS|HIDE|DISABLE|REMOVE|SILENCE)\b\s{1,10}(?:ALL\s{1,10})?(?:SECURITY\s{1,10})?(?:ALERTS?|NOTIFICATIONS?)\b/i,
    suppression:
      /\b(?:SUPPRESS|HIDE|DISABLE|REMOVE|SILENCE)\b[ \t]{1,10}(?:ALL[ \t]{1,10})?(?:SECURITY[ \t]{1,10})?(?:ALERTS?|NOTIFICATIONS?)\b/i,
  },
  {
    detection: /\bIGNORE\b\s{1,10}(?:ALL\s{1,10})?(?:SAFETY\s{1,10})?WARNINGS?\b/i,
    suppression: /\bIGNORE\b[ \t]{1,10}(?:ALL[ \t]{1,10})?(?:SAFETY[ \t]{1,10})?WARNINGS?\b/i,
  },
  {
    detection:
      /(?:^|[.!?:;]\s{0,10})\s{0,10}(?:[-*]\s{1,10})?(?:PLEASE\s{1,10})?\b(?:SKIP|BYPASS)\b\s{1,10}(?:CHECKS?|VALIDATION)\b/im,
    suppression:
      /(?:^|[.!?:;][ \t]{0,10})[ \t]{0,10}(?:[-*][ \t]{1,10})?(?:PLEASE[ \t]{1,10})?\b(?:SKIP|BYPASS)\b[ \t]{1,10}(?:CHECKS?|VALIDATION)\b/im,
  },
  {
    detection:
      /\b(?:SKIP|BYPASS)\b\s{1,10}(?:(?:ALL\s{1,10})(?:SAFETY\s{1,10})?|SAFETY\s{1,10})(?:CHECKS?|VALIDATION)\b/i,
    suppression:
      /\b(?:SKIP|BYPASS)\b[ \t]{1,10}(?:(?:ALL[ \t]{1,10})(?:SAFETY[ \t]{1,10})?|SAFETY[ \t]{1,10})(?:CHECKS?|VALIDATION)\b/i,
  },
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
  ...WARNING_SUPPRESSION_PATTERNS.map(({ detection }) => detection),

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

const SUPPRESSION_PATTERN_MAP = new Map(
  WARNING_SUPPRESSION_PATTERNS.map(({ detection, suppression }) => [detection, suppression])
);
// Every pattern is scanned twice per text node, so compiling the global variant
// once keeps validation cost proportional to the input, not the pattern count.
const GLOBAL_PATTERN_CACHE = new Map<RegExp, RegExp>();
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

function isFenceDelimiter(line: string): boolean {
  const trimmedLine = line.trimStart();
  const character = trimmedLine[0];
  if (character !== '`' && character !== '~') {
    return false;
  }

  let length = 0;
  while (trimmedLine[length] === character) {
    length++;
  }
  return length >= 3;
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
  let insideHtmlComment = false;
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

    // Only unterminated fences survive stripFencedCodeBlocks, so everything
    // after one stays fenced and never earns an exemption.
    if (!insideFence && isFenceDelimiter(line)) {
      insideFence = true;
    } else if (!insideFence) {
      const commentStart = line.indexOf('<!--');
      const commentEnd = line.indexOf('-->');
      if (insideHtmlComment) {
        resetDefensiveContext();
        resetListContext();
        if (commentEnd !== -1) {
          insideHtmlComment = false;
        }
      } else if (commentStart !== -1 || commentEnd !== -1) {
        resetDefensiveContext();
        resetListContext();
        insideHtmlComment = commentStart !== -1 && commentEnd < commentStart;
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
          if (!nestedHeading && isDefensiveHeadingTitle(headingTitle)) {
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
    }

    if (newlineIndex === -1) {
      break;
    }
    lineStart = newlineIndex + 1;
  }

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

  const remainder = normalizedLine.slice(index);
  return remainder === '' || isHorizontalWhitespace(remainder[0]) ? remainder : undefined;
}

function isDefensiveHeadingTitle(title: string): boolean {
  let start = 0;
  while (isHorizontalWhitespace(title[start])) {
    start++;
  }
  if (start >= title.length) {
    return false;
  }

  let end = title.length;
  while (isHorizontalWhitespace(title[end - 1])) {
    end--;
  }

  let titleEnd = end;
  while (titleEnd > start && title[titleEnd - 1] === '#') {
    titleEnd--;
  }
  if (titleEnd < end && isHorizontalWhitespace(title[titleEnd - 1])) {
    while (isHorizontalWhitespace(title[titleEnd - 1])) {
      titleEnd--;
    }
    end = titleEnd;
  }

  return DEFENSIVE_HEADING_NAMES.has(title.slice(start, end).toLowerCase());
}

function normalizeText(text: string): NormalizedText {
  const characters: string[] = [];
  const sourceStarts: number[] = [];
  const sourceEnds: number[] = [];
  let index = 0;

  while (index < text.length) {
    if (isHorizontalWhitespace(text[index])) {
      const start = index;
      index++;
      while (index < text.length && isHorizontalWhitespace(text[index])) {
        index++;
      }
      characters.push(' ');
      sourceStarts.push(start);
      sourceEnds.push(index);
      continue;
    }

    if (text[index] === '\r' && text[index + 1] === '\n') {
      characters.push('\n');
      sourceStarts.push(index);
      sourceEnds.push(index + 2);
      index += 2;
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

function getNormalizedRange(
  sourceRange: TextRange,
  normalized: NormalizedText
): TextRange | undefined {
  let startLow = 0;
  let startHigh = normalized.sourceStarts.length;
  while (startLow < startHigh) {
    const middle = startLow + Math.floor((startHigh - startLow) / 2);
    if (normalized.sourceStarts[middle]! < sourceRange.start) {
      startLow = middle + 1;
    } else {
      startHigh = middle;
    }
  }

  let endLow = startLow;
  let endHigh = normalized.sourceEnds.length;
  while (endLow < endHigh) {
    const middle = endLow + Math.floor((endHigh - endLow) / 2);
    if (normalized.sourceEnds[middle]! <= sourceRange.end) {
      endLow = middle + 1;
    } else {
      endHigh = middle;
    }
  }

  return startLow < endLow ? { start: startLow, end: endLow } : undefined;
}

function hasSuppressionMatchInSafeItem(
  suppressionPattern: RegExp,
  candidate: string,
  range: TextRange,
  listItems: readonly TextRange[],
  normalized?: NormalizedText
): boolean {
  let low = 0;
  let high = listItems.length;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (listItems[middle]!.end <= range.start) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  for (let index = low; index < listItems.length; index++) {
    const item = listItems[index]!;
    if (item.start >= range.end) {
      break;
    }

    const itemRange = normalized === undefined ? item : getNormalizedRange(item, normalized);
    if (
      itemRange !== undefined &&
      suppressionPattern.test(candidate.slice(itemRange.start, itemRange.end))
    ) {
      return true;
    }
  }
  return false;
}

function toGlobalPattern(pattern: RegExp): RegExp {
  const cached = GLOBAL_PATTERN_CACHE.get(pattern);
  if (cached !== undefined) {
    return cached;
  }

  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  // matchAll clones the pattern, so the cached instance keeps lastIndex at 0.
  const globalPattern = new RegExp(pattern.source, flags);
  GLOBAL_PATTERN_CACHE.set(pattern, globalPattern);
  return globalPattern;
}

function hasUnexemptMatch(
  pattern: RegExp,
  candidate: string,
  listItems: readonly TextRange[],
  normalized?: NormalizedText
): boolean {
  for (const match of candidate.matchAll(toGlobalPattern(pattern))) {
    const matchIndex = match.index ?? 0;
    const matchText = match[0] ?? '';
    let range: TextRange;
    if (normalized === undefined) {
      range = { start: matchIndex, end: matchIndex + matchText.length };
    } else {
      const matchEnd = matchIndex + matchText.length - 1;
      range = {
        start: normalized.sourceStarts[matchIndex]!,
        end: normalized.sourceEnds[matchEnd]!,
      };
    }

    const suppressionPattern = SUPPRESSION_PATTERN_MAP.get(pattern);
    if (
      suppressionPattern === undefined ||
      !suppressionPattern.test(matchText) ||
      !hasSuppressionMatchInSafeItem(suppressionPattern, candidate, range, listItems, normalized)
    ) {
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

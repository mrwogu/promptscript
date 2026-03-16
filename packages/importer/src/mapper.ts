import { type ScoredSection, classifyConfidence } from './confidence.js';
import type { MarkdownSection } from './parsers/markdown.js';

const IDENTITY_PATTERN = /\byou are\b/i;
const RESTRICTION_LIST_PATTERN = /^-\s*(never|don'?t|always|do not|avoid)\b/im;
const STANDARDS_LIST_PATTERN = /^-\s*(use|prefer|follow|ensure|require)\b/im;
const KNOWLEDGE_HEADINGS = /^(testing|commands|cli|scripts|build|setup|installation|development)$/i;
const RESTRICTION_HEADINGS = /^(don'?ts?|restrictions?|forbidden|rules?)$/i;

export function mapSections(sections: MarkdownSection[]): ScoredSection[] {
  return sections.map(classifySection);
}

function classifySection(section: MarkdownSection): ScoredSection {
  const { heading, content } = section;

  // Check identity pattern in content
  if (IDENTITY_PATTERN.test(content)) {
    return scored(section, 'identity', 0.9);
  }

  // Check heading-based classification
  if (heading && RESTRICTION_HEADINGS.test(heading)) {
    return scored(section, 'restrictions', 0.9);
  }

  if (heading && KNOWLEDGE_HEADINGS.test(heading)) {
    return scored(section, 'knowledge', 0.85);
  }

  // Check list-based classification
  const hasRestrictionPatterns = RESTRICTION_LIST_PATTERN.test(content);
  const hasStandardsPatterns = STANDARDS_LIST_PATTERN.test(content);

  if (hasRestrictionPatterns && hasStandardsPatterns) {
    // Mixed content — could be either, use MEDIUM confidence
    // Default to standards if more "Use/Prefer" than "Never/Don't"
    const restrictionCount = countMatches(content, RESTRICTION_LIST_PATTERN);
    const standardsCount = countMatches(content, STANDARDS_LIST_PATTERN);
    const block = restrictionCount > standardsCount ? 'restrictions' : 'standards';
    return scored(section, block, 0.6);
  }

  if (hasRestrictionPatterns) {
    return scored(section, 'restrictions', 0.85);
  }

  if (hasStandardsPatterns) {
    return scored(section, 'standards', 0.85);
  }

  // Fallback: unrecognized content
  return scored(section, 'context', 0.3);
}

function scored(section: MarkdownSection, targetBlock: string, confidence: number): ScoredSection {
  return {
    heading: section.heading,
    content: section.content,
    targetBlock,
    confidence,
    level: classifyConfidence(confidence),
  };
}

function countMatches(text: string, pattern: RegExp): number {
  const globalPattern = new RegExp(pattern.source, 'gim');
  return (text.match(globalPattern) ?? []).length;
}

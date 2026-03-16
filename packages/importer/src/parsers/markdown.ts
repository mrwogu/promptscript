export interface MarkdownSection {
  heading: string;
  level: number;
  content: string;
  rawLines: string[];
}

const HEADING_REGEX = /^(#{1,6})\s+(.+)$/;

export function parseMarkdownSections(content: string): MarkdownSection[] {
  if (!content.trim()) return [];

  const lines = content.split('\n');
  const sections: MarkdownSection[] = [];
  let currentHeading = '';
  let currentLevel = 0;
  let currentLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // Track code block boundaries
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      currentLines.push(line);
      continue;
    }

    // Only detect headings outside code blocks
    if (!inCodeBlock) {
      const match = HEADING_REGEX.exec(line);
      if (match) {
        // Save previous section if it has content
        if (currentLines.length > 0 || sections.length > 0 || currentHeading !== '') {
          sections.push(buildSection(currentHeading, currentLevel, currentLines));
        }
        currentHeading = match[2]!.trim();
        currentLevel = match[1]!.length;
        currentLines = [];
        continue;
      }
    }

    currentLines.push(line);
  }

  // Save the last section
  if (currentLines.length > 0 || currentHeading !== '') {
    sections.push(buildSection(currentHeading, currentLevel, currentLines));
  }

  // Handle case where there are no headings — treat entire content as preamble
  if (sections.length === 0 && content.trim()) {
    sections.push(buildSection('', 0, lines));
  }

  return sections;
}

function buildSection(heading: string, level: number, rawLines: string[]): MarkdownSection {
  return {
    heading,
    level,
    content: rawLines.join('\n').trim(),
    rawLines,
  };
}

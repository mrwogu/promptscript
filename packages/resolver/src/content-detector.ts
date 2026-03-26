export type ContentType = 'prs' | 'skill' | 'raw';

function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function stripFencedCodeBlocks(content: string): string {
  return content.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '');
}

function hasPrsIdentityBlock(content: string): boolean {
  const stripped = stripFencedCodeBlocks(content);
  return /^@identity\b/m.test(stripped);
}

function hasYamlFrontmatter(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('---\n') || trimmed.startsWith('---\r\n');
}

export function detectContentType(content: string): ContentType {
  const clean = stripBom(content);
  if (hasPrsIdentityBlock(clean)) return 'prs';
  if (hasYamlFrontmatter(clean)) return 'skill';
  return 'raw';
}

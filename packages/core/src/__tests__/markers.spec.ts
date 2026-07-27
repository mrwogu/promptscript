import { describe, expect, it } from 'vitest';
import {
  isGeneratedByPromptScript,
  stripFrontmatterMarkerLines,
  stripLeadingHtmlMarker,
  stripPromptScriptMarkers,
} from '../utils/markers.js';

const HTML_MARKER = '<!-- PromptScript 2026-03-22T16:36:39.660Z - do not edit -->';
const YAML_MARKER = '# promptscript-generated: 2026-03-22 | source: a.prs | target: claude';

describe('stripPromptScriptMarkers', () => {
  it('removes the HTML marker with trailing blank lines', () => {
    const content = `${HTML_MARKER}\n\n# Title`;

    expect(stripPromptScriptMarkers(content)).toBe('# Title');
  });

  it('removes the YAML marker from frontmatter', () => {
    const content = `---\n${YAML_MARKER}\nname: test\n---`;

    expect(stripPromptScriptMarkers(content)).toBe('---\nname: test\n---');
  });

  it('leaves content without markers untouched', () => {
    const content = '# Title\n\nBody';

    expect(stripPromptScriptMarkers(content)).toBe(content);
  });
});

describe('isGeneratedByPromptScript', () => {
  it('detects an HTML marker inserted after a title', () => {
    const content = `# Title\n\n${HTML_MARKER}\n\nBody`;

    expect(isGeneratedByPromptScript(content)).toBe(true);
  });

  it('detects a YAML marker inside frontmatter', () => {
    const content = `---\n${YAML_MARKER}\nname: test\n---\n\nBody`;

    expect(isGeneratedByPromptScript(content)).toBe(true);
  });

  it('ignores a marker quoted deep inside prose', () => {
    const content = `# Title\n\n${'filler\n'.repeat(10)}${HTML_MARKER}`;

    expect(isGeneratedByPromptScript(content)).toBe(false);
  });

  it('returns false for hand written content', () => {
    expect(isGeneratedByPromptScript('---\nname: test\n---\n\nBody')).toBe(false);
  });
});

describe('stripFrontmatterMarkerLines', () => {
  it('removes marker lines and keeps the remaining fields', () => {
    const frontmatter = `${YAML_MARKER}\nname: demo\ndescription: x`;

    expect(stripFrontmatterMarkerLines(frontmatter)).toBe('name: demo\ndescription: x');
  });

  it('keeps regular YAML comments', () => {
    const frontmatter = '# hand written note\nname: demo';

    expect(stripFrontmatterMarkerLines(frontmatter)).toBe(frontmatter);
  });
});

describe('stripLeadingHtmlMarker', () => {
  it('removes a marker at the top of the body', () => {
    const body = `${HTML_MARKER}\n\n# Demo`;

    expect(stripLeadingHtmlMarker(body)).toBe('# Demo');
  });

  it('keeps markers documented inside prose', () => {
    const body = `# Demo\n\nGenerated files start with ${HTML_MARKER}`;

    expect(stripLeadingHtmlMarker(body)).toBe(body);
  });
});

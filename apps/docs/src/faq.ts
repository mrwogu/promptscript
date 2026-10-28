// Homepage FAQ. One list feeds both the visible section and the FAQPage
// structured data, so answer engines quote the same text readers see.

export interface FaqItem {
  question: string;
  answer: string;
}

export const HOME_FAQ: readonly FaqItem[] = [
  {
    question: 'What is PromptScript?',
    answer:
      'PromptScript is an open-source compiler for AI coding agent configuration. You write instructions, skills, agents, MCP servers, hooks, and plugins in .prs files, and it generates the native files for 50 tools, such as CLAUDE.md, .github/copilot-instructions.md, and Cursor rules.',
  },
  {
    question: 'Which AI coding tools does it support?',
    answer:
      'It compiles to 50 targets, including Claude Code, GitHub Copilot, Cursor, Codex, Gemini CLI, Windsurf, Factory AI, and OpenCode. Each target gets the file layout and format that tool reads.',
  },
  {
    question: 'How is it different from a shared AGENTS.md file?',
    answer:
      'AGENTS.md is one file that some tools read. PromptScript is the source behind it: it adds inheritance across repositories, parameters, skills, agents, MCP servers, validation, and a security scan, and it writes AGENTS.md together with the formats of every other tool.',
  },
  {
    question: 'Can I start from the instruction files I already have?',
    answer:
      'Yes. prs import converts an existing CLAUDE.md, Copilot, Cursor, or AGENTS.md file, prs migrate imports a whole project, and the built-in promptscript skill lets your AI agent do the migration for you.',
  },
  {
    question: 'How do teams share one configuration?',
    answer:
      'Publish a Git registry with prs registry init and prs registry publish, then inherit it in every project with @inherit. Remote imports are pinned by commit and sha256 hash in promptscript.lock, and prs vendor sync copies them for offline builds.',
  },
  {
    question: 'Can IT roll out one configuration to every developer?',
    answer:
      'Yes. A system config at /etc/promptscript/config.yaml (or %ProgramData%\\promptscript\\config.yaml on Windows) provisions registry aliases and telemetry settings, a user config sits above it, and a project promptscript.yaml can extend a shared base file. Policies from the base are kept.',
  },
  {
    question: 'Can PromptScript manage prompts inside my applications?',
    answer:
      'Yes. With syntax 1.6.0 the @prompts block defines typed prompts, and the bundle target compiles them to content-hashed JSON. prs release promotes bundles through environments, prs approve records approvals of one exact hash, and prs governance codeowners writes the CODEOWNERS lines for reviewers.',
  },
  {
    question: 'Does PromptScript send my prompts anywhere?',
    answer:
      'No. Compilation runs on your machine or in your CI. Anonymous usage telemetry is on by default and never includes source, prompts, compiled output, file paths, or project names. Turn it off with prs telemetry disable or DO_NOT_TRACK=1.',
  },
  {
    question: 'Is PromptScript free?',
    answer:
      'Yes. PromptScript is open source under the MIT license. The CLI is published on npm as @promptscript/cli.',
  },
];

const escapeHtml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function faqHtml(items: readonly FaqItem[]): string {
  return items
    .map(
      (item) =>
        `<details class="home-faq__item"><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`
    )
    .join('\n');
}

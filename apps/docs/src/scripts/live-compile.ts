// Adds a "Compile" button next to every "Try in Playground" badge. The badge
// URL already carries the snippet and its imported files, so the reader sees
// the same native output the playground would produce, without leaving the page.
import LZString from 'lz-string';

export const LIVE_TARGETS = [
  { name: 'claude', label: 'Claude Code' },
  { name: 'github', label: 'GitHub Copilot' },
  { name: 'cursor', label: 'Cursor' },
] as const;

export interface SharedFile {
  path: string;
  content: string;
}

export interface SharedState {
  files: SharedFile[];
  entry: string;
}

export interface OutputFile {
  path: string;
  content: string;
  target: string | undefined;
}

function isSharedFile(value: unknown): value is SharedFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { path?: unknown }).path === 'string' &&
    typeof (value as { content?: unknown }).content === 'string'
  );
}

/** Reads the `s` state of a playground link, the same format the playground shares. */
export function decodeState(href: string): SharedState | undefined {
  const encoded = new URL(href, 'https://getpromptscript.dev').searchParams.get('s');
  if (!encoded) return undefined;
  try {
    const parsed: unknown = JSON.parse(LZString.decompressFromEncodedURIComponent(encoded) ?? '');
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    const { files, entry } = parsed as { files?: unknown; entry?: unknown };
    if (!Array.isArray(files) || files.length === 0 || !files.every(isSharedFile)) return undefined;
    return { files, entry: typeof entry === 'string' ? entry : files[0].path };
  } catch {
    return undefined;
  }
}

/** Output files of one target, main file first. */
export function filesForTarget(outputs: readonly OutputFile[], target: string): OutputFile[] {
  return outputs
    .filter((output) => output.target === target)
    .sort(
      (a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path)
    );
}

interface CompileSummary {
  success: boolean;
  outputs: OutputFile[];
  errors: string[];
}

async function compileState(state: SharedState): Promise<CompileSummary> {
  // Loaded on first click only, the compiler is the heavy part of the page.
  const { compile } = await import('@promptscript/browser-compiler');
  const result = await compile(
    new Map(state.files.map((file) => [file.path, file.content])),
    state.entry,
    { formatters: LIVE_TARGETS.map(({ name }) => ({ name })), bundledRegistry: true }
  );
  const outputs = [...result.outputs].map(([path, output]) => ({
    path,
    content: output.content,
    target: result.outputOwners?.get(path) ?? output.target,
  }));
  return { success: result.success, outputs, errors: result.errors.map((error) => error.message) };
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderFiles(files: readonly OutputFile[]): HTMLElement {
  const list = element('div', 'ps-compile-files');
  if (files.length === 0) {
    list.append(
      element('p', 'ps-compile-empty', 'This snippet produces no files for this target.')
    );
  }
  for (const file of files) {
    const item = element('div', 'ps-compile-file');
    const code = element('code', '', file.content);
    const pre = element('pre', '');
    pre.append(code);
    item.append(element('div', 'ps-compile-path', file.path), pre);
    list.append(item);
  }
  return list;
}

function renderResult(panel: HTMLElement, summary: CompileSummary): void {
  panel.replaceChildren();
  if (!summary.success) {
    panel.append(element('p', 'ps-compile-error', 'Compilation failed:'));
    panel.append(element('pre', 'ps-compile-error', summary.errors.join('\n')));
    return;
  }
  const tabs = element('div', 'ps-compile-tabs');
  tabs.setAttribute('role', 'tablist');
  const body = element('div', 'ps-compile-body');
  body.setAttribute('role', 'tabpanel');
  const buttons = LIVE_TARGETS.map(({ name, label }, index) => {
    const tab = element('button', 'ps-compile-tab', label);
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(index === 0));
    tab.addEventListener('click', () => {
      for (const other of buttons) other.setAttribute('aria-selected', String(other === tab));
      body.replaceChildren(renderFiles(filesForTarget(summary.outputs, name)));
    });
    return tab;
  });
  tabs.append(...buttons);
  body.append(renderFiles(filesForTarget(summary.outputs, LIVE_TARGETS[0].name)));
  panel.append(tabs, body);
}

export function enhanceSnippets(root: ParentNode): void {
  const links = root.querySelectorAll<HTMLAnchorElement>('a[href*="/playground/?s="]');
  for (const link of links) {
    // Badges for snippets that fail on purpose say so, skip those.
    if (link.querySelector('img')?.alt !== 'Try in Playground') continue;
    const state = decodeState(link.href);
    if (!state) continue;

    const button = element('button', 'ps-compile-button', 'Compile here');
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    const panel = element('div', 'ps-compile-panel not-content');
    panel.hidden = true;
    link.after(button);
    (link.closest('p') ?? button).after(panel);

    let compiled = false;
    button.addEventListener('click', async () => {
      panel.hidden = !panel.hidden;
      button.setAttribute('aria-expanded', String(!panel.hidden));
      if (compiled || panel.hidden) return;
      compiled = true;
      panel.replaceChildren(element('p', 'ps-compile-empty', 'Compiling...'));
      try {
        renderResult(panel, await compileState(state));
      } catch (error) {
        compiled = false;
        panel.replaceChildren(
          element('pre', 'ps-compile-error', error instanceof Error ? error.message : String(error))
        );
      }
    });
  }
}

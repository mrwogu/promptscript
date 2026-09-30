// @vitest-environment jsdom
import LZString from 'lz-string';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const compile = vi.fn();
vi.mock('@promptscript/browser-compiler', () => ({ compile }));

const { enhanceSnippets } = await import('./live-compile');

function badge(alt: string, state: unknown): string {
  const s = LZString.compressToEncodedURIComponent(JSON.stringify(state));
  return `<p><a href="https://getpromptscript.dev/playground/?s=${s}"><img alt="${alt}" /></a></p>`;
}

const STATE = {
  files: [{ path: 'example.prs', content: '@identity { "x" }' }],
  entry: 'example.prs',
};

function successResult(): unknown {
  return {
    success: true,
    errors: [],
    outputs: new Map([
      ['CLAUDE.md', { content: '# Claude' }],
      ['.github/copilot-instructions.md', { content: '# Copilot', target: 'github' }],
    ]),
    outputOwners: new Map([['CLAUDE.md', 'claude']]),
  };
}

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('enhanceSnippets', () => {
  beforeEach(() => {
    compile.mockReset();
    document.body.innerHTML = '';
  });

  it('adds a button only to working badges with a valid state', () => {
    // Arrange
    document.body.innerHTML =
      badge('Try in Playground', STATE) +
      badge('See the error in Playground', STATE) +
      '<p><a href="https://getpromptscript.dev/playground/?s=broken"><img alt="Try in Playground" /></a></p>';

    // Act
    enhanceSnippets(document);

    // Assert
    expect(document.querySelectorAll('.ps-compile-button')).toHaveLength(1);
    expect(document.querySelector<HTMLElement>('.ps-compile-panel')?.hidden).toBe(true);
  });

  it('compiles on first click and switches targets', async () => {
    // Arrange
    compile.mockResolvedValue(successResult());
    document.body.innerHTML = badge('Try in Playground', STATE);
    enhanceSnippets(document);
    const button = document.querySelector<HTMLButtonElement>('.ps-compile-button')!;

    // Act
    button.click();
    await settle();

    // Assert
    expect(compile).toHaveBeenCalledWith(
      new Map([['example.prs', '@identity { "x" }']]),
      'example.prs',
      {
        formatters: [{ name: 'claude' }, { name: 'github' }, { name: 'cursor' }],
        bundledRegistry: true,
      }
    );
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const paths = (): string[] =>
      [...document.querySelectorAll('.ps-compile-path')].map((node) => node.textContent ?? '');
    expect(paths()).toEqual(['CLAUDE.md']);

    const tabs = document.querySelectorAll<HTMLButtonElement>('.ps-compile-tab');
    tabs[1]!.click();
    expect(paths()).toEqual(['.github/copilot-instructions.md']);
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('false');

    tabs[2]!.click();
    expect(document.querySelector('.ps-compile-empty')?.textContent).toContain('no files');
  });

  it('hides the panel on second click without compiling again', async () => {
    compile.mockResolvedValue(successResult());
    document.body.innerHTML = badge('Try in Playground', STATE);
    enhanceSnippets(document);
    const button = document.querySelector<HTMLButtonElement>('.ps-compile-button')!;
    const panel = document.querySelector<HTMLElement>('.ps-compile-panel')!;

    button.click();
    await settle();
    button.click();
    button.click();
    await settle();

    expect(compile).toHaveBeenCalledTimes(1);
    expect(panel.hidden).toBe(false);
  });

  it('shows compiler errors', async () => {
    compile.mockResolvedValue({
      success: false,
      errors: [{ message: 'Unknown block @nope' }],
      outputs: new Map(),
    });
    document.body.innerHTML = badge('Try in Playground', STATE);
    enhanceSnippets(document);

    document.querySelector<HTMLButtonElement>('.ps-compile-button')!.click();
    await settle();

    expect(document.querySelector('pre.ps-compile-error')?.textContent).toBe('Unknown block @nope');
  });

  it('shows a thrown error and retries on the next open', async () => {
    compile.mockRejectedValueOnce(new Error('chunk failed')).mockResolvedValue(successResult());
    document.body.innerHTML = badge('Try in Playground', STATE);
    enhanceSnippets(document);
    const button = document.querySelector<HTMLButtonElement>('.ps-compile-button')!;

    button.click();
    await settle();
    expect(document.querySelector('.ps-compile-error')?.textContent).toBe('chunk failed');

    button.click();
    button.click();
    await settle();
    expect(compile).toHaveBeenCalledTimes(2);
    expect(document.querySelector('.ps-compile-path')?.textContent).toBe('CLAUDE.md');
  });
});

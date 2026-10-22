import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import type { CompileResult, CompileWarning } from '@promptscript/browser-compiler';
import { OutputPanel } from '../OutputPanel';
import { usePlaygroundStore } from '../../store';

function buildResult(warnings: CompileWarning[]): CompileResult {
  return {
    success: true,
    outputs: new Map([
      ['CLAUDE.md', { path: 'CLAUDE.md', content: '# CLAUDE.md', formatter: 'claude' }],
    ]),
    outputOwners: new Map([['CLAUDE.md', 'claude']]),
    errors: [],
    warnings,
    stats: { resolveTime: 1, validateTime: 1, formatTime: 1, totalTime: 3 },
  };
}

const collisionWarning: CompileWarning = {
  ruleId: 'PS4001',
  ruleName: 'output-path-collision',
  severity: 'warning',
  message: "Output path 'AGENTS.md' is written by both 'github' and 'factory'.",
  suggestion: 'Configure distinct output paths for these formatters.',
};

describe('OutputPanel warnings', () => {
  beforeEach(() => {
    usePlaygroundStore.setState({
      activeFormatter: 'claude',
      isCompiling: false,
      compileResult: buildResult([]),
    });
  });

  it('renders no warning summary when compilation reports none', () => {
    render(<OutputPanel />);

    expect(screen.queryByText(/warning/)).toBeNull();
  });

  it('summarizes warnings and reveals details on demand', () => {
    usePlaygroundStore.setState({ compileResult: buildResult([collisionWarning]) });

    render(<OutputPanel />);
    const summary = screen.getByRole('button', { name: /1 warning/ });

    expect(summary).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('[PS4001]')).toBeNull();

    fireEvent.click(summary);

    expect(summary).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('[PS4001]')).toBeInTheDocument();
    expect(screen.getByText(/written by both/)).toBeInTheDocument();
    expect(screen.getByText(/Configure distinct output paths/)).toBeInTheDocument();
  });

  it('reports the source location of a located warning', () => {
    const locatedWarning: CompileWarning = {
      ruleId: 'PS018',
      ruleName: 'syntax-version-compat',
      severity: 'warning',
      message: 'Resolved blocks require syntax 1.5.0.',
      location: { file: 'project.prs', line: 3, column: 5, offset: 42 },
    };
    usePlaygroundStore.setState({ compileResult: buildResult([locatedWarning]) });

    render(<OutputPanel />);
    fireEvent.click(screen.getByRole('button', { name: /1 warning/ }));

    expect(screen.getByText('project.prs:3:5')).toBeInTheDocument();
  });

  it('hides the summary while a compilation is running', () => {
    usePlaygroundStore.setState({
      isCompiling: true,
      compileResult: buildResult([collisionWarning]),
    });

    render(<OutputPanel />);

    expect(screen.queryByRole('button', { name: /1 warning/ })).toBeNull();
  });
});

const INDEX = '{"prompts":["support-reply"]}';
const BUNDLE = '{"key":"support-reply"}';

/** Enable a target, make it the active tab and optionally give it a compile result. */
function arrange(
  target: 'aider' | 'bundle' | 'claude',
  compileResult?: Partial<CompileResult>
): void {
  act(() => {
    usePlaygroundStore.getState().setTargetEnabled(target, true);
    usePlaygroundStore.setState({
      activeFormatter: target,
      isCompiling: false,
      ...(compileResult && { compileResult: { ...buildResult([]), ...compileResult } }),
    });
  });
}

function bundleResult(): Partial<CompileResult> {
  const paths = { 'prompts/index.json': INDEX, 'prompts/support-reply.json': BUNDLE };
  return {
    outputs: new Map(
      Object.entries(paths).map(([path, content]) => [path, { path, content, formatter: 'bundle' }])
    ),
    outputOwners: new Map(Object.keys(paths).map((path) => [path, 'bundle'])),
  };
}

function failedResult(message: string, outputs?: CompileResult['outputs']): Partial<CompileResult> {
  return {
    success: false,
    errors: [{ name: 'CompileError', code: 'PS0000', message }],
    ...(outputs && { outputs }),
  };
}

describe('OutputPanel target tabs', () => {
  afterEach(() => {
    act(() => {
      usePlaygroundStore.getState().setTargetEnabled('aider', false);
      usePlaygroundStore.getState().setTargetEnabled('bundle', false);
    });
  });

  it('gives a tab to a catalog target the old list did not know', () => {
    arrange('aider');

    render(<OutputPanel />);

    expect(screen.getByRole('tab', { name: /Aider/ })).toBeInTheDocument();
  });

  it('switches the active formatter when a tab is clicked', () => {
    arrange('aider');
    act(() => usePlaygroundStore.setState({ activeFormatter: 'claude' }));
    render(<OutputPanel />);

    fireEvent.click(screen.getByRole('tab', { name: /Aider/ }));

    expect(usePlaygroundStore.getState().activeFormatter).toBe('aider');
  });

  it('shows the bundle files and the JSON as written', () => {
    arrange('bundle', bundleResult());

    render(<OutputPanel />);

    expect(screen.getByRole('tab', { name: /Bundle/ })).toBeInTheDocument();
    expect(screen.getByTitle('prompts/index.json')).toBeInTheDocument();
    expect(screen.getByText(INDEX)).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('prompts/support-reply.json'));

    expect(screen.getByText(BUNDLE)).toBeInTheDocument();
  });

  it('switches between the file tree and file tabs', () => {
    arrange('bundle', bundleResult());
    render(<OutputPanel />);

    fireEvent.click(screen.getByTitle('Switch to tabs'));
    fireEvent.click(screen.getByTitle('prompts/support-reply.json'));

    expect(screen.getByText(BUNDLE)).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Switch to tree'));

    expect(screen.getByText('Output (2)')).toBeInTheDocument();
  });
});

describe('OutputPanel failed compiles', () => {
  it('lists the errors and keeps the files that other targets produced', () => {
    arrange('claude', failedResult('bundle broke'));

    render(<OutputPanel />);

    expect(screen.getByText('Compilation Failed')).toBeInTheDocument();
    expect(screen.getByText(/bundle broke/)).toBeInTheDocument();
    expect(screen.getByText('# CLAUDE.md')).toBeInTheDocument();
  });

  it('shows only the errors when no target produced a file', () => {
    arrange('claude', failedResult('all broke', new Map()));

    render(<OutputPanel />);

    expect(screen.getByText(/all broke/)).toBeInTheDocument();
    expect(screen.queryByText('# CLAUDE.md')).toBeNull();
  });
});

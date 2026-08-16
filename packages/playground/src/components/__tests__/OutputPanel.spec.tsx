import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

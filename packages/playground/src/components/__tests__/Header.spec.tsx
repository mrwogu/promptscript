import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CompileResult, CompileWarning } from '@promptscript/browser-compiler';
import { Header } from '../Header';
import { usePlaygroundStore } from '../../store';

function buildResult(warnings: CompileWarning[]): CompileResult {
  return {
    success: true,
    outputs: new Map(),
    outputOwners: new Map(),
    errors: [],
    warnings,
    stats: { resolveTime: 1, validateTime: 1, formatTime: 1, totalTime: 3 },
  };
}

const warning: CompileWarning = {
  ruleId: 'PS4001',
  ruleName: 'output-path-collision',
  severity: 'warning',
  message: "Output path 'AGENTS.md' is written by both 'github' and 'factory'.",
};

describe('Header compilation status', () => {
  beforeEach(() => {
    usePlaygroundStore.setState({ isCompiling: false, compileResult: buildResult([]) });
  });

  it('reports success without a warning count when there are none', () => {
    render(<Header />);

    expect(screen.getByText(/Compiled in/)).toBeInTheDocument();
    expect(screen.queryByText(/warning/)).toBeNull();
  });

  it('counts warnings alongside a successful compilation', () => {
    usePlaygroundStore.setState({ compileResult: buildResult([warning, warning]) });

    render(<Header />);

    expect(screen.getByText(/Compiled in/)).toBeInTheDocument();
    expect(screen.getByText('2 warnings')).toBeInTheDocument();
  });

  it('uses the singular form for one warning', () => {
    usePlaygroundStore.setState({ compileResult: buildResult([warning]) });

    render(<Header />);

    expect(screen.getByText('1 warning')).toBeInTheDocument();
  });

  it('omits the count while a compilation is running', () => {
    usePlaygroundStore.setState({ isCompiling: true, compileResult: buildResult([warning]) });

    render(<Header />);

    expect(screen.getByText('Compiling...')).toBeInTheDocument();
    expect(screen.queryByText('1 warning')).toBeNull();
  });
});

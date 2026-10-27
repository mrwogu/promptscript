import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The CLI module registers every command and shared flag at import time.
 *
 * Loading it covers the registration wiring, and rendering each command's
 * help proves the shared `--resources` option is present on both the
 * compile and build commands with the shared parser.
 */
describe('cli module wiring', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes the program runner after registering commands', async () => {
    const cli = await import('../cli.js');
    expect(typeof cli.run).toBe('function');
  });

  it.each(['compile', 'build'])('registers --resources on the %s command', async (command) => {
    const { run } = await import('../cli.js');

    // --help makes commander print the option list and call process.exit;
    // both are stubbed so the call resolves without side effects.
    const chunks: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      chunks.push(String(chunk));
      return true;
    });
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await run(['node', 'prs', command, '--help']);

    // Commander wraps option descriptions to the terminal width, so compare
    // against whitespace-normalized help text.
    const help = chunks.join('').replace(/\s+/g, ' ');
    expect(help).toContain('--resources <items>');
    expect(help).toContain('Compile only these resources');
  });

  // The release gates call the policy evaluators themselves; no flag may get around them.
  it.each([['check'], ['release', 'promote'], ['release', 'rollback'], ['release', 'status']])(
    'defines no option that skips a check on %s',
    async (...command) => {
      const { run } = await import('../cli.js');
      const chunks: string[] = [];
      vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        chunks.push(String(chunk));
        return true;
      });
      // Throwing stops Commander after the help, so no command runs.
      vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('exit');
      });

      await run(['node', 'prs', ...command, '--help']).catch(() => undefined);

      const help = chunks.join('');
      expect(help).toContain(`Usage: prs ${command.join(' ')}`);
      for (const flag of ['--skip-policies', '--ignore-hashes', '--force', '--no-gates']) {
        expect(help).not.toContain(flag);
      }
    }
  );
});

import { useCallback, useRef, useEffect } from 'react';
import { compile, type CompileResult } from '@promptscript/browser-compiler';
import { isPromptTarget } from '@promptscript/core';
import { useShallow } from 'zustand/react/shallow';
import { usePlaygroundStore, selectFilesAsMap, type FormatterName } from '../store';

const DEBOUNCE_MS = 300;

/**
 * Find the entry file for compilation.
 * The entry file is the one containing @meta block, or 'project.prs' as fallback.
 */
function findEntryFile(files: Record<string, string>): string {
  const paths = Object.keys(files);

  // Check for project.prs (exact or in subdirectory)
  const projectFile = paths.find((p) => p === 'project.prs' || p.endsWith('/project.prs'));
  if (projectFile) return projectFile;

  // Look for any file with @meta block
  for (const path of paths) {
    if (path.endsWith('.prs') && files[path]?.includes('@meta')) {
      return path;
    }
  }

  // Fallback to first .prs file
  const firstPrs = paths.find((p) => p.endsWith('.prs'));
  if (firstPrs) return firstPrs;

  return 'project.prs';
}

interface LocatedMessage {
  message: string;
  location?: { file?: string; line?: number; column?: number };
}

function failedResult(error: unknown): CompileResult {
  return {
    success: false,
    outputs: new Map(),
    outputOwners: new Map(),
    errors: [
      {
        name: 'CompileError',
        code: 'PS0000',
        message: error instanceof Error ? error.message : String(error),
      },
    ],
    warnings: [],
    stats: { resolveTime: 0, validateTime: 0, formatTime: 0, totalTime: 0 },
  };
}

/** Both compiles run the same validator, so the same message can come back twice. */
function dedupe<T extends LocatedMessage>(items: T[], idOf: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const { file, line, column } = item.location ?? {};
    const key = [idOf(item), item.message, file, line, column].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeResults(results: CompileResult[]): CompileResult {
  const slowest = (time: (r: CompileResult) => number): number => Math.max(...results.map(time));
  return {
    success: results.every((r) => r.success),
    outputs: new Map(results.flatMap((r) => [...r.outputs])),
    outputOwners: new Map(results.flatMap((r) => [...(r.outputOwners ?? [])])),
    errors: dedupe(
      results.flatMap((r) => r.errors),
      (e) => e.code
    ),
    warnings: dedupe(
      results.flatMap((r) => r.warnings),
      (w) => w.ruleId
    ),
    stats: {
      resolveTime: slowest((r) => r.stats.resolveTime),
      validateTime: slowest((r) => r.stats.validateTime),
      formatTime: slowest((r) => r.stats.formatTime),
      totalTime: slowest((r) => r.stats.totalTime),
    },
  };
}

export function useCompiler() {
  const files = usePlaygroundStore(useShallow(selectFilesAsMap));
  const config = usePlaygroundStore((s) => s.config);
  const setCompiling = usePlaygroundStore((s) => s.setCompiling);
  const setCompileResult = usePlaygroundStore((s) => s.setCompileResult);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCompileKey = useRef<string>('');

  const doCompile = useCallback(async () => {
    // Build compile key from files + config to detect changes
    const compileKey = JSON.stringify({ files, config });
    if (compileKey === lastCompileKey.current) return;
    lastCompileKey.current = compileKey;

    // Build enabled formatters list with their configs
    const enabledFormatters = (
      Object.entries(config.targets) as [
        FormatterName,
        {
          enabled: boolean;
          version?: string;
          convention?: string;
          rulesMode?: 'monolith' | 'split';
        },
      ][]
    )
      .filter(([, settings]) => settings.enabled)
      .map(([name, settings]) => ({
        name,
        config:
          settings.version || settings.convention || settings.rulesMode
            ? {
                ...(settings.version && { version: settings.version }),
                ...(settings.convention && { convention: settings.convention }),
                ...(settings.rulesMode && { rulesMode: settings.rulesMode }),
              }
            : undefined,
      }));

    // If no formatters enabled, don't compile
    if (enabledFormatters.length === 0) {
      setCompileResult({
        success: true,
        outputs: new Map(),
        outputOwners: new Map(),
        errors: [],
        warnings: [],
        stats: { resolveTime: 0, validateTime: 0, formatTime: 0, totalTime: 0 },
      });
      return;
    }

    const entryFile = findEntryFile(files);
    setCompiling(true);
    try {
      const run = async (
        formatters: typeof enabledFormatters,
        envVars: Record<string, string>
      ): Promise<CompileResult> => {
        try {
          return await compile(files, entryFile, {
            bundledRegistry: true,
            formatters,
            prettier: {
              tabWidth: config.formatting.tabWidth,
              proseWrap: config.formatting.proseWrap,
              printWidth: config.formatting.printWidth,
            },
            envVars,
          });
        } catch (error) {
          console.error('Compilation error:', error);
          return failedResult(error);
        }
      };

      // Prompt targets refuse environment variables, so they get their own
      // pass without them. This keeps ${VAR} as text in bundles, like the CLI.
      const { envVars } = config;
      const coding = enabledFormatters.filter((f) => !isPromptTarget(f.name));
      const prompts = enabledFormatters.filter((f) => isPromptTarget(f.name));
      const passes =
        Object.keys(envVars).length === 0
          ? [run(enabledFormatters, envVars)]
          : [
              ...(coding.length > 0 ? [run(coding, envVars)] : []),
              ...(prompts.length > 0 ? [run(prompts, {})] : []),
            ];
      setCompileResult(mergeResults(await Promise.all(passes)));
    } finally {
      setCompiling(false);
    }
  }, [files, config, setCompiling, setCompileResult]);

  // Debounced compile on file changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      doCompile();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [doCompile]);

  // Recompile when config changes (immediate, no debounce)
  useEffect(() => {
    doCompile();
  }, [config]);

  return { compile: doCompile };
}

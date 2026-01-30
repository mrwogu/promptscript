import { useCallback, useRef, useEffect } from 'react';
import { compile } from '@promptscript/browser-compiler';
import { usePlaygroundStore, selectFilesAsMap, type FormatterName } from '../store';

const DEBOUNCE_MS = 300;

export function useCompiler() {
  const files = usePlaygroundStore(selectFilesAsMap);
  const activeFile = usePlaygroundStore((s) => s.activeFile);
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
        { enabled: boolean; version?: string; convention?: string },
      ][]
    )
      .filter(([, settings]) => settings.enabled)
      .map(([name, settings]) => ({
        name,
        config:
          settings.version || settings.convention
            ? {
                ...(settings.version && { version: settings.version }),
                ...(settings.convention && { convention: settings.convention }),
              }
            : undefined,
      }));

    // If no formatters enabled, don't compile
    if (enabledFormatters.length === 0) {
      setCompileResult({
        success: true,
        outputs: new Map(),
        errors: [],
        warnings: [],
        stats: { resolveTime: 0, validateTime: 0, formatTime: 0, totalTime: 0 },
      });
      return;
    }

    setCompiling(true);
    try {
      const result = await compile(files, activeFile, {
        bundledRegistry: true,
        formatters: enabledFormatters,
        prettier: {
          tabWidth: config.formatting.tabWidth,
          proseWrap: config.formatting.proseWrap,
          printWidth: config.formatting.printWidth,
        },
        envVars: config.envVars,
      });
      setCompileResult(result);
    } catch (error) {
      console.error('Compilation error:', error);
      setCompileResult({
        success: false,
        outputs: new Map(),
        errors: [
          {
            name: 'CompileError',
            code: 'PS0000',
            message: error instanceof Error ? error.message : String(error),
          },
        ],
        warnings: [],
        stats: {
          resolveTime: 0,
          validateTime: 0,
          formatTime: 0,
          totalTime: 0,
        },
      });
    } finally {
      setCompiling(false);
    }
  }, [files, activeFile, config, setCompiling, setCompileResult]);

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

import { useState } from 'react';
import { usePlaygroundStore } from '../store';
import { useUrlState } from '../hooks/useUrlState';
import { VERSION, GITHUB_URL } from '../constants';

export function Header() {
  const isCompiling = usePlaygroundStore((s) => s.isCompiling);
  const compileResult = usePlaygroundStore((s) => s.compileResult);
  const showExamples = usePlaygroundStore((s) => s.showExamples);
  const setShowExamples = usePlaygroundStore((s) => s.setShowExamples);
  const showConfig = usePlaygroundStore((s) => s.showConfig);
  const setShowConfig = usePlaygroundStore((s) => s.setShowConfig);
  const showEnvVars = usePlaygroundStore((s) => s.showEnvVars);
  const setShowEnvVars = usePlaygroundStore((s) => s.setShowEnvVars);
  const envVarsCount = Object.keys(usePlaygroundStore((s) => s.config.envVars)).length;
  const { handleShare } = useUrlState();

  const [showCopied, setShowCopied] = useState(false);

  const hasErrors = compileResult && !compileResult.success;
  const stats = compileResult?.stats;

  const onShare = async () => {
    const success = await handleShare();
    if (success) {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-ps-surface border-b border-ps-border">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-ps-primary">PRS</span>
          <span>PromptScript Playground</span>
        </h1>
        <span className="text-xs text-gray-500">v{VERSION}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm">
          {isCompiling ? (
            <>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-gray-400">Compiling...</span>
            </>
          ) : hasErrors ? (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-red-400">
                {compileResult.errors.length} error
                {compileResult.errors.length !== 1 ? 's' : ''}
              </span>
            </>
          ) : compileResult ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-green-400">Compiled in {stats?.totalTime}ms</span>
            </>
          ) : null}
        </div>

        {/* Config button */}
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
            showConfig ? 'bg-ps-primary text-white' : 'bg-ps-bg hover:bg-ps-surface text-gray-300'
          }`}
          title="Configuration"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Config
        </button>

        {/* Env vars button */}
        <button
          onClick={() => setShowEnvVars(!showEnvVars)}
          className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
            showEnvVars ? 'bg-ps-primary text-white' : 'bg-ps-bg hover:bg-ps-surface text-gray-300'
          }`}
          title="Environment Variables"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Env
          {envVarsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-indigo-500 rounded-full">
              {envVarsCount}
            </span>
          )}
        </button>

        {/* Examples button */}
        <button
          onClick={() => setShowExamples(!showExamples)}
          className={`px-3 py-1 text-sm rounded ${
            showExamples ? 'bg-ps-primary text-white' : 'bg-ps-bg hover:bg-ps-surface text-gray-300'
          }`}
        >
          Examples
        </button>

        {/* Share button */}
        <button
          onClick={onShare}
          className="px-3 py-1 text-sm bg-ps-primary hover:bg-ps-secondary rounded text-white relative"
        >
          {showCopied ? 'Copied!' : 'Share'}
        </button>

        {/* GitHub link */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </header>
  );
}

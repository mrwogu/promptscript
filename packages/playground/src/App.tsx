import { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { FileTabs } from './components/FileTabs';
import { Editor } from './components/Editor';
import { OutputPanel } from './components/OutputPanel';
import { ExampleGallery } from './components/ExampleGallery';
import { ConfigPanel } from './components/ConfigPanel';
import { EnvVarsPanel } from './components/EnvVarsPanel';
import { useCompiler } from './hooks/useCompiler';
import { useUrlState } from './hooks/useUrlState';
import { usePlaygroundStore } from './store';

function PlaygroundLayout() {
  // Initialize compiler hook
  const { compile: doCompile } = useCompiler();
  const { handleShare } = useUrlState();

  const showExamples = usePlaygroundStore((s) => s.showExamples);
  const setShowExamples = usePlaygroundStore((s) => s.setShowExamples);

  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showMobileBanner, setShowMobileBanner] = useState(false);

  // Onboarding: show examples on first visit
  useEffect(() => {
    const visited = localStorage.getItem('prs-playground-visited');
    const hasUrlState = window.location.search.length > 0 || window.location.hash.length > 1;
    if (!visited && !hasUrlState) {
      setShowExamples(true);
      localStorage.setItem('prs-playground-visited', '1');
    }
  }, [setShowExamples]);

  // Mobile detection
  useEffect(() => {
    const check = () => {
      if (window.innerWidth < 768) {
        const dismissed = sessionStorage.getItem('prs-mobile-dismissed');
        if (!dismissed) setShowMobileBanner(true);
      } else {
        setShowMobileBanner(false);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        doCompile();
      } else if (mod && e.key === 's' && e.shiftKey) {
        e.preventDefault();
        handleShare();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [doCompile, handleShare]);

  // Resizable panel drag handling
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const pct = (e.clientX / window.innerWidth) * 100;
      setLeftWidth(Math.min(80, Math.max(20, pct)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const dismissMobile = () => {
    setShowMobileBanner(false);
    sessionStorage.setItem('prs-mobile-dismissed', '1');
  };

  return (
    <div className="h-screen flex flex-col bg-ps-bg">
      <Header />

      {/* Mobile overlay */}
      {showMobileBanner && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-ps-surface rounded-lg p-6 max-w-sm text-center">
            <h2 className="text-lg font-semibold text-white mb-2">Desktop Recommended</h2>
            <p className="text-gray-400 text-sm mb-4">
              The playground works best on larger screens with a keyboard.
            </p>
            <button
              onClick={dismissMobile}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        {/* Editor panel */}
        <div className="flex flex-col border-r border-ps-border" style={{ width: `${leftWidth}%` }}>
          <FileTabs />
          <div className="flex-1">
            <Editor />
          </div>
        </div>

        {/* Resizable splitter */}
        <div
          className="w-1 hover:w-1 bg-ps-border hover:bg-ps-primary cursor-col-resize flex-shrink-0 transition-colors"
          onMouseDown={handleMouseDown}
          style={isDragging ? { backgroundColor: 'var(--ps-primary, #6366f1)' } : undefined}
        />

        {/* Output panel */}
        <div className="flex flex-col" style={{ width: `${100 - leftWidth}%` }}>
          <OutputPanel />
        </div>
      </main>

      {/* Modals */}
      {showExamples && <ExampleGallery />}
      <ConfigPanel />
      <EnvVarsPanel />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <PlaygroundLayout />
    </ErrorBoundary>
  );
}

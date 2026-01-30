import { Header } from './components/Header';
import { FileTabs } from './components/FileTabs';
import { Editor } from './components/Editor';
import { OutputPanel } from './components/OutputPanel';
import { ExampleGallery } from './components/ExampleGallery';
import { ConfigPanel } from './components/ConfigPanel';
import { EnvVarsPanel } from './components/EnvVarsPanel';
import { useCompiler } from './hooks/useCompiler';
import { usePlaygroundStore } from './store';

export function App() {
  // Initialize compiler hook
  useCompiler();

  const showExamples = usePlaygroundStore((s) => s.showExamples);

  return (
    <div className="h-screen flex flex-col bg-ps-bg">
      <Header />

      <main className="flex-1 flex overflow-hidden">
        {/* Editor panel */}
        <div className="w-1/2 flex flex-col border-r border-ps-border">
          <FileTabs />
          <div className="flex-1">
            <Editor />
          </div>
        </div>

        {/* Output panel */}
        <div className="w-1/2 flex flex-col">
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

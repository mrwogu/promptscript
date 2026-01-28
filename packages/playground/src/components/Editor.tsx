import { useRef } from 'react';
import MonacoEditor, { type Monaco, type OnMount } from '@monaco-editor/react';
import { usePlaygroundStore, selectActiveFileContent } from '../store';
import {
  registerPrsLanguage,
  createPrsCompletionProvider,
  PRS_LANGUAGE_ID,
} from '../utils/prs-language';

export function Editor() {
  const activeFile = usePlaygroundStore((s) => s.activeFile);
  const content = usePlaygroundStore(selectActiveFileContent);
  const updateFile = usePlaygroundStore((s) => s.updateFile);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorWillMount = (monaco: Monaco) => {
    // Register PRS language before editor mounts
    registerPrsLanguage(monaco);

    // Register completion provider
    monaco.languages.registerCompletionItemProvider(
      PRS_LANGUAGE_ID,
      createPrsCompletionProvider(monaco)
    );

    monacoRef.current = monaco;
  };

  const handleEditorDidMount: OnMount = (editor) => {
    // Focus editor when mounted
    editor.focus();
  };

  return (
    <div className="h-full">
      <MonacoEditor
        height="100%"
        language={PRS_LANGUAGE_ID}
        theme="prs-dark"
        value={content}
        onChange={(value) => {
          if (value !== undefined) {
            updateFile(activeFile, value);
          }
        }}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          tabSize: 2,
          wordWrap: 'on',
          automaticLayout: true,
          padding: { top: 12 },
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            strings: false,
            comments: false,
          },
        }}
      />
    </div>
  );
}

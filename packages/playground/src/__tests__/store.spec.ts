import { describe, it, expect, beforeEach } from 'vitest';
import {
  usePlaygroundStore,
  selectFilesAsMap,
  selectActiveFileContent,
  selectEnabledTargets,
  selectOutputsForFormatter,
  type PlaygroundConfig,
} from '../store';

const DEFAULT_CONFIG: PlaygroundConfig = {
  targets: {
    github: { enabled: true, version: 'full' },
    claude: { enabled: true, version: 'full' },
    cursor: { enabled: true, version: 'standard' },
    antigravity: { enabled: true, version: 'frontmatter' },
  },
  formatting: {
    tabWidth: 2,
    proseWrap: 'preserve',
    printWidth: 80,
  },
};

describe('PlaygroundStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    usePlaygroundStore.setState({
      files: [{ path: 'project.prs', content: 'initial content' }],
      activeFile: 'project.prs',
      isCompiling: false,
      compileResult: null,
      lastCompileTime: null,
      config: DEFAULT_CONFIG,
      activeFormatter: 'claude',
      showErrors: false,
      showExamples: false,
      showConfig: false,
    });
  });

  describe('file operations', () => {
    it('should update file content', () => {
      const { updateFile } = usePlaygroundStore.getState();
      updateFile('project.prs', 'updated content');

      const state = usePlaygroundStore.getState();
      expect(state.files[0].content).toBe('updated content');
    });

    it('should add a new file', () => {
      const { addFile } = usePlaygroundStore.getState();
      addFile('new-file.prs', 'new content');

      const state = usePlaygroundStore.getState();
      expect(state.files).toHaveLength(2);
      expect(state.files[1].path).toBe('new-file.prs');
      expect(state.activeFile).toBe('new-file.prs');
    });

    it('should delete a file', () => {
      const { addFile, deleteFile } = usePlaygroundStore.getState();
      addFile('to-delete.prs', 'content');
      deleteFile('to-delete.prs');

      const state = usePlaygroundStore.getState();
      expect(state.files).toHaveLength(1);
      expect(state.files.find((f) => f.path === 'to-delete.prs')).toBeUndefined();
    });

    it('should switch active file when deleting active file', () => {
      const { addFile, setActiveFile, deleteFile } = usePlaygroundStore.getState();
      addFile('second.prs', 'content');
      setActiveFile('second.prs');
      deleteFile('second.prs');

      const state = usePlaygroundStore.getState();
      expect(state.activeFile).toBe('project.prs');
    });

    it('should rename a file', () => {
      const { renameFile } = usePlaygroundStore.getState();
      renameFile('project.prs', 'renamed.prs');

      const state = usePlaygroundStore.getState();
      expect(state.files[0].path).toBe('renamed.prs');
      expect(state.activeFile).toBe('renamed.prs');
    });

    it('should set multiple files', () => {
      const { setFiles } = usePlaygroundStore.getState();
      setFiles([
        { path: 'a.prs', content: 'a' },
        { path: 'b.prs', content: 'b' },
      ]);

      const state = usePlaygroundStore.getState();
      expect(state.files).toHaveLength(2);
      expect(state.activeFile).toBe('a.prs');
    });
  });

  describe('compilation state', () => {
    it('should set compiling state', () => {
      const { setCompiling } = usePlaygroundStore.getState();
      setCompiling(true);

      expect(usePlaygroundStore.getState().isCompiling).toBe(true);
    });

    it('should set compile result and show errors on failure', () => {
      const { setCompileResult } = usePlaygroundStore.getState();
      const result = {
        success: false,
        outputs: new Map(),
        errors: [{ name: 'Error', code: 'PS0001', message: 'Test error' }],
        warnings: [],
        stats: { resolveTime: 0, validateTime: 0, formatTime: 0, totalTime: 0 },
      };

      setCompileResult(result);

      const state = usePlaygroundStore.getState();
      expect(state.compileResult).toBe(result);
      expect(state.showErrors).toBe(true);
      expect(state.lastCompileTime).not.toBeNull();
    });

    it('should not show errors on successful compile', () => {
      const { setCompileResult } = usePlaygroundStore.getState();
      const result = {
        success: true,
        outputs: new Map(),
        errors: [],
        warnings: [],
        stats: { resolveTime: 0, validateTime: 0, formatTime: 0, totalTime: 0 },
      };

      setCompileResult(result);

      expect(usePlaygroundStore.getState().showErrors).toBe(false);
    });
  });

  describe('UI state', () => {
    it('should set active formatter', () => {
      const { setActiveFormatter } = usePlaygroundStore.getState();
      setActiveFormatter('github');

      expect(usePlaygroundStore.getState().activeFormatter).toBe('github');
    });

    it('should toggle errors visibility', () => {
      const { setShowErrors } = usePlaygroundStore.getState();
      setShowErrors(true);

      expect(usePlaygroundStore.getState().showErrors).toBe(true);
    });

    it('should toggle examples visibility', () => {
      const { setShowExamples } = usePlaygroundStore.getState();
      setShowExamples(true);

      expect(usePlaygroundStore.getState().showExamples).toBe(true);
    });

    it('should toggle config visibility', () => {
      const { setShowConfig } = usePlaygroundStore.getState();
      setShowConfig(true);

      expect(usePlaygroundStore.getState().showConfig).toBe(true);
    });
  });

  describe('config state', () => {
    it('should enable/disable target', () => {
      const { setTargetEnabled } = usePlaygroundStore.getState();
      setTargetEnabled('github', false);

      const state = usePlaygroundStore.getState();
      expect(state.config.targets.github.enabled).toBe(false);
    });

    it('should preserve other target settings when toggling enabled', () => {
      const { setTargetEnabled } = usePlaygroundStore.getState();
      setTargetEnabled('github', false);

      const state = usePlaygroundStore.getState();
      expect(state.config.targets.github.version).toBe('full');
      expect(state.config.targets.claude.enabled).toBe(true);
    });

    it('should set target version', () => {
      const { setTargetVersion } = usePlaygroundStore.getState();
      setTargetVersion('github', 'multifile');

      const state = usePlaygroundStore.getState();
      expect(state.config.targets.github.version).toBe('multifile');
    });

    it('should clear target version when set to undefined', () => {
      const { setTargetVersion } = usePlaygroundStore.getState();
      setTargetVersion('cursor', 'legacy');
      setTargetVersion('cursor', undefined);

      const state = usePlaygroundStore.getState();
      expect(state.config.targets.cursor.version).toBeUndefined();
    });

    it('should update formatting tabWidth', () => {
      const { setFormatting } = usePlaygroundStore.getState();
      setFormatting({ tabWidth: 4 });

      const state = usePlaygroundStore.getState();
      expect(state.config.formatting.tabWidth).toBe(4);
    });

    it('should update formatting proseWrap', () => {
      const { setFormatting } = usePlaygroundStore.getState();
      setFormatting({ proseWrap: 'always' });

      const state = usePlaygroundStore.getState();
      expect(state.config.formatting.proseWrap).toBe('always');
    });

    it('should update formatting printWidth', () => {
      const { setFormatting } = usePlaygroundStore.getState();
      setFormatting({ printWidth: 120 });

      const state = usePlaygroundStore.getState();
      expect(state.config.formatting.printWidth).toBe(120);
    });

    it('should merge multiple formatting options', () => {
      const { setFormatting } = usePlaygroundStore.getState();
      setFormatting({ tabWidth: 4, printWidth: 100 });

      const state = usePlaygroundStore.getState();
      expect(state.config.formatting.tabWidth).toBe(4);
      expect(state.config.formatting.printWidth).toBe(100);
      expect(state.config.formatting.proseWrap).toBe('preserve'); // unchanged
    });
  });

  describe('selectors', () => {
    it('selectFilesAsMap should return files as record', () => {
      const { setFiles } = usePlaygroundStore.getState();
      setFiles([
        { path: 'a.prs', content: 'content a' },
        { path: 'b.prs', content: 'content b' },
      ]);

      const map = selectFilesAsMap(usePlaygroundStore.getState());
      expect(map).toEqual({
        'a.prs': 'content a',
        'b.prs': 'content b',
      });
    });

    it('selectActiveFileContent should return active file content', () => {
      const content = selectActiveFileContent(usePlaygroundStore.getState());
      expect(content).toBe('initial content');
    });

    it('selectActiveFileContent should return empty string if no active file', () => {
      usePlaygroundStore.setState({ files: [], activeFile: 'missing.prs' });
      const content = selectActiveFileContent(usePlaygroundStore.getState());
      expect(content).toBe('');
    });

    it('selectEnabledTargets should return only enabled targets', () => {
      const { setTargetEnabled } = usePlaygroundStore.getState();
      setTargetEnabled('github', false);
      setTargetEnabled('cursor', false);

      const enabled = selectEnabledTargets(usePlaygroundStore.getState());
      expect(enabled).toEqual(['claude', 'antigravity']);
    });

    it('selectEnabledTargets should return empty array if all disabled', () => {
      const { setTargetEnabled } = usePlaygroundStore.getState();
      setTargetEnabled('github', false);
      setTargetEnabled('claude', false);
      setTargetEnabled('cursor', false);
      setTargetEnabled('antigravity', false);

      const enabled = selectEnabledTargets(usePlaygroundStore.getState());
      expect(enabled).toEqual([]);
    });

    it('selectOutputsForFormatter should return empty array when no compile result', () => {
      const outputs = selectOutputsForFormatter(usePlaygroundStore.getState(), 'claude');
      expect(outputs).toEqual([]);
    });

    it('selectOutputsForFormatter should match Claude output files', () => {
      const { setCompileResult } = usePlaygroundStore.getState();
      const outputMap = new Map([
        ['CLAUDE.md', { path: 'CLAUDE.md', content: 'claude main' }],
        ['.claude/rules/test.md', { path: '.claude/rules/test.md', content: 'claude rule' }],
        [
          '.github/copilot-instructions.md',
          { path: '.github/copilot-instructions.md', content: 'github' },
        ],
      ]);
      setCompileResult({
        success: true,
        outputs: outputMap,
        errors: [],
        warnings: [],
        stats: { resolveTime: 0, validateTime: 0, formatTime: 0, totalTime: 0 },
      });

      const outputs = selectOutputsForFormatter(usePlaygroundStore.getState(), 'claude');
      expect(outputs).toHaveLength(2);
      expect(outputs[0].path).toBe('CLAUDE.md'); // main file first
      expect(outputs[1].path).toBe('.claude/rules/test.md');
    });

    it('selectOutputsForFormatter should match GitHub output files', () => {
      const { setCompileResult } = usePlaygroundStore.getState();
      const outputMap = new Map([
        [
          '.github/copilot-instructions.md',
          { path: '.github/copilot-instructions.md', content: 'github main' },
        ],
        [
          '.github/instructions/test.instructions.md',
          { path: '.github/instructions/test.instructions.md', content: 'github instruction' },
        ],
        ['CLAUDE.md', { path: 'CLAUDE.md', content: 'claude' }],
      ]);
      setCompileResult({
        success: true,
        outputs: outputMap,
        errors: [],
        warnings: [],
        stats: { resolveTime: 0, validateTime: 0, formatTime: 0, totalTime: 0 },
      });

      const outputs = selectOutputsForFormatter(usePlaygroundStore.getState(), 'github');
      expect(outputs).toHaveLength(2);
      expect(outputs[0].path).toBe('.github/copilot-instructions.md'); // main file first
    });

    it('selectOutputsForFormatter should match GitHub full mode output files', () => {
      const { setCompileResult } = usePlaygroundStore.getState();
      const outputMap = new Map([
        [
          '.github/copilot-instructions.md',
          { path: '.github/copilot-instructions.md', content: 'github main' },
        ],
        [
          '.github/prompts/review.prompt.md',
          { path: '.github/prompts/review.prompt.md', content: 'prompt' },
        ],
        [
          '.github/skills/review/SKILL.md',
          { path: '.github/skills/review/SKILL.md', content: 'skill' },
        ],
        ['.github/agents/coder.md', { path: '.github/agents/coder.md', content: 'agent' }],
        ['AGENTS.md', { path: 'AGENTS.md', content: 'agents index' }],
        ['CLAUDE.md', { path: 'CLAUDE.md', content: 'claude' }],
      ]);
      setCompileResult({
        success: true,
        outputs: outputMap,
        errors: [],
        warnings: [],
        stats: { resolveTime: 0, validateTime: 0, formatTime: 0, totalTime: 0 },
      });

      const outputs = selectOutputsForFormatter(usePlaygroundStore.getState(), 'github');
      expect(outputs).toHaveLength(5);
      expect(outputs[0].path).toBe('.github/copilot-instructions.md'); // main file first
      expect(outputs.map((o) => o.path)).toContain('.github/prompts/review.prompt.md');
      expect(outputs.map((o) => o.path)).toContain('.github/skills/review/SKILL.md');
      expect(outputs.map((o) => o.path)).toContain('.github/agents/coder.md');
      expect(outputs.map((o) => o.path)).toContain('AGENTS.md');
    });

    it('selectOutputsForFormatter should match Antigravity output files', () => {
      const { setCompileResult } = usePlaygroundStore.getState();
      const outputMap = new Map([
        [
          '.agent/rules/project.md',
          { path: '.agent/rules/project.md', content: 'antigravity rule' },
        ],
        [
          '.agent/workflows/deploy.md',
          { path: '.agent/workflows/deploy.md', content: 'antigravity workflow' },
        ],
        ['CLAUDE.md', { path: 'CLAUDE.md', content: 'claude' }],
      ]);
      setCompileResult({
        success: true,
        outputs: outputMap,
        errors: [],
        warnings: [],
        stats: { resolveTime: 0, validateTime: 0, formatTime: 0, totalTime: 0 },
      });

      const outputs = selectOutputsForFormatter(usePlaygroundStore.getState(), 'antigravity');
      expect(outputs).toHaveLength(2);
    });

    it('selectOutputsForFormatter should match Cursor output files', () => {
      const { setCompileResult } = usePlaygroundStore.getState();
      const outputMap = new Map([
        [
          '.cursor/rules/instructions.mdc',
          { path: '.cursor/rules/instructions.mdc', content: 'cursor mdc' },
        ],
        ['.cursorrules', { path: '.cursorrules', content: 'cursor rules' }],
        ['CLAUDE.md', { path: 'CLAUDE.md', content: 'claude' }],
      ]);
      setCompileResult({
        success: true,
        outputs: outputMap,
        errors: [],
        warnings: [],
        stats: { resolveTime: 0, validateTime: 0, formatTime: 0, totalTime: 0 },
      });

      const outputs = selectOutputsForFormatter(usePlaygroundStore.getState(), 'cursor');
      expect(outputs).toHaveLength(2);
    });
  });
});

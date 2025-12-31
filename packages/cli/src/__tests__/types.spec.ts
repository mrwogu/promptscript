import { describe, it, expect } from 'vitest';
import type {
  InitOptions,
  CompileOptions,
  ValidateOptions,
  PullOptions,
  DiffOptions,
} from '../types';

describe('types', () => {
  describe('InitOptions', () => {
    it('should allow empty options', () => {
      const options: InitOptions = {};
      expect(options.team).toBeUndefined();
      expect(options.template).toBeUndefined();
    });

    it('should allow team option', () => {
      const options: InitOptions = { team: 'frontend' };
      expect(options.team).toBe('frontend');
    });

    it('should allow template option', () => {
      const options: InitOptions = { template: 'basic' };
      expect(options.template).toBe('basic');
    });
  });

  describe('CompileOptions', () => {
    it('should allow empty options', () => {
      const options: CompileOptions = {};
      expect(options.target).toBeUndefined();
    });

    it('should allow all options', () => {
      const options: CompileOptions = {
        target: 'github',
        all: true,
        watch: true,
        output: './dist',
        dryRun: true,
        registry: './my-registry',
      };
      expect(options.target).toBe('github');
      expect(options.all).toBe(true);
      expect(options.watch).toBe(true);
      expect(options.output).toBe('./dist');
      expect(options.dryRun).toBe(true);
      expect(options.registry).toBe('./my-registry');
    });

    it('should allow registry option alone', () => {
      const options: CompileOptions = { registry: '/path/to/registry' };
      expect(options.registry).toBe('/path/to/registry');
    });
  });

  describe('ValidateOptions', () => {
    it('should allow empty options', () => {
      const options: ValidateOptions = {};
      expect(options.strict).toBeUndefined();
    });

    it('should allow strict option', () => {
      const options: ValidateOptions = { strict: true };
      expect(options.strict).toBe(true);
    });

    it('should allow fix option', () => {
      const options: ValidateOptions = { fix: true };
      expect(options.fix).toBe(true);
    });
  });

  describe('PullOptions', () => {
    it('should allow empty options', () => {
      const options: PullOptions = {};
      expect(options.force).toBeUndefined();
    });

    it('should allow force option', () => {
      const options: PullOptions = { force: true };
      expect(options.force).toBe(true);
    });
  });

  describe('DiffOptions', () => {
    it('should allow empty options', () => {
      const options: DiffOptions = {};
      expect(options.target).toBeUndefined();
    });

    it('should allow target option', () => {
      const options: DiffOptions = { target: 'claude' };
      expect(options.target).toBe('claude');
    });
  });
});

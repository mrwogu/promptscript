import { writeFile, mkdir, readFile, readdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import type { PathLike, Stats } from 'fs';
import * as prompts from '@inquirer/prompts';

export interface FileSystem {
  writeFile: typeof writeFile;
  mkdir: typeof mkdir;
  readFile: typeof readFile;
  readdir: typeof readdir;
  existsSync: typeof existsSync;
  readFileSync: typeof readFileSync;
  rename?: typeof import('fs/promises').rename;
  rm?: typeof import('fs/promises').rm;
  lstat?: (path: PathLike) => Promise<Stats>;
  realpath?: (path: PathLike) => Promise<string>;
}

export interface PromptSystem {
  input: typeof prompts.input;
  confirm: typeof prompts.confirm;
  checkbox: typeof prompts.checkbox;
  select: typeof prompts.select;
}

export interface CliServices {
  fs: FileSystem;
  prompts: PromptSystem;
  cwd: string;
}

export const defaultFileSystem: FileSystem = {
  writeFile,
  mkdir,
  readFile,
  readdir,
  existsSync,
  readFileSync,
  rename: async (...args) => {
    const { rename } = await import('node:fs/promises');
    return rename(...args);
  },
  rm: async (...args) => {
    const { rm } = await import('node:fs/promises');
    return rm(...args);
  },
  lstat: async (path) => {
    const { lstat } = await import('node:fs/promises');
    return lstat(path);
  },
  realpath: async (path) => {
    const { realpath } = await import('node:fs/promises');
    return realpath(path);
  },
};

export const defaultPrompts: PromptSystem = {
  input: (config, context) =>
    prompts.input(config, { ...context, output: context?.output ?? process.stderr }),
  confirm: (config, context) =>
    prompts.confirm(config, { ...context, output: context?.output ?? process.stderr }),
  checkbox: (config, context) =>
    prompts.checkbox(config, { ...context, output: context?.output ?? process.stderr }),
  select: (config, context) =>
    prompts.select(config, { ...context, output: context?.output ?? process.stderr }),
};

export const createDefaultServices = (): CliServices => ({
  fs: defaultFileSystem,
  prompts: defaultPrompts,
  cwd: process.cwd(),
});

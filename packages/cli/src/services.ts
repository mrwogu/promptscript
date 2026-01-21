import { writeFile, mkdir, readFile, readdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import * as prompts from '@inquirer/prompts';

export interface FileSystem {
  writeFile: typeof writeFile;
  mkdir: typeof mkdir;
  readFile: typeof readFile;
  readdir: typeof readdir;
  existsSync: typeof existsSync;
  readFileSync: typeof readFileSync;
}

export interface PromptSystem {
  input: typeof prompts.input;
  confirm: typeof prompts.confirm;
  checkbox: typeof prompts.checkbox;
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
};

export const defaultPrompts: PromptSystem = {
  input: prompts.input,
  confirm: prompts.confirm,
  checkbox: prompts.checkbox,
};

export const createDefaultServices = (): CliServices => ({
  fs: defaultFileSystem,
  prompts: defaultPrompts,
  cwd: process.cwd(),
});

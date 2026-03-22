import { execFileSync } from 'child_process';

const CLIPBOARD_COMMANDS: Record<string, [string, string[]][]> = {
  darwin: [['pbcopy', []]],
  linux: [
    ['xclip', ['-selection', 'clipboard']],
    ['xsel', ['--clipboard', '--input']],
  ],
  win32: [['clip', []]],
};

export function copyToClipboard(text: string): boolean {
  const commands = CLIPBOARD_COMMANDS[process.platform] ?? [];

  for (const [binary, args] of commands) {
    try {
      execFileSync(binary, args, { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
      return true;
    } catch {
      // Try next command
    }
  }

  return false;
}

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStartServer = vi.fn().mockResolvedValue(undefined);

vi.mock('@promptscript/server', () => ({
  startServer: mockStartServer,
}));

import { serveCommand } from '../serve.js';

describe('serveCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls startServer with default options', async () => {
    await serveCommand({});
    expect(mockStartServer).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 3000,
        host: '127.0.0.1',
        readOnly: false,
        corsOrigin: 'https://getpromptscript.dev',
      })
    );
  });

  it('passes custom port', async () => {
    await serveCommand({ port: '8080' });
    expect(mockStartServer).toHaveBeenCalledWith(expect.objectContaining({ port: 8080 }));
  });

  it('passes host option', async () => {
    await serveCommand({ host: '0.0.0.0' });
    expect(mockStartServer).toHaveBeenCalledWith(expect.objectContaining({ host: '0.0.0.0' }));
  });

  it('passes read-only flag', async () => {
    await serveCommand({ readOnly: true });
    expect(mockStartServer).toHaveBeenCalledWith(expect.objectContaining({ readOnly: true }));
  });

  it('passes custom CORS origin', async () => {
    await serveCommand({ corsOrigin: 'https://custom.example.com' });
    expect(mockStartServer).toHaveBeenCalledWith(
      expect.objectContaining({ corsOrigin: 'https://custom.example.com' })
    );
  });

  it('uses process.cwd() as workspace', async () => {
    await serveCommand({});
    expect(mockStartServer).toHaveBeenCalledWith(
      expect.objectContaining({ workspace: process.cwd() })
    );
  });
});

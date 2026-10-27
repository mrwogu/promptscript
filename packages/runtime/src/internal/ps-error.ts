/**
 * The two names the copied canonical JSON helper needs from the core error module.
 * The runtime has no dependency on core, so this file stands in for it.
 */
export const ErrorCode = { INVALID_VALUE: 'PS3002' } as const;

export class PSError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'PSError';
    this.code = code;
  }
}

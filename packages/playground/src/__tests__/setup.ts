import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Monaco editor for tests
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    return {
      type: 'div',
      props: {
        'data-testid': 'monaco-editor',
        children: value,
        onChange,
      },
    };
  }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

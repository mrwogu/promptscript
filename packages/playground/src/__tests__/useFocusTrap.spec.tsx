import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

function createModalElement(): HTMLDivElement {
  const container = document.createElement('div');
  const btn1 = document.createElement('button');
  btn1.textContent = 'First';
  const btn2 = document.createElement('button');
  btn2.textContent = 'Second';
  const btn3 = document.createElement('button');
  btn3.textContent = 'Third';
  container.appendChild(btn1);
  container.appendChild(btn2);
  container.appendChild(btn3);
  document.body.appendChild(container);
  return container;
}

describe('useFocusTrap', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = createModalElement();
  });

  it('should focus the first focusable element when active', () => {
    const focusSpy = vi.spyOn(container.querySelector('button')!, 'focus');

    renderHook(() => {
      const ref = useRef<HTMLElement>(container);
      useFocusTrap(ref, true);
    });

    expect(focusSpy).toHaveBeenCalled();
  });

  it('should not focus when inactive', () => {
    const focusSpy = vi.spyOn(container.querySelector('button')!, 'focus');

    renderHook(() => {
      const ref = useRef<HTMLElement>(container);
      useFocusTrap(ref, false);
    });

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('should cycle focus forward on Tab from last element', () => {
    const buttons = container.querySelectorAll('button');
    const firstBtn = buttons[0]!;
    const lastBtn = buttons[2]!;

    renderHook(() => {
      const ref = useRef<HTMLElement>(container);
      useFocusTrap(ref, true);
    });

    // Focus last button
    lastBtn.focus();
    expect(document.activeElement).toBe(lastBtn);

    // Press Tab on last element
    const focusSpy = vi.spyOn(firstBtn, 'focus');
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    container.dispatchEvent(event);

    expect(focusSpy).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('should cycle focus backward on Shift+Tab from first element', () => {
    const buttons = container.querySelectorAll('button');
    const firstBtn = buttons[0]!;
    const lastBtn = buttons[2]!;

    renderHook(() => {
      const ref = useRef<HTMLElement>(container);
      useFocusTrap(ref, true);
    });

    // Focus first button
    firstBtn.focus();
    expect(document.activeElement).toBe(firstBtn);

    // Press Shift+Tab on first element
    const focusSpy = vi.spyOn(lastBtn, 'focus');
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    container.dispatchEvent(event);

    expect(focusSpy).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('should not prevent Tab when focus is not on boundary elements', () => {
    const buttons = container.querySelectorAll('button');
    const middleBtn = buttons[1]!;

    renderHook(() => {
      const ref = useRef<HTMLElement>(container);
      useFocusTrap(ref, true);
    });

    // Focus middle button
    middleBtn.focus();

    // Press Tab — should not prevent default
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    container.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('should ignore non-Tab keys', () => {
    renderHook(() => {
      const ref = useRef<HTMLElement>(container);
      useFocusTrap(ref, true);
    });

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    container.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('should restore focus on cleanup', () => {
    // Create an external button and focus it
    const externalBtn = document.createElement('button');
    externalBtn.textContent = 'External';
    document.body.appendChild(externalBtn);
    externalBtn.focus();
    expect(document.activeElement).toBe(externalBtn);

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLElement>(container);
      useFocusTrap(ref, true);
    });

    // Focus should have moved to first button in container
    const focusSpy = vi.spyOn(externalBtn, 'focus');
    unmount();

    expect(focusSpy).toHaveBeenCalled();
  });
});

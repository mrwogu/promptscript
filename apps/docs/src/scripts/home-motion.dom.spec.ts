// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initHomeMotion } from './home-motion';

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let observed: Element[] = [];
let trigger: Callback = () => undefined;

class FakeObserver {
  constructor(callback: Callback) {
    trigger = callback;
  }
  observe(el: Element): void {
    observed.push(el);
  }
  unobserve(): void {}
}

function mockMotion(reduce: boolean): void {
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  vi.stubGlobal('matchMedia', () => ({ matches: reduce }));
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16)
  );
}

function render(): void {
  document.body.innerHTML = `
    <div class="home-page">
      <section class="home-section">
        <div class="home-section__intro"><h2>Title</h2></div>
        <div class="home-stats"><div><strong data-count="50" data-suffix="+">50+</strong></div></div>
        <div class="home-code-window" data-typing><pre><code>$ prs validate
ok</code></pre></div>
        <a class="home-capability" href="#">card</a>
      </section>
    </div>`;
}

describe('initHomeMotion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    observed = [];
    render();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('leaves the page static when the user prefers reduced motion', () => {
    mockMotion(true);

    initHomeMotion();

    expect(document.querySelector('.home-page')?.classList.contains('is-animated')).toBe(false);
    expect(observed).toHaveLength(0);
  });

  it('reveals sections, types the terminal and counts up stats', () => {
    mockMotion(false);

    initHomeMotion();
    trigger(observed.map((target) => ({ target, isIntersecting: true })));
    vi.advanceTimersByTime(3000);

    expect(document.querySelector('.home-page')?.classList.contains('is-animated')).toBe(true);
    expect(observed.every((el) => el.classList.contains('is-visible'))).toBe(true);
    const lines = document.querySelectorAll('.home-line');
    expect(lines).toHaveLength(2);
    expect([...lines].every((line) => line.classList.contains('is-visible'))).toBe(true);
    expect(document.querySelector('[data-count]')?.textContent).toBe('50+');
  });

  it('moves the card spotlight with the pointer', () => {
    mockMotion(false);

    initHomeMotion();
    const card = document.querySelector<HTMLElement>('.home-capability');
    card?.dispatchEvent(new MouseEvent('pointermove', { clientX: 30, clientY: 12 }));

    expect(card?.style.getPropertyValue('--mx')).toBe('30px');
    expect(card?.style.getPropertyValue('--my')).toBe('12px');
  });
});

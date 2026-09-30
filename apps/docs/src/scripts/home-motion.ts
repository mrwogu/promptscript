// Homepage motion: reveal on scroll, count-up stats, a typed terminal, and a
// cursor spotlight on cards. Without JS or with reduced motion the page stays static.

const REVEAL = [
  '.home-section__intro',
  '.home-compare__col',
  '.home-compare__arrow',
  '.home-stats > div',
  '.home-capability',
  '.home-compose__op',
  '.home-section .home-code-window',
  '.home-native__copy',
  '.home-target-card',
  '.home-plugins__notes li',
  '.home-models-wrap',
  '.home-scale',
  '.home-path-card',
  '.home-proof',
  '.home-final-cta',
].join(',');

const STAGGER_MS = 80;
const LINE_MS = 110;
const COUNT_MS = 1200;

/** Wraps every line of highlighted code so lines can appear one by one. */
export function wrapLines(html: string): string {
  return html
    .split('\n')
    .map((line) => `<span class="home-line">${line}</span>`)
    .join('\n');
}

/** Count-up value for a progress between 0 and 1, eased out. */
export function countAt(progress: number, target: number): number {
  const t = Math.min(Math.max(progress, 0), 1);
  return Math.round(target * (1 - (1 - t) ** 3));
}

function countUp(el: HTMLElement): void {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix ?? '';
  const start = performance.now();
  const tick = (now: number): void => {
    const progress = (now - start) / COUNT_MS;
    el.textContent = `${countAt(progress, target)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function typeLines(code: HTMLElement): void {
  code.querySelectorAll<HTMLElement>('.home-line').forEach((line, index) => {
    setTimeout(() => line.classList.add('is-visible'), index * LINE_MS);
  });
}

function onVisible(el: Element): void {
  el.classList.add('is-visible');
  el.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
  const code = el.matches('[data-typing]') ? el.querySelector<HTMLElement>('code') : null;
  if (code) typeLines(code);
}

export function initHomeMotion(): void {
  const page = document.querySelector<HTMLElement>('.home-page');
  if (!page || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  page.querySelectorAll<HTMLElement>('[data-typing] code').forEach((code) => {
    code.innerHTML = wrapLines(code.innerHTML);
  });
  page.classList.add('is-animated');

  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, index) => {
          observer.unobserve(entry.target);
          setTimeout(() => onVisible(entry.target), index * STAGGER_MS);
        });
    },
    { rootMargin: '0px 0px -10% 0px' }
  );
  page.querySelectorAll(REVEAL).forEach((el) => {
    el.classList.add('home-reveal');
    observer.observe(el);
  });

  page.querySelectorAll<HTMLElement>('.home-capability, .home-compose__op').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - box.left}px`);
      card.style.setProperty('--my', `${event.clientY - box.top}px`);
    });
  });
}

/**
 * Compile Demo - Typewriter + Multi-file cycling
 * Browser Support: Chrome 51+, Firefox 55+, Safari 12.1+, Edge 15+
 */
(function () {
  'use strict';

  // Feature detection for CSS :has() - fallback for older browsers
  var supportsHas = (function () {
    try {
      return CSS.supports('selector(:has(*))');
    } catch (e) {
      return false;
    }
  })();

  var SOURCE_LINES = [
    { text: '@meta', cls: 'kw' },
    { text: ' { ', cls: '' },
    { text: 'id:', cls: 'key' },
    { text: ' ', cls: '' },
    { text: '"checkout"', cls: 'str' },
    { text: ' }\n', cls: '' },
    { text: '@inherit', cls: 'kw' },
    { text: ' ', cls: '' },
    { text: '@acme/standards', cls: 'ref' },
    { text: '\n', cls: '' },
    { text: '@identity', cls: 'kw' },
    { text: ' { ', cls: '' },
    { text: '"Backend Engineer"', cls: 'str' },
    { text: ' }\n', cls: '' },
    { text: '@skills', cls: 'kw' },
    { text: ' { ', cls: '' },
    { text: 'prompt:', cls: 'key' },
    { text: ' ', cls: '' },
    { text: 'true', cls: 'bool' },
    { text: ' }\n', cls: '' },
    { text: '@standards', cls: 'kw' },
    { text: ' { ', cls: '' },
    { text: 'api:', cls: 'key' },
    { text: ' ', cls: '' },
    { text: '"${API_URL}"', cls: 'str' },
    { text: ' }', cls: '' },
  ];

  const TYPING_SPEED = 18;
  const COMPILE_DELAY = 600;
  const SUBFILE_DISPLAY_TIME = 4000;
  const SCROLL_DURATION = 3000;

  let hasPlayed = false;
  let animationTimer = null;

  function initCompileDemo() {
    const demo = document.getElementById('compile-demo');
    if (!demo || hasPlayed) return;

    const target = document.getElementById('typewriter-target');
    const cursor = document.getElementById('typing-cursor');
    const compileBtn = document.getElementById('compile-button');
    const outputPanel = document.getElementById('output-panel');
    const placeholder = document.getElementById('compile-placeholder');
    const tabs = demo.querySelectorAll('.compile-demo__tab');
    const panels = demo.querySelectorAll('.compile-demo__panel');

    if (!target) return;

    // Fallback for browsers without :has() support - hide tabs initially
    if (
      !supportsHas &&
      placeholder &&
      !placeholder.classList.contains('compile-demo__placeholder--hidden')
    ) {
      var tabsEl = outputPanel.querySelector('.compile-demo__tabs');
      var panelsEls = outputPanel.querySelectorAll('.compile-demo__panel');
      if (tabsEl) tabsEl.style.opacity = '0';
      panelsEls.forEach(function (p) {
        p.style.opacity = '0';
        p.style.pointerEvents = 'none';
      });
    }

    // Setup subfile click handlers
    setupSubfileHandlers(demo);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPlayed) {
            hasPlayed = true;
            observer.disconnect();
            startAnimation(
              target,
              cursor,
              compileBtn,
              outputPanel,
              placeholder,
              tabs,
              panels,
              demo
            );
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(demo);

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        stopAnimation();
        switchToTab(tab.dataset.target, tabs, panels);
      });
    });
  }

  function setupSubfileHandlers(demo) {
    demo.querySelectorAll('.compile-demo__subfile').forEach((subfile) => {
      subfile.addEventListener('click', () => {
        stopAnimation();
        const panel = subfile.closest('.compile-demo__panel');
        switchToSubfile(panel, subfile.dataset.file);
      });
    });
  }

  function startAnimation(
    target,
    cursor,
    compileBtn,
    outputPanel,
    placeholder,
    tabs,
    panels,
    demo
  ) {
    outputPanel.classList.add('compile-demo__output--hidden');
    cursor.classList.add('compile-demo__cursor--active');

    typeWriterLines(target, SOURCE_LINES, 0, 0, () => {
      cursor.classList.remove('compile-demo__cursor--active');
      cursor.classList.add('compile-demo__cursor--done');

      setTimeout(() => {
        compileBtn.classList.add('compile-demo__arrow-icon--compiling');

        setTimeout(() => {
          compileBtn.classList.remove('compile-demo__arrow-icon--compiling');
          compileBtn.classList.add('compile-demo__arrow-icon--done');
          outputPanel.classList.remove('compile-demo__output--hidden');
          outputPanel.classList.add('compile-demo__output--revealed');
          if (placeholder) {
            placeholder.classList.add('compile-demo__placeholder--hidden');
            // Fallback for browsers without :has() support
            if (!supportsHas) {
              var tabsEl = outputPanel.querySelector('.compile-demo__tabs');
              var panelsEls = outputPanel.querySelectorAll('.compile-demo__panel');
              if (tabsEl) tabsEl.style.opacity = '1';
              panelsEls.forEach(function (p) {
                p.style.opacity = '1';
                p.style.pointerEvents = 'auto';
              });
            }
          }

          // Start the sequential cycling after a brief pause
          setTimeout(() => {
            startSequentialCycling(tabs, panels, demo);
          }, 1000);
        }, 700);
      }, COMPILE_DELAY);
    });
  }

  function typeWriterLines(container, lines, lineIdx, charIdx, callback) {
    if (lineIdx >= lines.length) {
      callback();
      return;
    }

    const line = lines[lineIdx];
    const text = line.text;

    if (charIdx === 0 && line.cls) {
      const span = document.createElement('span');
      span.className = line.cls;
      span.dataset.lineIdx = lineIdx;
      container.appendChild(span);
    }

    if (charIdx < text.length) {
      const char = text[charIdx];
      const targetEl = line.cls
        ? container.querySelector('[data-line-idx="' + lineIdx + '"]')
        : container;

      if (targetEl) {
        targetEl.appendChild(document.createTextNode(char));
      }

      const delay = char === ' ' || char === '\n' ? TYPING_SPEED / 4 : TYPING_SPEED;
      setTimeout(() => typeWriterLines(container, lines, lineIdx, charIdx + 1, callback), delay);
    } else {
      setTimeout(
        () => typeWriterLines(container, lines, lineIdx + 1, 0, callback),
        TYPING_SPEED / 2
      );
    }
  }

  function switchToTab(targetId, tabs, panels) {
    tabs.forEach((t) => {
      t.classList.toggle('compile-demo__tab--active', t.dataset.target === targetId);
    });
    panels.forEach((p) => {
      const isActive = p.dataset.panel === targetId;
      p.classList.toggle('compile-demo__panel--active', isActive);
    });
  }

  function switchToSubfile(panel, fileIdx) {
    const subfiles = panel.querySelectorAll('.compile-demo__subfile');
    const files = panel.querySelectorAll('.compile-demo__file');

    subfiles.forEach((s) => {
      s.classList.toggle('compile-demo__subfile--active', s.dataset.file === fileIdx);
    });
    files.forEach((f) => {
      f.classList.toggle('compile-demo__file--active', f.dataset.file === fileIdx);
    });

    // Reset scroll position for newly active file
    const activeFile = panel.querySelector('.compile-demo__file--active');
    if (activeFile) {
      const codeBlock = activeFile.querySelector('.compile-demo__code');
      if (codeBlock) {
        codeBlock.scrollTop = 0;
      }
    }
  }

  function smoothScrollContent(panel) {
    const activeFile = panel.querySelector('.compile-demo__file--active');
    if (!activeFile) return;

    const codeBlock = activeFile.querySelector('.compile-demo__code');
    if (!codeBlock) return;

    const maxScroll = codeBlock.scrollHeight - codeBlock.clientHeight;
    if (maxScroll <= 0) return;

    const startTime = performance.now();
    const startScroll = codeBlock.scrollTop;
    const targetScroll = maxScroll;

    function animateScroll(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / SCROLL_DURATION, 1);

      // Ease in-out sine for very smooth scrolling
      const easeProgress = -(Math.cos(Math.PI * progress) - 1) / 2;

      codeBlock.scrollTop = startScroll + (targetScroll - startScroll) * easeProgress;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    }

    requestAnimationFrame(animateScroll);
  }

  function startSequentialCycling(tabs, panels, demo) {
    const tabIds = Array.from(tabs).map((t) => t.dataset.target);
    let currentTabIndex = 0;
    let currentSubfileIndex = 0;

    function cycleNext() {
      const currentTabId = tabIds[currentTabIndex];
      const currentPanel = demo.querySelector('[data-panel="' + currentTabId + '"]');

      if (!currentPanel) {
        animationTimer = setTimeout(cycleNext, SUBFILE_DISPLAY_TIME);
        return;
      }

      const subfiles = currentPanel.querySelectorAll('.compile-demo__subfile');
      const subfileCount = subfiles.length;

      // Switch to current subfile
      switchToSubfile(currentPanel, String(currentSubfileIndex));

      // After a brief moment, start scrolling
      setTimeout(() => {
        smoothScrollContent(currentPanel);
      }, 500);

      // Schedule next step
      animationTimer = setTimeout(() => {
        currentSubfileIndex++;

        // If we've shown all subfiles in this tab, move to next tab
        if (currentSubfileIndex >= subfileCount) {
          currentSubfileIndex = 0;
          currentTabIndex = (currentTabIndex + 1) % tabIds.length;

          // Switch to next tab
          switchToTab(tabIds[currentTabIndex], tabs, panels);
        }

        cycleNext();
      }, SUBFILE_DISPLAY_TIME);
    }

    // Start with first subfile of first tab
    cycleNext();
  }

  function stopAnimation() {
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCompileDemo);
  } else {
    initCompileDemo();
  }

  if (typeof document$ !== 'undefined') {
    document$.subscribe(() => {
      hasPlayed = false;
      stopAnimation();
      initCompileDemo();
    });
  }
})();

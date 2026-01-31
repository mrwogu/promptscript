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

    // Create floating scroll hint (will be enabled after typing animation)
    const scrollHint = createScrollHint();
    document.body.appendChild(scrollHint);
    scrollHint.dataset.enabled = 'false';

    // Make arrow clickable to scroll to output
    if (compileBtn) {
      compileBtn.style.cursor = 'pointer';
      compileBtn.addEventListener('click', function () {
        scrollToCompileArea(compileBtn, scrollHint);
      });
    }

    // Scroll hint click handler
    scrollHint.addEventListener('click', function () {
      scrollToCompileArea(compileBtn, scrollHint);
    });

    // Event listeners for visibility (only active after typing completes)
    window.addEventListener(
      'scroll',
      function () {
        if (scrollHint.dataset.enabled === 'true') {
          checkScrollHintVisibility(compileBtn, scrollHint);
        }
      },
      {
        passive: true,
      }
    );
    window.addEventListener(
      'resize',
      function () {
        if (scrollHint.dataset.enabled === 'true') {
          checkScrollHintVisibility(compileBtn, scrollHint);
        }
      },
      {
        passive: true,
      }
    );

    // Store scrollHint reference for startAnimation to use
    demo.scrollHint = scrollHint;
  }

  function createScrollHint() {
    var hint = document.createElement('div');
    hint.className = 'compile-demo__scroll-hint';

    var text = document.createElement('span');
    text.className = 'compile-demo__scroll-hint-text';
    text.textContent = 'See compilation';
    hint.appendChild(text);

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'compile-demo__scroll-hint-arrow');
    svg.setAttribute('viewBox', '0 0 24 24');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z');
    svg.appendChild(path);
    hint.appendChild(svg);

    return hint;
  }

  function scrollToCompileArea(compileBtn, scrollHint) {
    if (compileBtn) {
      compileBtn.scrollIntoView({ behavior: 'smooth', block: 'start' });
      scrollHint.classList.remove('compile-demo__scroll-hint--visible');
    }
  }

  function checkScrollHintVisibility(compileBtn, scrollHint) {
    if (!compileBtn || !scrollHint) return;

    var arrowRect = compileBtn.getBoundingClientRect();
    var windowHeight = window.innerHeight;

    // Show hint if the compile arrow is below the viewport
    var arrowBelowViewport = arrowRect.top > windowHeight;

    if (arrowBelowViewport) {
      scrollHint.classList.add('compile-demo__scroll-hint--visible');
    } else {
      scrollHint.classList.remove('compile-demo__scroll-hint--visible');
    }
  }

  function waitForOutputVisible(outputPanel, callback) {
    if (!outputPanel) return;

    var rect = outputPanel.getBoundingClientRect();
    var windowHeight = window.innerHeight;

    // If already visible (at least 50% in viewport), start immediately
    if (rect.top < windowHeight * 0.8) {
      setTimeout(callback, 500);
      return;
    }

    // Otherwise, wait for it to become visible
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            observer.disconnect();
            setTimeout(callback, 500);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(outputPanel);
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

      // Enable scroll hint after typing completes
      if (demo.scrollHint) {
        demo.scrollHint.dataset.enabled = 'true';
        checkScrollHintVisibility(compileBtn, demo.scrollHint);
      }

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

          // Start sequential cycling only when output panel is visible
          waitForOutputVisible(outputPanel, function () {
            startSequentialCycling(tabs, panels, demo);
          });
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

    // Scroll active vendor tab into view (within tabs container only)
    const activeTab = Array.from(tabs).find((t) => t.dataset.target === targetId);
    if (activeTab) {
      const tabsContainer = activeTab.parentElement;
      if (tabsContainer) {
        const containerRect = tabsContainer.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        const scrollLeft =
          tabRect.left - containerRect.left - (containerRect.width - tabRect.width) / 2;
        tabsContainer.scrollBy({ left: scrollLeft, behavior: 'smooth' });
      }
    }
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

    // Scroll active subfile tab into view (within subfiles container only)
    const activeSubfile = panel.querySelector('.compile-demo__subfile--active');
    if (activeSubfile) {
      const subfilesContainer = panel.querySelector('.compile-demo__subfiles');
      if (subfilesContainer) {
        const containerRect = subfilesContainer.getBoundingClientRect();
        const subfileRect = activeSubfile.getBoundingClientRect();
        const scrollLeft =
          subfileRect.left - containerRect.left - (containerRect.width - subfileRect.width) / 2;
        subfilesContainer.scrollBy({ left: scrollLeft, behavior: 'smooth' });
      }
    }

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

/**
 * Init Demo - Interactive prs init animation
 * Supports multiple demos with different configurations
 */
(function () {
  'use strict';

  // Animation timing constants
  var TYPING_SPEED = 30;
  var LINE_DELAY = 400;
  var DETECT_DELAY = 800;
  var SELECT_DELAY = 1200;

  // Demo configurations
  var DEMO_CONFIGS = {
    // Standard init demo
    'init-demo': {
      steps: [
        { type: 'command', text: 'prs init' },
        { type: 'blank' },
        { type: 'header', text: '  PromptScript Initializer' },
        { type: 'blank' },
        { type: 'detect', text: '  Detecting project...', delay: DETECT_DELAY },
        { type: 'success', text: '  ✓ Found package.json' },
        { type: 'success', text: '  ✓ TypeScript detected' },
        { type: 'success', text: '  ✓ React 18 detected' },
        { type: 'success', text: '  ✓ Vitest detected' },
        { type: 'blank' },
        { type: 'question', text: '  ? Select a registry to inherit from:' },
        {
          type: 'options',
          options: [
            { text: '@company/frontend-standards', selected: false },
            { text: '@company/react-app', selected: true, highlight: true },
            { text: '@company/security', selected: false },
            { text: 'Skip (start fresh)', selected: false },
          ],
        },
        { type: 'blank' },
        { type: 'info', text: '  Fetching @company/react-app...' },
        { type: 'success', text: '  ✓ Inherited 12 standards, 3 restrictions' },
        { type: 'blank' },
        { type: 'question', text: '  ? Select output targets:' },
        {
          type: 'checkboxes',
          options: [
            { text: 'GitHub Copilot', checked: true },
            { text: 'Claude Code', checked: true },
            { text: 'Cursor', checked: true },
            { text: 'Antigravity', checked: false },
          ],
        },
        { type: 'blank' },
        { type: 'header', text: '  Creating files...' },
        { type: 'file', text: '  + promptscript.yaml', desc: 'config' },
        { type: 'file', text: '  + .promptscript/project.prs', desc: 'source' },
        { type: 'blank' },
        { type: 'done', text: '  Done! Run `prs compile` to generate outputs.' },
      ],
    },

    // Migration demo
    'migrate-demo': {
      showGeneratedFiles: false,
      steps: [
        { type: 'command', text: 'prs init --migrate' },
        { type: 'blank' },
        { type: 'header', text: '  PromptScript Migration' },
        { type: 'blank' },
        { type: 'detect', text: '  Scanning for existing AI instructions...', delay: DETECT_DELAY },
        { type: 'found', text: '  ● Found CLAUDE.md (2.4 KB)' },
        { type: 'found', text: '  ● Found .cursorrules (1.8 KB)' },
        { type: 'found', text: '  ● Found .github/copilot-instructions.md (1.2 KB)' },
        { type: 'blank' },
        { type: 'detect', text: '  Detecting project...', delay: DETECT_DELAY },
        { type: 'success', text: '  ✓ Python 3.11 detected' },
        { type: 'success', text: '  ✓ FastAPI detected' },
        { type: 'success', text: '  ✓ pytest detected' },
        { type: 'blank' },
        { type: 'question', text: '  ? Select output targets:' },
        {
          type: 'checkboxes',
          options: [
            { text: 'GitHub Copilot', checked: true },
            { text: 'Claude Code', checked: true },
            { text: 'Cursor', checked: true },
            { text: 'Antigravity', checked: false },
          ],
        },
        { type: 'blank' },
        { type: 'header', text: '  Creating files...' },
        { type: 'file', text: '  + promptscript.yaml', desc: 'config' },
        { type: 'file', text: '  + .promptscript/project.prs', desc: 'template' },
        { type: 'file', text: '  + .claude/skills/migrate/SKILL.md', desc: 'skill' },
        { type: 'file', text: '  + .github/prompts/migrate.prompt.md', desc: 'prompt' },
        { type: 'file', text: '  + .cursor/commands/migrate.md', desc: 'command' },
        { type: 'blank' },
        { type: 'done', text: '  Done! Use /migrate in your AI tool to start migration.' },
      ],
    },
  };

  var demoStates = {};

  function initAllDemos() {
    Object.keys(DEMO_CONFIGS).forEach(function (demoId) {
      initDemo(demoId);
    });
  }

  function initDemo(demoId) {
    var demo = document.getElementById(demoId);
    if (!demo) return;

    // Skip if already initialized
    if (demo.dataset.initialized) return;
    demo.dataset.initialized = 'true';

    var output = demo.querySelector('.init-demo__output');
    if (!output) return;

    // Initialize state for this demo
    demoStates[demoId] = {
      hasPlayed: false,
      animationTimer: null,
      animationRunning: false,
    };

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (
            entry.isIntersecting &&
            !demoStates[demoId].hasPlayed &&
            !demoStates[demoId].animationRunning
          ) {
            demoStates[demoId].hasPlayed = true;
            observer.disconnect();
            startAnimation(demoId, demo, output);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(demo);

    // Add replay button handler (only once)
    var replayBtn = demo.querySelector('.init-demo__replay');
    if (replayBtn && !replayBtn.dataset.initialized) {
      replayBtn.dataset.initialized = 'true';
      replayBtn.addEventListener('click', function () {
        // Stop current animation if running
        if (demoStates[demoId].animationTimer) {
          clearTimeout(demoStates[demoId].animationTimer);
          demoStates[demoId].animationTimer = null;
        }
        demoStates[demoId].animationRunning = false;
        demo.classList.remove('init-demo--complete');
        clearElement(output);
        startAnimation(demoId, demo, output);
      });
    }
  }

  function clearElement(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function startAnimation(demoId, demo, output) {
    var config = DEMO_CONFIGS[demoId];
    if (!config) return;

    var state = demoStates[demoId];
    state.animationRunning = true;
    clearElement(output);
    demo.classList.remove('init-demo--complete');

    var stepIndex = 0;
    var steps = config.steps;

    function processNextStep() {
      if (stepIndex >= steps.length) {
        state.animationRunning = false;
        // Add complete class to trigger layout transition (if showing generated files)
        if (config.showGeneratedFiles !== false) {
          setTimeout(function () {
            demo.classList.add('init-demo--complete');
            // Scroll to bottom immediately and after transition completes
            scrollToBottom(output);
            setTimeout(function () {
              scrollToBottom(output);
            }, 100);
            setTimeout(function () {
              scrollToBottom(output);
            }, 500);
          }, 600);
        }
        return;
      }

      var step = steps[stepIndex];
      stepIndex++;

      renderStep(output, step, function () {
        var delay = step.delay || LINE_DELAY;
        if (step.type === 'options' || step.type === 'checkboxes') {
          delay = SELECT_DELAY;
        }
        state.animationTimer = setTimeout(processNextStep, delay);
      });
    }

    processNextStep();
  }

  function createSpan(className, text) {
    var span = document.createElement('span');
    if (className) span.className = className;
    if (text) span.textContent = text;
    return span;
  }

  function renderStep(container, step, callback) {
    var line = document.createElement('div');
    line.className = 'init-demo__line';

    switch (step.type) {
      case 'command':
        line.className += ' init-demo__line--command';
        typeText(line, container, '$ ' + step.text, callback);
        return;

      case 'blank':
        line.textContent = '\u00A0';
        container.appendChild(line);
        callback();
        break;

      case 'header':
        line.className += ' init-demo__line--header';
        line.textContent = step.text;
        container.appendChild(line);
        fadeIn(line);
        callback();
        break;

      case 'detect':
        line.className += ' init-demo__line--detect';
        var spinner = createSpan('init-demo__spinner');
        line.appendChild(spinner);
        line.appendChild(document.createTextNode(step.text));
        container.appendChild(line);
        fadeIn(line);
        setTimeout(callback, step.delay || DETECT_DELAY);
        break;

      case 'success':
        line.className += ' init-demo__line--success';
        line.textContent = step.text;
        container.appendChild(line);
        fadeIn(line);
        callback();
        break;

      case 'found':
        line.className += ' init-demo__line--found';
        line.textContent = step.text;
        container.appendChild(line);
        fadeIn(line);
        callback();
        break;

      case 'info':
        line.className += ' init-demo__line--info';
        var infoSpinner = createSpan('init-demo__spinner');
        line.appendChild(infoSpinner);
        line.appendChild(document.createTextNode(step.text));
        container.appendChild(line);
        fadeIn(line);
        setTimeout(callback, DETECT_DELAY);
        break;

      case 'question':
        line.className += ' init-demo__line--question';
        line.textContent = step.text;
        container.appendChild(line);
        fadeIn(line);
        callback();
        break;

      case 'options':
        renderOptions(container, step.options, callback);
        return;

      case 'checkboxes':
        renderCheckboxes(container, step.options, callback);
        return;

      case 'file':
        line.className += ' init-demo__line--file';
        var filePath = createSpan('init-demo__file-path', step.text);
        var fileDesc = createSpan('init-demo__file-desc', step.desc);
        line.appendChild(filePath);
        line.appendChild(fileDesc);
        container.appendChild(line);
        fadeIn(line);
        callback();
        break;

      case 'done':
        line.className += ' init-demo__line--done';
        line.textContent = step.text;
        container.appendChild(line);
        fadeIn(line);
        callback();
        break;

      default:
        line.textContent = step.text || '';
        container.appendChild(line);
        callback();
    }

    scrollToBottom(container);
  }

  function renderOptions(container, options, callback) {
    var optionsContainer = document.createElement('div');
    optionsContainer.className = 'init-demo__options';

    options.forEach(function (opt, index) {
      var optLine = document.createElement('div');
      optLine.className = 'init-demo__option';
      if (opt.highlight) {
        optLine.className += ' init-demo__option--highlight';
      }

      var indicator = opt.highlight ? '>' : ' ';
      var radio = opt.highlight ? '●' : '○';

      var indicatorSpan = createSpan('init-demo__option-indicator', indicator);
      var radioSpan = createSpan('init-demo__option-radio', radio);
      var textSpan = createSpan('init-demo__option-text', opt.text);

      optLine.appendChild(indicatorSpan);
      optLine.appendChild(radioSpan);
      optLine.appendChild(textSpan);
      optionsContainer.appendChild(optLine);

      setTimeout(function () {
        fadeIn(optLine);
      }, index * 100);
    });

    container.appendChild(optionsContainer);
    scrollToBottom(container);

    setTimeout(
      function () {
        var highlighted = optionsContainer.querySelector('.init-demo__option--highlight');
        if (highlighted) {
          highlighted.classList.add('init-demo__option--selected');
        }
        callback();
      },
      options.length * 100 + 400
    );
  }

  function renderCheckboxes(container, options, callback) {
    var checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'init-demo__checkboxes';

    options.forEach(function (opt, index) {
      var checkLine = document.createElement('div');
      checkLine.className = 'init-demo__checkbox';
      if (opt.checked) {
        checkLine.className += ' init-demo__checkbox--checked';
      }

      var checkbox = opt.checked ? '✓' : ' ';

      var boxSpan = createSpan('init-demo__checkbox-box', '[' + checkbox + ']');
      var textSpan = createSpan('init-demo__checkbox-text', opt.text);

      checkLine.appendChild(boxSpan);
      checkLine.appendChild(textSpan);
      checkboxContainer.appendChild(checkLine);

      setTimeout(function () {
        fadeIn(checkLine);
      }, index * 100);
    });

    container.appendChild(checkboxContainer);
    scrollToBottom(container);

    setTimeout(callback, options.length * 100 + 200);
  }

  function typeText(element, container, text, callback) {
    container.appendChild(element);
    element.textContent = '';

    var charIndex = 0;
    function typeNext() {
      if (charIndex < text.length) {
        element.textContent += text[charIndex];
        charIndex++;
        scrollToBottom(container);
        setTimeout(typeNext, TYPING_SPEED);
      } else {
        callback();
      }
    }
    typeNext();
  }

  function fadeIn(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(5px)';
    element.offsetHeight;
    element.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  }

  function scrollToBottom(container) {
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllDemos);
  } else {
    initAllDemos();
  }

  // Re-initialize on MkDocs page navigation
  if (typeof document$ !== 'undefined') {
    document$.subscribe(function () {
      Object.keys(demoStates).forEach(function (demoId) {
        if (demoStates[demoId].animationTimer) {
          clearTimeout(demoStates[demoId].animationTimer);
        }
        demoStates[demoId] = {
          hasPlayed: false,
          animationTimer: null,
          animationRunning: false,
        };
      });
      initAllDemos();
    });
  }
})();

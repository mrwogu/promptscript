import { usePlaygroundStore, type FileState } from '../store';

interface Example {
  id: string;
  name: string;
  description: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  files: FileState[];
}

const EXAMPLES: Example[] = [
  // === BEGINNER ===
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'The simplest possible configuration',
    complexity: 'beginner',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "hello-world"
  syntax: "1.0.0"
}

@identity {
  """
  You are a helpful AI assistant.
  """
}
`,
      },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal Setup',
    description: 'Basic identity with multiline description',
    complexity: 'beginner',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "minimal-project"
  syntax: "1.0.0"
}

@identity {
  """
  You are a helpful AI assistant.
  You provide clear and concise answers.
  You ask for clarification when needed.
  """
}
`,
      },
    ],
  },
  {
    id: 'with-context',
    name: 'With Context',
    description: 'Adding project context and environment info',
    complexity: 'beginner',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "context-example"
  syntax: "1.0.0"
}

@identity {
  """
  You are a coding assistant for web development.
  You write modern, accessible code.
  """
}

@context {
  """
  This is a React frontend project using TypeScript.
  We use Tailwind CSS for styling.
  The project follows component-driven development.
  """
}
`,
      },
    ],
  },

  // === INTERMEDIATE ===
  {
    id: 'with-standards',
    name: 'With Standards',
    description: 'Configuration with coding standards and restrictions',
    complexity: 'intermediate',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "coding-assistant"
  syntax: "1.0.0"
  tags: [development, typescript]
}

@identity {
  """
  You are an expert software developer.
  You write clean, maintainable, and well-tested code.
  """
}

@context {
  languages: ["TypeScript", "JavaScript"]
  runtime: "Node.js 20+"
  testing: "Vitest"
}

@standards {
  code: {
    languages: ["TypeScript"]
    frameworks: ["React 18", "Vite"]
    testing: ["Vitest", "Testing Library"]
  }
  documentation: ["JSDoc comments", "README updates"]
  git: {
    format: "Conventional Commits"
    types: ["feat", "fix", "docs", "chore", "refactor"]
  }
}

@restrictions {
  - "Never write untested code"
  - "Always handle errors properly"
  - "Don't use 'any' type in TypeScript"
  - "Don't commit secrets or credentials"
}
`,
      },
    ],
  },
  {
    id: 'with-inheritance',
    name: 'With Inheritance',
    description: 'Using @inherit to extend shared base configs',
    complexity: 'intermediate',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "frontend-project"
  syntax: "1.0.0"
}

# Inherit from promptscript-registry (github.com/mrwogu/promptscript-registry)
@inherit @core/base
@use @core/quality
@use @core/security

@context {
  """
  This is a React frontend project.
  We use TypeScript and Tailwind CSS.
  State management with Zustand.
  """
}

@standards {
  frameworks: ["React 18", "TypeScript 5", "Tailwind CSS"]
  testing: ["Vitest", "Playwright"]
}

@restrictions {
  - "Use functional components with hooks"
  - "No class components"
  - "Keep components under 200 lines"
}
`,
      },
    ],
  },
  {
    id: 'multi-file',
    name: 'Multi-File Project',
    description: 'Local inheritance with shared base configuration',
    complexity: 'intermediate',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "team-project"
  syntax: "1.0.0"
}

# Inherit from local base file
@inherit ./base

@context {
  languages: ["TypeScript", "React"]
  runtime: "Node.js 20+"
}

@standards {
  code: {
    languages: ["TypeScript"]
    frameworks: ["React 18", "Vite"]
    testing: ["Vitest", "Testing Library"]
  }
}

@restrictions {
  - "Use Zustand for state management"
  - "Keep bundle size under 200KB"
}
`,
      },
      {
        path: 'base.prs',
        content: `@meta {
  id: "team-base"
  syntax: "1.0.0"
}

@identity {
  """
  You are a helpful team assistant.
  You follow our established conventions.
  You prioritize code quality and maintainability.
  """
}

@standards {
  git: {
    format: "Conventional Commits"
    types: ["feat", "fix", "docs", "chore", "refactor", "test"]
  }
  documentation: ["README", "JSDoc", "CHANGELOG"]
}

@restrictions {
  - "Don't commit without tests"
  - "Don't push directly to main"
  - "Always request code review"
}
`,
      },
    ],
  },

  // === ADVANCED ===
  {
    id: 'with-skills',
    name: 'With Skills & Shortcuts',
    description: 'Custom skills and shortcuts for automation',
    complexity: 'advanced',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "skills-example"
  syntax: "1.0.0"
}

@identity {
  """
  You are a development assistant with custom skills.
  You help developers write better code through reviews and testing.
  """
}

@context {
  languages: ["TypeScript", "JavaScript"]
  runtime: "Node.js 20+"
  frameworks: ["React", "Vite"]
}

@skills {
  review: {
    description: "Review code for bugs and improvements"
    content: """
    When reviewing code:
    1. Check for potential bugs and edge cases
    2. Suggest performance improvements
    3. Verify error handling is complete
    4. Check for security vulnerabilities
    """
  }
  test: {
    description: "Run tests and analyze coverage"
    content: """
    When running tests:
    1. Execute the test suite with coverage
    2. Report failures clearly with context
    3. Suggest missing test cases
    4. Verify edge cases are covered
    """
  }
  refactor: {
    description: "Refactor code for better maintainability"
    content: """
    When refactoring:
    1. Identify code smells and duplication
    2. Apply SOLID principles
    3. Improve naming and readability
    4. Ensure tests still pass
    """
  }
}

@shortcuts {
  "/review": "Run the review skill on current file"
  "/test": "Run the test skill"
  "/refactor": "Refactor the selected code"
  "/docs": "Generate documentation"
}

@restrictions {
  - "Always explain your reasoning"
  - "Ask for clarification when unsure"
  - "Never skip writing tests"
}
`,
      },
    ],
  },
  {
    id: 'with-guards',
    name: 'With Guards',
    description: 'File-pattern guards for context-specific rules',
    complexity: 'advanced',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "guards-example"
  syntax: "1.0.0"
}

@identity {
  """
  You are an expert full-stack developer.
  You understand different contexts require different rules.
  """
}

@context {
  languages: ["TypeScript"]
  runtime: "Node.js 20+"
}

@guards {
  # Apply TypeScript rules to all TS files
  globs: ["**/*.ts", "**/*.tsx"]

  # Testing-specific rules
  testing: {
    applyTo: ["**/*.test.ts", "**/*.spec.ts", "**/__tests__/**"]
    description: "Testing rules"
    content: """
    - Use describe/it blocks for organization
    - Follow AAA pattern (Arrange, Act, Assert)
    - Mock external dependencies
    - Test edge cases and error conditions
    """
  }

  # Component-specific rules
  components: {
    applyTo: ["**/components/**/*.tsx"]
    description: "React component rules"
    content: """
    - Use functional components with hooks
    - Keep components focused and small
    - Extract logic into custom hooks
    - Use TypeScript for props interfaces
    """
  }
}

@standards {
  code: {
    languages: ["TypeScript"]
    testing: ["Vitest"]
  }
}
`,
      },
    ],
  },
  {
    id: 'with-agents',
    name: 'With Agents',
    description: 'Custom AI agents with specific roles',
    complexity: 'advanced',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "agents-example"
  syntax: "1.0.0"
}

@identity {
  """
  You are a development team coordinator.
  You can delegate tasks to specialized agents.
  """
}

@agents {
  coder: {
    description: "Expert code writer"
    model: "sonnet"
    tools: ["Read", "Edit", "Write", "Bash"]
    content: """
    You are an expert code writer.
    You write clean, efficient, and well-documented code.
    You follow established patterns in the codebase.
    """
  }
  reviewer: {
    description: "Code review specialist"
    model: "sonnet"
    tools: ["Read", "Grep", "Glob"]
    content: """
    You are a code review specialist.
    You identify bugs, security issues, and improvements.
    You provide constructive feedback.
    """
  }
  tester: {
    description: "Test writing specialist"
    model: "haiku"
    tools: ["Read", "Write", "Bash"]
    content: """
    You are a test writing specialist.
    You write comprehensive unit and integration tests.
    You ensure good coverage of edge cases.
    """
  }
}

@skills {
  implement: {
    description: "Implement a feature using the coder agent"
    content: "Delegate implementation to the coder agent"
  }
  review: {
    description: "Review code using the reviewer agent"
    content: "Delegate review to the reviewer agent"
  }
}

@shortcuts {
  "/implement": "Start implementing a feature"
  "/review": "Review recent changes"
  "/test": "Write tests for current code"
}
`,
      },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Setup',
    description: 'Full enterprise configuration with all features',
    complexity: 'advanced',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "enterprise-project"
  syntax: "1.0.0"
  tags: [enterprise, typescript, react]
}

# Inherit from local file + registry (github.com/mrwogu/promptscript-registry)
@inherit ./org-base
@use @core/security

@context {
  """
  Enterprise React application with strict security requirements.
  Follows organizational coding standards and compliance rules.
  """

  languages: ["TypeScript"]
  runtime: "Node.js 20 LTS"
  frameworks: ["React 18", "Next.js 14"]
  infrastructure: ["AWS", "Docker", "Kubernetes"]
}

@skills {
  "security-review": {
    description: "Review code for security vulnerabilities"
    content: """
    Perform security review:
    1. Check for OWASP Top 10 vulnerabilities
    2. Verify input validation and sanitization
    3. Check authentication and authorization
    4. Review data exposure and logging
    5. Verify secure communication
    """
  }
  deploy: {
    description: "Prepare deployment checklist"
    content: """
    Deployment preparation:
    1. Run full test suite
    2. Check for security vulnerabilities
    3. Verify environment variables
    4. Update changelog
    5. Create release notes
    """
  }
}

@guards {
  api: {
    applyTo: ["**/api/**", "**/routes/**"]
    description: "API security rules"
    content: """
    - Validate all input parameters
    - Use parameterized queries
    - Implement rate limiting
    - Log security events
    """
  }
  auth: {
    applyTo: ["**/auth/**", "**/middleware/**"]
    description: "Authentication rules"
    content: """
    - Never log credentials
    - Use secure session management
    - Implement proper CORS
    - Use HTTPS only
    """
  }
}

@shortcuts {
  "/security": "Run security review"
  "/deploy": "Prepare deployment"
  "/audit": "Run compliance audit"
}

@restrictions {
  - "All API endpoints must have authentication"
  - "No secrets in code - use environment variables"
  - "All user input must be validated"
  - "PII must be encrypted at rest"
  - "Changes require security team approval"
}
`,
      },
      {
        path: 'org-base.prs',
        content: `@meta {
  id: "org-base"
  syntax: "1.0.0"
}

@identity {
  """
  You are an enterprise development assistant.
  You follow strict organizational standards.
  Security and compliance are top priorities.
  """
}

@standards {
  code: {
    languages: ["TypeScript"]
    strictMode: true
    exports: "named only"
  }
  git: {
    format: "Conventional Commits"
    types: ["feat", "fix", "docs", "chore", "refactor", "test", "security"]
    requireIssueReference: true
  }
  documentation: {
    required: ["README", "API docs", "CHANGELOG", "SECURITY.md"]
  }
  testing: {
    minimumCoverage: 80
    requiredTypes: ["unit", "integration", "e2e"]
  }
}

@restrictions {
  - "No direct database queries - use ORM"
  - "All functions must have return type annotations"
  - "No console.log in production code"
  - "Dependencies must be approved"
  - "No force push to protected branches"
}
`,
      },
    ],
  },
];

const COMPLEXITY_COLORS = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-purple-500/20 text-purple-400',
};

const COMPLEXITY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function ExampleGallery() {
  const setFiles = usePlaygroundStore((s) => s.setFiles);
  const setShowExamples = usePlaygroundStore((s) => s.setShowExamples);

  const loadExample = (example: Example) => {
    setFiles(example.files);
    setShowExamples(false);
  };

  // Group examples by complexity
  const beginnerExamples = EXAMPLES.filter((e) => e.complexity === 'beginner');
  const intermediateExamples = EXAMPLES.filter((e) => e.complexity === 'intermediate');
  const advancedExamples = EXAMPLES.filter((e) => e.complexity === 'advanced');

  const renderExampleCard = (example: Example) => (
    <button
      key={example.id}
      onClick={() => loadExample(example)}
      className="text-left p-4 bg-ps-bg rounded-lg hover:bg-ps-border transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-white">{example.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded ${COMPLEXITY_COLORS[example.complexity]}`}>
          {COMPLEXITY_LABELS[example.complexity]}
        </span>
      </div>
      <p className="text-sm text-gray-400 mt-1">{example.description}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className="text-xs text-gray-500">
          {example.files.length} file{example.files.length !== 1 ? 's' : ''}
        </span>
        {example.files.some((f) => f.content.includes('@inherit')) && (
          <span className="text-xs px-2 py-0.5 bg-ps-primary/20 text-ps-primary rounded">
            inheritance
          </span>
        )}
        {example.files.some((f) => f.content.includes('@use')) && (
          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">imports</span>
        )}
        {example.files.some((f) => f.content.includes('@skills')) && (
          <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">
            skills
          </span>
        )}
        {example.files.some((f) => f.content.includes('@guards')) && (
          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">guards</span>
        )}
        {example.files.some((f) => f.content.includes('@agents')) && (
          <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">agents</span>
        )}
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-ps-surface rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-ps-border">
          <h2 className="text-lg font-semibold">Example Gallery</h2>
          <button onClick={() => setShowExamples(false)} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Beginner */}
          <section>
            <h3 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Getting Started
            </h3>
            <div className="grid gap-3">{beginnerExamples.map(renderExampleCard)}</div>
          </section>

          {/* Intermediate */}
          <section>
            <h3 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full" />
              Intermediate
            </h3>
            <div className="grid gap-3">{intermediateExamples.map(renderExampleCard)}</div>
          </section>

          {/* Advanced */}
          <section>
            <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full" />
              Advanced
            </h3>
            <div className="grid gap-3">{advancedExamples.map(renderExampleCard)}</div>
          </section>
        </div>

        <div className="p-4 border-t border-ps-border text-center text-sm text-gray-500">
          Click an example to load it into the editor
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { usePlaygroundStore, type FileState } from '../store';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface Example {
  id: string;
  name: string;
  description: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  files: FileState[];
  /** Optional environment variables to set when loading this example */
  envVars?: Record<string, string>;
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
    id: 'with-env-vars',
    name: 'Environment Variables',
    description: 'Using ${VAR} and ${VAR:-default} for dynamic configuration',
    complexity: 'intermediate',
    envVars: {
      PROJECT_NAME: 'My Awesome Project',
      API_VERSION: 'v2',
      TEAM_NAME: 'Platform Team',
    },
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "env-vars-example"
  syntax: "1.0.0"
}

@identity {
  """
  You are an assistant for \${PROJECT_NAME}.
  You help the \${TEAM_NAME} build great software.
  """
}

@context {
  """
  Project: \${PROJECT_NAME}
  API Version: \${API_VERSION}
  Team: \${TEAM_NAME}
  Environment: \${ENVIRONMENT:-development}
  Debug Mode: \${DEBUG:-false}
  """

  # Object properties also support env vars
  project: "\${PROJECT_NAME}"
  apiVersion: "\${API_VERSION}"
  logLevel: "\${LOG_LEVEL:-info}"
}

@standards {
  # Env vars work in nested structures too
  api: {
    version: "\${API_VERSION}"
    baseUrl: "\${API_BASE_URL:-https://api.example.com}"
  }
}

@restrictions {
  - "Follow \${TEAM_NAME} coding guidelines"
  - "Use \${API_VERSION} API endpoints"
  - "Log level must be \${LOG_LEVEL:-info} or higher"
}
`,
      },
    ],
  },
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
    id: 'parameterized-templates',
    name: 'Parameterized Templates',
    description: 'Reusable templates with {{variable}} interpolation',
    complexity: 'intermediate',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "my-react-app"
  syntax: "1.0.0"
}

# Inherit from template with parameters
@inherit ./react-template(projectName: "Checkout App", port: 8080, strict: true)

@identity {
  """
  You specialize in e-commerce checkout flows.
  You understand payment integrations and cart management.
  """
}

@context {
  """
  E-commerce checkout application with Stripe integration.
  """
}
`,
      },
      {
        path: 'react-template.prs',
        content: `@meta {
  id: "react-template"
  syntax: "1.0.0"
  params: {
    # Required: Name of the project
    projectName: string

    # Optional: Development server port (default: 3000)
    port: number = 3000

    # Optional: Enable strict mode (default: true)
    strict: boolean = true

    # Optional: Test framework choice
    testFramework: enum("vitest", "jest") = "vitest"
  }
}

@identity {
  """
  You are a React developer working on {{projectName}}.
  You follow best practices and write clean code.
  """
}

@context {
  project: {{projectName}}
  devServer: "http://localhost:{{port}}"
  strictMode: {{strict}}
  testing: {{testFramework}}
}

@standards {
  code: {
    language: "TypeScript"
    framework: "React 18"
    testing: "{{testFramework}}"
  }
}

@restrictions {
  - "Use functional components only"
  - "Test coverage must be above 80%"
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

  {
    id: 'with-knowledge',
    name: 'Knowledge & Commands',
    description: 'External knowledge, commands, and local instructions',
    complexity: 'intermediate',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "knowledge-example"
  syntax: "1.2.0"
}

@identity {
  """
  You are a full-stack developer for an e-commerce platform.
  """
}

@knowledge {
  """
  Our database uses PostgreSQL 16 with the following key tables:
  - users (id, email, role, created_at)
  - orders (id, user_id, total, status, created_at)
  - products (id, name, price, stock, category)

  API rate limits: 100 req/min for standard, 1000 req/min for premium.
  """
}

@commands {
  db-schema: {
    description: "Show current database schema"
    content: """
    Query the database schema and display all tables,
    columns, and relationships in a readable format.
    """
  }
  migrate: {
    description: "Generate a database migration"
    content: """
    Create a new migration file following our naming convention:
    YYYY-MM-DD-description.sql
    """
  }
}

@local {
  """
  Personal dev notes:
  - Staging DB at staging.db.internal:5432
  - Use feature flags for new checkout flow
  """
}
`,
      },
    ],
  },
  {
    id: 'with-block-filtering',
    name: 'Import Filtering',
    description: 'Selective block imports with only/exclude',
    complexity: 'intermediate',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "filtered-imports"
  syntax: "1.2.0"
}

# Import only standards and restrictions from shared config
@use ./shared only=["standards", "restrictions"]

@identity {
  """
  You are a backend API developer.
  You build scalable REST services.
  """
}

@context {
  languages: ["Go"]
  runtime: "Go 1.22"
  frameworks: ["Chi router", "sqlc"]
}
`,
      },
      {
        path: 'shared.prs',
        content: `@meta {
  id: "shared-config"
  syntax: "1.2.0"
}

@identity {
  """
  This identity block will NOT be imported (filtered out).
  """
}

@standards {
  code: {
    testing: ["table-driven tests"]
    errorHandling: "return errors, don't panic"
  }
  git: {
    format: "Conventional Commits"
  }
}

@restrictions {
  - "No global mutable state"
  - "All public functions must have godoc"
  - "Errors must wrap with fmt.Errorf"
}

@context {
  """
  This context block will NOT be imported (filtered out).
  """
}
`,
      },
    ],
  },

  // === ADVANCED ===
  {
    id: 'with-examples',
    name: 'Few-Shot Examples',
    description: 'Structured input/output examples for teaching AI patterns',
    complexity: 'advanced',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "few-shot-examples"
  syntax: "1.2.0"
}

@identity {
  """
  You are a code review assistant.
  You transform code to match project conventions.
  """
}

@examples {
  error-handling: {
    description: "Wrap async calls in try/catch with typed errors"
    input: """
      async function getUser(id: string) {
        const res = await fetch(\`/api/users/\${id}\`);
        return res.json();
      }
    """
    output: """
      async function getUser(id: string): Promise<User> {
        try {
          const res = await fetch(\`/api/users/\${id}\`);
          if (!res.ok) throw new HttpError(res.status);
          return res.json() as Promise<User>;
        } catch (err) {
          logger.error('getUser failed', { id, err });
          throw err;
        }
      }
    """
  }

  naming-convention: {
    description: "Use camelCase for variables, PascalCase for types"
    input: "const user_name: user_type = get_user();"
    output: "const userName: UserType = getUser();"
  }

  explicit-return-types: {
    input: "function add(a: number, b: number) { return a + b; }"
    output: "function add(a: number, b: number): number { return a + b; }"
  }
}

@standards {
  code: {
    language: "TypeScript"
    strictMode: true
  }
}
`,
      },
    ],
  },
  {
    id: 'with-guard-requires',
    name: 'Guard Dependencies',
    description: 'Guards that automatically pull in related rules via requires',
    complexity: 'advanced',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "guard-dependencies"
  syntax: "1.2.0"
}

@identity {
  """
  You are a backend developer for a Node.js API.
  """
}

@guards {
  # When editing controllers, validation + security rules are auto-injected
  "api-controllers": {
    applyTo: ["**/controllers/**/*.ts"]
    requires: ["api-validation", "api-security"]
    content: """
      Controller rules:
      - Use dependency injection for services
      - Return typed response DTOs
      - Keep controllers thin, delegate to services
    """
  }

  "api-validation": {
    applyTo: ["**/validators/**/*.ts", "**/dto/**/*.ts"]
    content: """
      Validation rules:
      - Use class-validator decorators on DTOs
      - Validate all request parameters
      - Return structured validation errors
    """
  }

  "api-security": {
    applyTo: ["**/guards/**/*.ts", "**/middleware/**/*.ts"]
    requires: ["api-validation"]
    content: """
      Security rules:
      - Validate JWT tokens on protected routes
      - Implement role-based access control
      - Log all unauthorized access attempts
    """
  }

  # Context library: no applyTo, used only via requires
  "shared-conventions": {
    content: """
      Shared conventions:
      - Use kebab-case for file names
      - Named exports only, no default exports
      - Follow Conventional Commits
    """
  }
}

@standards {
  code: {
    language: "TypeScript"
    runtime: "Node.js 20+"
    framework: "NestJS"
  }
}
`,
      },
    ],
  },
  {
    id: 'with-skills-and-examples',
    name: 'Skills with Examples',
    description: 'Skills with embedded few-shot examples for precise behavior',
    complexity: 'advanced',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "skills-with-examples"
  syntax: "1.2.0"
}

@identity {
  """
  You are a development assistant with specialized skills.
  """
}

@skills {
  commit: {
    description: "Create commits following conventional format"
    examples: {
      feature: {
        description: "New feature commit"
        input: "Added dark mode toggle to settings page"
        output: "feat(settings): add dark mode toggle"
      }
      bugfix: {
        description: "Bug fix commit"
        input: "Fixed null pointer when user has no avatar"
        output: "fix(profile): handle missing avatar gracefully"
      }
      breaking: {
        description: "Breaking change"
        input: "Renamed /api/users to /api/accounts"
        output: "feat(api)!: rename users endpoint to accounts"
      }
    }
    content: """
      Format: type(scope): description
      Types: feat, fix, docs, refactor, test, chore
      Keep subject under 72 characters.
      Use imperative mood.
    """
  }

  review: {
    description: "Review code for quality and correctness"
    examples: {
      good-review: {
        input: "let x = arr.length > 0 ? arr[0] : null"
        output: "const firstItem = arr.at(0) ?? null  // Use .at() and const"
      }
    }
    content: """
      When reviewing:
      1. Check for bugs and edge cases
      2. Verify error handling
      3. Suggest naming improvements
      4. Flag security concerns
    """
  }
}

@shortcuts {
  "/commit": "Create a commit message"
  "/review": "Review the current file"
}
`,
      },
    ],
  },
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
  syntax: "1.2.0"
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
    description: 'Full enterprise config with examples, guards, requires, and more',
    complexity: 'advanced',
    files: [
      {
        path: 'project.prs',
        content: `@meta {
  id: "enterprise-project"
  syntax: "1.2.0"
  tags: [enterprise, typescript, react]
}

# Inherit from local file + registry
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

@examples {
  api-error-response: {
    description: "Standard API error response format"
    input: "throw new Error('User not found')"
    output: """
      throw new ApiError({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        status: 404,
      });
    """
  }
}

@skills {
  "security-review": {
    description: "Review code for security vulnerabilities"
    examples: {
      sql-injection: {
        input: "db.query('SELECT * FROM users WHERE id = ' + userId)"
        output: "db.query('SELECT * FROM users WHERE id = $1', [userId])"
      }
    }
    content: """
      Perform security review:
      1. Check for OWASP Top 10 vulnerabilities
      2. Verify input validation and sanitization
      3. Check authentication and authorization
    """
  }
  deploy: {
    description: "Prepare deployment checklist"
    content: """
      Deployment preparation:
      1. Run full test suite
      2. Check for security vulnerabilities
      3. Verify environment variables
    """
  }
}

@guards {
  api: {
    applyTo: ["**/api/**", "**/routes/**"]
    requires: ["shared-security"]
    description: "API security rules"
    content: """
      - Validate all input parameters
      - Use parameterized queries
      - Implement rate limiting
    """
  }
  auth: {
    applyTo: ["**/auth/**", "**/middleware/**"]
    requires: ["shared-security"]
    description: "Authentication rules"
    content: """
      - Never log credentials
      - Use secure session management
      - Implement proper CORS
    """
  }
  "shared-security": {
    content: """
      - All endpoints require HTTPS
      - Log security events to audit trail
      - Follow principle of least privilege
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
  const setEnvVars = usePlaygroundStore((s) => s.setEnvVars);
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowExamples(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setShowExamples]);

  const loadExample = (example: Example) => {
    setFiles(example.files);
    // Set env vars if the example has them, otherwise clear them
    setEnvVars(example.envVars ?? {});
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
        {example.files.some((f) => f.content.includes('@examples')) && (
          <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
            examples
          </span>
        )}
        {example.files.some((f) => /requires:\s*\[/.test(f.content)) && (
          <span className="text-xs px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded">requires</span>
        )}
        {example.files.some((f) => f.content.includes('@knowledge')) && (
          <span className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded">
            knowledge
          </span>
        )}
        {example.files.some((f) => f.content.includes('@commands')) && (
          <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded">
            commands
          </span>
        )}
        {example.files.some((f) => /only=|exclude=/.test(f.content)) && (
          <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded">
            filtering
          </span>
        )}
        {example.files.some((f) => f.content.includes('params:') && f.content.includes('{{')) && (
          <span className="text-xs px-2 py-0.5 bg-pink-500/20 text-pink-400 rounded">
            templates
          </span>
        )}
        {example.envVars && Object.keys(example.envVars).length > 0 && (
          <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
            env vars
          </span>
        )}
      </div>
    </button>
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => setShowExamples(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-title"
    >
      <div
        ref={modalRef}
        className="bg-ps-surface rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-ps-border">
          <h2 id="gallery-title" className="text-lg font-semibold">
            Example Gallery
          </h2>
          <button
            onClick={() => setShowExamples(false)}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
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

# CLAUDE.md

## Project

You are a frontend developer on the Frontend team.
You build modern, accessible web applications.

## Context

### Tech Stack

  - React 18 with TypeScript
  - Vite for development and building
  - TailwindCSS for styling
  - React Query for server state
  - Vitest + Testing Library for tests

  ### Architecture

  - Feature-based folder structure
  - Shared component library (@company/ui)
  - API client generation from OpenAPI specs

## Code Style

- Use TypeScript for all code
- Prefer functional programming style
- Use functional components with hooks
- React Query for server state, Zustand for client state
- Use Vitest as test framework
- Maintain 80% code coverage
- Write unit and integration tests
- Follow WCAG 2.1 AA guidelines
- Accessibility testing required

## Commands

```
/component - Create a new React component with tests
/hook      - Create a custom React hook
/test      - Write tests using Vitest and Testing Library
/a11y      - Review code for accessibility
```

## Don'ts

- Don't use class components
- Don't use any type without justification
- Always handle loading and error states
- Don't hardcode API URLs

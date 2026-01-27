---
name: 'code-reviewing'
description: 'Reviews code for bugs, security issues, and quality improvements. Use when reviewing pull requests, checking code quality, or when asked to review changes.'
---

<!-- PromptScript 2026-01-27T11:20:31.602Z - do not edit -->

# Code Reviewing

## Review Checklist

### Correctness

- [ ] Logic errors and edge cases
- [ ] Null/undefined handling
- [ ] Off-by-one errors
- [ ] Race conditions in async code
- [ ] Error handling completeness

### Security

- [ ] Input validation and sanitization
- [ ] SQL/command injection risks
- [ ] XSS vulnerabilities
- [ ] Sensitive data exposure
- [ ] Authentication/authorization checks

### Quality

- [ ] Code readability and clarity
- [ ] Function size and complexity
- [ ] Naming conventions
- [ ] DRY principle adherence
- [ ] SOLID principles where applicable

### Performance

- [ ] Unnecessary computations
- [ ] N+1 query patterns
- [ ] Memory leaks
- [ ] Inefficient algorithms

## Feedback Format

Use this structure for each issue:

````markdown
**[SEVERITY]** Brief description

Location: `file:line`

Problem: What's wrong and why it matters

Suggestion: How to fix it

```code
// Suggested fix
```
````

```

Severity levels:
- **CRITICAL**: Security vulnerability or data loss risk
- **HIGH**: Bug that affects functionality
- **MEDIUM**: Code quality or maintainability issue
- **LOW**: Style or minor improvement

## Best Practices

1. **Be specific**: Point to exact lines, provide code examples
2. **Explain why**: Don't just say "bad", explain the impact
3. **Suggest fixes**: Offer concrete solutions
4. **Prioritize**: Focus on critical issues first
5. **Be constructive**: Phrase feedback helpfully
```

---
name: 'testing-code'
description: 'Writes comprehensive tests following AAA pattern. Use for unit and integration tests.'
---

<!-- PromptScript 2026-01-27T13:03:51.814Z - do not edit -->

# Testing Code

## AAA Pattern

Every test follows Arrange-Act-Assert:

```typescript
it('should return user when found', () => {
  // Arrange - set up test data and conditions
  const mockUser = { id: '1', name: 'Alice' };
  repository.findById.mockResolvedValue(mockUser);

  // Act - execute the code under test
  const result = await service.getUser('1');

  // Assert - verify expected outcome
  expect(result).toEqual(mockUser);
});
```

## Test Naming

Use descriptive names that explain behavior:

```typescript
// Good - describes behavior and condition
'should throw NotFoundError when user does not exist';
'returns empty array for invalid input';
'calculates total with tax when region is EU';

// Bad - vague or implementation-focused
'test getUser';
'works correctly';
'handles edge case';
```

## Test Doubles

| Type | Purpose                        | When to Use               |
| ---- | ------------------------------ | ------------------------- |
| Stub | Returns predetermined data     | Isolate from dependencies |
| Mock | Verifies interactions          | Test side effects         |
| Spy  | Records calls for verification | Observe without replacing |
| Fake | Working implementation         | Complex integrations      |

## Test Structure

```typescript
describe('UserService', () => {
  describe('getUser', () => {
    it('should return user when found', () => {});
    it('should throw NotFoundError when user does not exist', () => {});
    it('should cache result for subsequent calls', () => {});
  });

  describe('createUser', () => {
    it('should create user with valid data', () => {});
    it('should throw ValidationError for invalid email', () => {});
  });
});
```

## Rules

1. **One assertion concept per test** - test one behavior
2. **Independent tests** - no shared mutable state
3. **No implementation details** - test behavior, not internals
4. **Fast execution** - mock external dependencies
5. **Deterministic** - no flaky tests, no timing dependencies

## Coverage Targets

- **Unit tests**: 80%+ line coverage for business logic
- **Integration tests**: Critical paths and boundaries
- **E2E tests**: Core user journeys only

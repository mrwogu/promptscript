---
name: 'testing-code'
description: 'Writes comprehensive tests following AAA pattern'
---

<!-- PromptScript 2026-03-04T16:49:01.162Z - do not edit -->

## AAA Pattern

```typescript
it('should return user when found', () => {
  // Arrange - set up test data
  const mockUser = { id: '1', name: 'Alice' };

  // Act - execute code under test
  const result = service.getUser('1');

  // Assert - verify outcome
  expect(result).toEqual(mockUser);
});
```

## Rules

1. One assertion concept per test
2. Independent tests - no shared mutable state
3. Test behavior, not implementation
4. Fast execution - mock external dependencies

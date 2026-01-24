---
name: "refactoring"
description: "Improves code structure without changing behavior. Use when cleaning up code, reducing complexity, or when asked to refactor."
---

# Refactoring

## Golden Rule

**Change behavior OR change structure, never both at once.**

## Workflow

1. **Ensure tests exist** - Coverage before refactoring
2. **Make small changes** - One refactoring at a time
3. **Run tests frequently** - After each change
4. **Commit often** - Easy to revert if needed

## Common Refactorings

### Extract Function

Before:
```typescript
function processOrder(order: Order) {
  // 20 lines of validation
  // 30 lines of calculation
  // 15 lines of formatting
}
```

After:
```typescript
function processOrder(order: Order) {
  validateOrder(order);
  const total = calculateTotal(order);
  return formatReceipt(order, total);
}
```

### Replace Conditionals with Polymorphism

Before:
```typescript
function getPrice(type: string) {
  if (type === 'regular') return basePrice;
  if (type === 'premium') return basePrice * 1.5;
  if (type === 'vip') return basePrice * 2;
}
```

After:
```typescript
interface PricingStrategy {
  getPrice(basePrice: number): number;
}

const strategies: Record<string, PricingStrategy> = {
  regular: { getPrice: (p) => p },
  premium: { getPrice: (p) => p * 1.5 },
  vip: { getPrice: (p) => p * 2 },
};
```

### Simplify Conditionals

Before:
```typescript
if (user && user.isActive && user.subscription && user.subscription.isValid) {
```

After:
```typescript
function hasValidSubscription(user: User): boolean {
  return user?.isActive && user?.subscription?.isValid;
}

if (hasValidSubscription(user)) {
```

## Code Smells to Address

| Smell              | Refactoring                      |
| ------------------ | -------------------------------- |
| Long function      | Extract function                 |
| Duplicate code     | Extract and reuse                |
| Long parameter list| Introduce parameter object       |
| Feature envy       | Move method to appropriate class |
| Primitive obsession| Replace with value object        |
| Switch statements  | Replace with polymorphism        |

## When NOT to Refactor

- No test coverage (add tests first)
- Under time pressure (technical debt is ok short-term)
- Code is about to be replaced
- Refactoring scope is unclear

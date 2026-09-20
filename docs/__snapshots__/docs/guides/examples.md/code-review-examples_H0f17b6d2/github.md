# GitHub Copilot Instructions

## examples

### Example: missing-error-handling

Always wrap async calls in try/catch

**Input:**

```
async function fetchUser(id: string) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}
```

**Output:**

```
async function fetchUser(id: string) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    logger.error('fetchUser failed', { id, err });
    throw err;
  }
}
```
### Example: prefer-const

Use const for values that never change

**Input:**

```
let MAX_RETRIES = 3
```

**Output:**

```
const MAX_RETRIES = 3
```
### Example: explicit-return-type

Add return types to public functions

**Input:**

```
function add(a: number, b: number) { return a + b; }
```

**Output:**

```
function add(a: number, b: number): number { return a + b; }
```


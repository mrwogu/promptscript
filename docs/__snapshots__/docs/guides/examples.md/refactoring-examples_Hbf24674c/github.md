# GitHub Copilot Instructions

## examples

### Example: extract-function

Extract inline logic into a named function

**Input:**

```
const result = users
.filter(u => u.active && u.role === 'admin')
.map(u => u.email);
```

**Output:**

```
function getActiveAdminEmails(users: User[]): string[] {
  return users
    .filter(u => u.active && u.role === 'admin')
    .map(u => u.email);
}
```


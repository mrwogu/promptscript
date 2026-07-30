# CLAUDE.md

## Examples

### Example: feat-commit

Feature commit with scope

**Input:**

```
Added user authentication with JWT tokens
```

**Output:**

```
feat(auth): add JWT-based user authentication
```
### Example: multiline-example

**Input:**

```
const x = users.filter(u => u.active).map(u => u.email);
```

**Output:**

```
const activeEmails = users
.filter(u => u.active)
.map(u => u.email);
```

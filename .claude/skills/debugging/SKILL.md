---
name: 'debugging'
description: "Systematically debugs issues using scientific method. Use when investigating bugs, fixing errors, or when something isn't working as expected."
---

<!-- PromptScript 2026-01-27T11:20:31.603Z - do not edit -->

# Debugging

## Scientific Method

1. **Observe** - Gather information about the problem
2. **Hypothesize** - Form a theory about the cause
3. **Predict** - What would confirm/refute the hypothesis?
4. **Test** - Run experiment to verify
5. **Iterate** - Refine hypothesis based on results

## Debugging Workflow

### Step 1: Reproduce

```markdown
Reproduction checklist:

- [ ] Can reproduce consistently
- [ ] Identified minimal steps to trigger
- [ ] Documented exact error message
- [ ] Noted environment (OS, versions, config)
```

### Step 2: Isolate

Narrow down the problem:

- Binary search through code changes
- Comment out sections to find culprit
- Test with minimal input/config
- Check if issue exists in isolation

### Step 3: Investigate

```bash
# Check recent changes
git log --oneline -20
git diff HEAD~5

# Search for related code
grep -r "errorPattern" src/

# Check logs and stack traces
```

### Step 4: Fix

1. Understand the root cause (not just symptoms)
2. Write a failing test that reproduces the bug
3. Implement the fix
4. Verify the test passes
5. Check for similar issues elsewhere

### Step 5: Verify

```markdown
Verification checklist:

- [ ] Original issue is fixed
- [ ] Test added to prevent regression
- [ ] No new issues introduced
- [ ] Related code reviewed for similar bugs
```

## Common Patterns

| Symptom                 | Check First                       |
| ----------------------- | --------------------------------- |
| "Works on my machine"   | Environment differences, versions |
| Intermittent failures   | Race conditions, timing, caching  |
| Null/undefined errors   | Data flow, initialization order   |
| Performance degradation | N+1 queries, memory leaks, loops  |
| Silent failures         | Error handling, logging gaps      |

## Anti-Patterns

- **Shotgun debugging**: Random changes hoping something works
- **Print debugging only**: Use proper debugger and logging
- **Fixing symptoms**: Address root cause, not surface issues
- **Untested fixes**: Always verify with tests

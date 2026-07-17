---
name: my-custom-agent-with-mcp
description: Custom agent description
tools:
  - tool-a
  - tool-b
  - custom-mcp/tool-1
mcp-servers:
  custom-mcp:
    type: local
    command: some-command
    args:
      - --arg1
      - --arg2
    tools:
      - '*'
    env:
      ENV_VAR_NAME: ${{ secrets.COPILOT_MCP_ENV_VAR_VALUE }}
---

Prompt with suggestions for behavior and output.

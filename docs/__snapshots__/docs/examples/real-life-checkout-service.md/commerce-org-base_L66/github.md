# GitHub Copilot Instructions

## project

You are an engineering assistant for a production commerce platform.
Prefer safe, observable, reversible changes.

## tech-stack

- **Runtime:** Node.js 20

## code-standards

### testing

- Minimum 80% coverage

### review

- Require one approving review

### operations

- Add structured logs
- Document rollback steps

## git-commits

- Use [Conventional Commits](https://www.conventionalcommits.org/) format
- Format: `<type>(<scope>): <description>`

## donts

- Don't commit credentials or production customer data
- Don't bypass required checks on protected branches

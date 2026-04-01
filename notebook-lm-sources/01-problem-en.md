# The Problem: AI Instruction Chaos in Organizations

## The real scale of the problem

AI coding tools like GitHub Copilot, Claude Code, Factory AI, and Gemini are only as good as the instructions you give them. The problem is that in organizations with dozens of projects, those instructions quickly spiral out of control.

Every project has its own prompts. Someone wrote instructions for one repository, someone else copied them to another and tweaked them slightly, a third person grabbed an old version and adapted it their own way. After a few months, dozens of instruction versions circulate across the organization, each slightly different, none fully outdated, none fully up to date.

## Core problems

### Instructions drifting apart across projects

A company has twenty, thirty repositories. Each has its own AI instructions. Someone updates coding standards in one project, but the rest keep using old versions. Someone changes testing requirements, but only in their own repo. Over time, instructions across projects tell different stories. There is no single source of truth, just mindless copy-paste from project to project.

### Instructions out of sync with tool versions

A project migrates from Jest to Vitest, but the AI instructions still say to write tests in Jest. The framework updated to a new version with different APIs, but prompts still reference the old API. Instructions don't live alongside the code, so they drift apart from it.

### Different prompt structures across tools

GitHub Copilot expects prompts in a completely different structure than Claude Code, Factory AI, or Gemini. Each tool has its own format, its own conventions, its own capabilities. A prompt written for Copilot won't work optimally in Claude Code, because these tools have different ways of interpreting instructions.

On top of that, the models behind these tools differ. The same prompt might be interpreted brilliantly by one model and poorly by another. Instructions should be tailored to each tool and model's specifics, but in practice nobody has the time, so everyone pastes the same text everywhere.

### No standards and no validation

There is no mechanism for checking whether AI instructions in a project are correct, current, and consistent with the rest of the organization. Errors in prompts are only discovered when the AI generates code that doesn't match expectations, and then the developer wastes time debugging a problem whose root cause is bad instructions.

### No hierarchy or inheritance

An organization has security standards, a team has its conventions, a project has its specifics. But there is no mechanism for building instructions in layers, inheriting from organization level through team to project. Instead, every project starts from scratch or copies from another project, losing context.

## Why it's getting worse

The more projects in an organization, the harder it is to maintain consistency. The more AI tools on the market, the more prompt formats to support. And the pressure on instruction quality is growing, because AI tools are becoming an increasingly important part of the software development process.

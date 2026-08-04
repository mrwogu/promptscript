# new-task

<!-- PromptScript 2026-08-04T15:31:20.016Z | source: .promptscript/project.prs | target: claude - do not edit -->

> Take a task from main branch to a green pull request

Never commit to main. Every task starts on its own branch.

1. Branch from main: `git checkout -b feat/<task-name>` (or `fix/<task-name>`).
2. Implement in atomic commits, each one Conventional Commits format with a
   package or domain scope.

3. Run the full verification pipeline. Do not push a branch that fails it.
4. Push and set upstream: `git push -u origin <branch-name>`.
5. Open the pull request: `gh pr create --fill`.
6. Watch CI: `gh pr checks --watch`.
7. On failure, fix the cause and push again. Repeat from step 6.
8. The task is done only when every check passes.

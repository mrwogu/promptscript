export interface MigrationPromptInput {
  path: string;
  sizeHuman: string;
  toolName: string;
}

export interface MigrationPromptOptions {
  outputDirectory?: string;
  existingEntry?: string;
}

export function generateMigrationPrompt(
  candidates: MigrationPromptInput[],
  options: MigrationPromptOptions = {}
): string {
  const fileList = candidates.map((c) => `- ${c.path} (${c.sizeHuman}, ${c.toolName})`).join('\n');
  const outputDirectory = options.outputDirectory ?? '.promptscript';
  const existingProjectInstructions = options.existingEntry
    ? `\nDo not modify promptscript.yaml or the original instruction files. Add one @use directive to ${options.existingEntry} that composes the migrated project.\n`
    : '';

  return `Migrate my existing AI instructions to PromptScript.

I've just initialized PromptScript in this project. The following
instruction files need to be migrated to .prs format:

${fileList}

Use the /promptscript skill for the PromptScript language reference.
${existingProjectInstructions}

Steps:
1. Read each file listed above
2. Analyze the content and map to PromptScript blocks
3. Generate a modular .prs structure in ${outputDirectory}/:
   - project.prs (entry: @meta, @identity, @use directives)
   - context.prs (@context)
   - standards.prs (@standards)
   - restrictions.prs (@restrictions)
   - commands.prs (@shortcuts, @knowledge -- only if relevant content found)
4. Deduplicate overlapping content across files
5. Run: prs validate --strict
6. Run: prs compile --dry-run
`;
}

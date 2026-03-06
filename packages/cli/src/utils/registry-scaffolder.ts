import { join } from 'path';
import type { CliServices } from '../services.js';

/**
 * Options for scaffolding a new registry.
 */
export interface ScaffoldOptions {
  /** Registry directory path */
  directory: string;
  /** Registry name */
  name: string;
  /** Registry description */
  description: string;
  /** Namespace names (e.g., '@core', '@stacks', '@fragments') */
  namespaces: string[];
  /** Maintainer name */
  maintainer?: string;
  /** Whether to seed with starter configs */
  seed: boolean;
}

/**
 * Seed content for @core/base.prs
 */
const SEED_BASE = `@meta {
  id: "@core/base"
  syntax: "1.0.0"
  description: "Universal AI assistant foundation"
  tags: [core, foundation]
}

@identity {
  """
  You are a helpful, accurate, and thoughtful AI assistant.

  Core principles:
  - Accuracy over speed - verify before responding
  - Clarity over complexity - explain simply first
  - Safety first - never compromise security
  - Respect boundaries - acknowledge limitations
  """
}

@standards {
  communication: ["Professional tone", "Clear format", "Citations when applicable"]
  reasoning: ["Show work", "Acknowledge uncertainty"]
}

@restrictions {
  - "Never generate harmful, illegal, or unethical content"
  - "Never pretend to have capabilities you don't have"
  - "Always clarify when unsure rather than guessing"
}
`;

/**
 * Seed content for @core/quality.prs
 */
const SEED_QUALITY = `@meta {
  id: "@core/quality"
  syntax: "1.0.0"
  description: "Code quality standards mixin"
  tags: [core, quality, mixin]
  mixin: true
}

@identity {
  """
  You prioritize code quality and maintainability in all outputs.

  Quality principles:
  - Write code for humans first, machines second
  - Favor readability over cleverness
  - Keep functions small and focused
  - Make dependencies explicit
  """
}

@standards {
  code: ["Descriptive naming", "Single responsibility functions", "Consistent formatting"]
  architecture: ["Loose coupling", "High cohesion", "Explicit dependencies"]
}

@restrictions {
  - "Never sacrifice readability for micro-optimizations"
  - "Never leave dead code or commented-out blocks"
  - "Never use magic numbers without named constants"
}
`;

/**
 * Seed content for @core/security.prs
 */
const SEED_SECURITY = `@meta {
  id: "@core/security"
  syntax: "1.0.0"
  description: "Security best practices mixin"
  tags: [core, security, mixin]
  mixin: true
}

@identity {
  """
  You prioritize security in all interactions and code generation.

  Security mindset:
  - Assume all input is potentially malicious
  - Apply defense in depth principles
  - Follow the principle of least privilege
  - Keep security considerations visible
  """
}

@standards {
  code: ["Input validation required", "Output encoding required", "Check authorization"]
  secrets: ["Never hardcoded", "Never logged", "Prevent exposure"]
  dependencies: ["Audit regularly", "Pin versions", "Use trusted sources only"]
}

@restrictions {
  - "Never generate code with known vulnerabilities"
  - "Never expose secrets, credentials, or API keys"
  - "Never disable security features without explicit user consent"
  - "Never trust user input without validation"
}
`;

/**
 * Scaffold a new registry directory structure.
 */
export async function scaffoldRegistry(
  options: ScaffoldOptions,
  services: CliServices
): Promise<string[]> {
  const { fs } = services;
  const { directory, name, description, namespaces, seed } = options;
  const createdFiles: string[] = [];

  // Create root directory
  await fs.mkdir(directory, { recursive: true });

  // Generate and write manifest
  const manifest = generateManifest(name, description, namespaces, seed);
  const manifestPath = join(directory, 'registry-manifest.yaml');
  await fs.writeFile(manifestPath, manifest, 'utf-8');
  createdFiles.push(manifestPath);

  // Generate README
  const readme = generateReadme(name, description, namespaces);
  const readmePath = join(directory, 'README.md');
  await fs.writeFile(readmePath, readme, 'utf-8');
  createdFiles.push(readmePath);

  // Generate .gitignore
  const gitignorePath = join(directory, '.gitignore');
  await fs.writeFile(gitignorePath, '.DS_Store\nnode_modules/\n*.log\n', 'utf-8');
  createdFiles.push(gitignorePath);

  // Create namespace directories
  for (const ns of namespaces) {
    const nsDir = join(directory, ns);
    await fs.mkdir(nsDir, { recursive: true });

    if (seed && ns === '@core') {
      // Seed @core with starter configs
      const basePath = join(nsDir, 'base.prs');
      await fs.writeFile(basePath, SEED_BASE, 'utf-8');
      createdFiles.push(basePath);

      const qualityPath = join(nsDir, 'quality.prs');
      await fs.writeFile(qualityPath, SEED_QUALITY, 'utf-8');
      createdFiles.push(qualityPath);

      const securityPath = join(nsDir, 'security.prs');
      await fs.writeFile(securityPath, SEED_SECURITY, 'utf-8');
      createdFiles.push(securityPath);
    } else {
      // Add .gitkeep to empty directories
      const gitkeepPath = join(nsDir, '.gitkeep');
      await fs.writeFile(gitkeepPath, '', 'utf-8');
      createdFiles.push(gitkeepPath);
    }
  }

  return createdFiles;
}

/**
 * Generate registry-manifest.yaml content.
 */
function generateManifest(
  name: string,
  description: string,
  namespaces: string[],
  seed: boolean
): string {
  const lines: string[] = [
    "version: '1'",
    '',
    'meta:',
    `  name: '${name}'`,
    `  description: '${description}'`,
    `  lastUpdated: '${new Date().toISOString().split('T')[0]}'`,
    '',
    'namespaces:',
  ];

  const priorities: Record<string, number> = {
    '@core': 100,
    '@stacks': 80,
    '@fragments': 70,
    '@roles': 60,
    '@skills': 50,
  };

  for (const ns of namespaces) {
    const priority = priorities[ns] ?? 50;
    lines.push(`  '${ns}':`);
    lines.push(
      `    description: '${ns.replace('@', '').charAt(0).toUpperCase() + ns.replace('@', '').slice(1)} configurations'`
    );
    lines.push(`    priority: ${priority}`);
  }

  lines.push('');
  lines.push('catalog:');

  if (seed && namespaces.includes('@core')) {
    lines.push(
      "  - id: '@core/base'",
      "    path: '@core/base.prs'",
      "    name: 'Base Foundation'",
      "    description: 'Universal AI assistant foundation'",
      '    tags: [core, foundation]',
      '    targets: [github, claude, cursor]',
      '    dependencies: []',
      '    detectionHints:',
      '      always: true',
      '',
      "  - id: '@core/quality'",
      "    path: '@core/quality.prs'",
      "    name: 'Quality Standards'",
      "    description: 'Code quality standards mixin'",
      '    tags: [core, quality, mixin]',
      '    targets: [github, claude, cursor]',
      '    dependencies: []',
      '',
      "  - id: '@core/security'",
      "    path: '@core/security.prs'",
      "    name: 'Security Practices'",
      "    description: 'Security best practices mixin'",
      '    tags: [core, security, mixin]',
      '    targets: [github, claude, cursor]',
      '    dependencies: []'
    );
  } else {
    lines.push('  []');
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Generate README.md content.
 */
function generateReadme(name: string, description: string, namespaces: string[]): string {
  return `# ${name}

${description}

## Structure

${namespaces.map((ns) => `- \`${ns}/\` - ${ns.replace('@', '').charAt(0).toUpperCase() + ns.replace('@', '').slice(1)} configurations`).join('\n')}

## Adding Configurations

1. Create a \`.prs\` file in the appropriate namespace directory
2. Add an entry to \`registry-manifest.yaml\` catalog
3. Validate: \`prs registry validate\`
4. Publish: \`prs registry publish\`

## Usage

Configure this registry in your project's \`promptscript.yaml\`:

\`\`\`yaml
registry:
  git:
    url: <your-registry-git-url>
    ref: main
\`\`\`

Then reference configs with \`@inherit\` or \`@use\`:

\`\`\`
@inherit @core/base
@use @core/quality
\`\`\`
`;
}

/**
 * End-to-end test for parameterized inheritance in .prs files.
 *
 * Verifies that @meta { params: {...} } + @inherit ./parent(key: value)
 * + {{variable}} interpolation works through the full resolver pipeline.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Resolver } from '../resolver.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Parameterized Inheritance E2E', () => {
  let dir: string;

  beforeAll(async () => {
    dir = join(tmpdir(), 'prs-param-e2e-' + Date.now());
    await mkdir(dir, { recursive: true });
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('should interpolate {{variables}} in text content via @inherit params', async () => {
    await writeFile(
      join(dir, 'base.prs'),
      `
@meta {
  id: "base-template"
  syntax: "1.0.0"
  params: {
    serviceName: string
    port?: number = 3000
  }
}

@identity {
  """
  You are a developer working on {{serviceName}}.
  The service runs on port {{port}}.
  """
}
`
    );

    await writeFile(
      join(dir, 'project.prs'),
      `
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

@inherit ./base(serviceName: "user-api", port: 8080)
`
    );

    const resolver = new Resolver({ localPath: dir });
    const result = await resolver.resolve(join(dir, 'project.prs'));
    expect(result.errors).toHaveLength(0);

    const identity = result.ast.blocks.find((b) => b.name === 'identity');
    expect(identity).toBeDefined();
    expect(identity!.content.type).toBe('TextContent');
    if (identity!.content.type === 'TextContent') {
      expect(identity!.content.value).toContain('user-api');
      expect(identity!.content.value).toContain('8080');
      expect(identity!.content.value).not.toContain('{{serviceName}}');
      expect(identity!.content.value).not.toContain('{{port}}');
    }
  });

  it('should interpolate {{variables}} in object properties via @inherit params', async () => {
    await writeFile(
      join(dir, 'obj-base.prs'),
      `
@meta {
  id: "obj-base"
  syntax: "1.0.0"
  params: {
    projectName: string
    runtime: string = "node18"
  }
}

@context {
  project: {{projectName}}
  runtime: {{runtime}}
}
`
    );

    await writeFile(
      join(dir, 'obj-project.prs'),
      `
@meta {
  id: "obj-project"
  syntax: "1.0.0"
}

@inherit ./obj-base(projectName: "my-app", runtime: "node20")
`
    );

    const resolver = new Resolver({ localPath: dir });
    const result = await resolver.resolve(join(dir, 'obj-project.prs'));
    expect(result.errors).toHaveLength(0);

    const context = result.ast.blocks.find((b) => b.name === 'context');
    expect(context).toBeDefined();
    expect(context!.content.type).toBe('ObjectContent');
    if (context!.content.type === 'ObjectContent') {
      expect(context!.content.properties['project']).toBe('my-app');
      expect(context!.content.properties['runtime']).toBe('node20');
    }
  });

  it('should use default values for optional params not provided', async () => {
    await writeFile(
      join(dir, 'defaults-base.prs'),
      `
@meta {
  id: "defaults-base"
  syntax: "1.0.0"
  params: {
    name: string
    port?: number = 3000
  }
}

@identity {
  """
  Service {{name}} on port {{port}}.
  """
}
`
    );

    await writeFile(
      join(dir, 'defaults-project.prs'),
      `
@meta {
  id: "defaults-project"
  syntax: "1.0.0"
}

@inherit ./defaults-base(name: "api")
`
    );

    const resolver = new Resolver({ localPath: dir });
    const result = await resolver.resolve(join(dir, 'defaults-project.prs'));
    expect(result.errors).toHaveLength(0);

    const identity = result.ast.blocks.find((b) => b.name === 'identity');
    expect(identity).toBeDefined();
    expect(identity!.content.type).toBe('TextContent');
    if (identity!.content.type === 'TextContent') {
      expect(identity!.content.value).toContain('api');
      expect(identity!.content.value).toContain('3000');
    }
  });

  it('should interpolate variables in @use imports', async () => {
    await writeFile(
      join(dir, 'fragment.prs'),
      `
@meta {
  id: "fragment"
  syntax: "1.0.0"
  params: {
    framework: string
  }
}

@standards {
  """
  Use {{framework}} for testing.
  """
}
`
    );

    await writeFile(
      join(dir, 'use-project.prs'),
      `
@meta {
  id: "use-project"
  syntax: "1.0.0"
}

@use ./fragment(framework: "vitest") as testing

@identity {
  """
  A test project.
  """
}
`
    );

    const resolver = new Resolver({ localPath: dir });
    const result = await resolver.resolve(join(dir, 'use-project.prs'));
    expect(result.errors).toHaveLength(0);

    const standards = result.ast.blocks.find((b) => b.name === 'standards');
    expect(standards).toBeDefined();
    if (standards!.content.type === 'TextContent') {
      expect(standards!.content.value).toContain('vitest');
      expect(standards!.content.value).not.toContain('{{framework}}');
    }
  });

  it('should report error for missing required param', async () => {
    await writeFile(
      join(dir, 'required-base.prs'),
      `
@meta {
  id: "required-base"
  syntax: "1.0.0"
  params: {
    name: string
  }
}

@identity {
  """
  {{name}}
  """
}
`
    );

    await writeFile(
      join(dir, 'missing-param.prs'),
      `
@meta {
  id: "missing-param"
  syntax: "1.0.0"
}

@inherit ./required-base()
`
    );

    const resolver = new Resolver({ localPath: dir });
    const result = await resolver.resolve(join(dir, 'missing-param.prs'));
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]!.message).toContain('name');
  });
});

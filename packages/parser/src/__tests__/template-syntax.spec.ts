/**
 * Tests for parameterized inheritance syntax.
 */
import { describe, it, expect } from 'vitest';
import { parse } from '../parse.js';
import type { ParamDefinition, TemplateExpression } from '@promptscript/core';

describe('Parameterized Inheritance Syntax', () => {
  describe('@inherit with params', () => {
    it('should parse @inherit with single param', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@inherit ./parent(name: "value")
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.inherit?.params).toHaveLength(1);

      const params = result.ast?.inherit?.params ?? [];
      expect(params[0]?.name).toBe('name');
      expect(params[0]?.value).toBe('value');
    });

    it('should parse @inherit with multiple params', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@inherit ./parent(name: "value", count: 42, enabled: true)
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.inherit?.params).toHaveLength(3);

      const params = result.ast?.inherit?.params ?? [];
      expect(params[0]?.name).toBe('name');
      expect(params[0]?.value).toBe('value');
      expect(params[1]?.name).toBe('count');
      expect(params[1]?.value).toBe(42);
      expect(params[2]?.name).toBe('enabled');
      expect(params[2]?.value).toBe(true);
    });

    it('should parse @inherit with namespace path and params', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@inherit @stacks/typescript(runtime: "node20")
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.inherit?.path.namespace).toBe('stacks');

      const params = result.ast?.inherit?.params ?? [];
      expect(params[0]?.name).toBe('runtime');
    });

    it('should parse @inherit without params', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@inherit ./parent
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.inherit?.params).toBeUndefined();
    });
  });

  describe('@use with params', () => {
    it('should parse @use with params', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@use ./fragment(title: "Welcome")
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.uses[0]?.params).toHaveLength(1);

      const params = result.ast?.uses[0]?.params ?? [];
      expect(params[0]?.name).toBe('title');
    });

    it('should parse @use with params and alias', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@use ./fragment(title: "Welcome") as header
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const params = result.ast?.uses[0]?.params ?? [];
      expect(params[0]?.name).toBe('title');
      expect(result.ast?.uses[0]?.alias).toBe('header');
    });
  });

  describe('@meta params definitions', () => {
    it('should parse simple string param definition', () => {
      const source = `
@meta {
  id: "test"
  syntax: "1.0.0"
  params: {
    projectName: string
  }
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.meta?.params).toHaveLength(1);

      const param = result.ast?.meta?.params?.[0] as ParamDefinition | undefined;
      expect(param?.name).toBe('projectName');
      expect(param?.paramType.kind).toBe('string');
      expect(param?.optional).toBe(false);
    });

    it('should parse param with default value', () => {
      const source = `
@meta {
  id: "test"
  syntax: "1.0.0"
  params: {
    runtime: string = "node18"
  }
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const param = result.ast?.meta?.params?.[0] as ParamDefinition | undefined;
      expect(param?.name).toBe('runtime');
      expect(param?.paramType.kind).toBe('string');
      expect(param?.optional).toBe(true); // Has default so considered optional
      expect(param?.defaultValue).toBe('node18');
    });

    it('should parse optional param', () => {
      const source = `
@meta {
  id: "test"
  syntax: "1.0.0"
  params: {
    debug?: boolean
  }
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const param = result.ast?.meta?.params?.[0] as ParamDefinition | undefined;
      expect(param?.name).toBe('debug');
      expect(param?.paramType.kind).toBe('boolean');
      expect(param?.optional).toBe(true);
    });

    it('should parse number param type', () => {
      const source = `
@meta {
  id: "test"
  syntax: "1.0.0"
  params: {
    count: number = 10
  }
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const param = result.ast?.meta?.params?.[0] as ParamDefinition | undefined;
      expect(param?.paramType.kind).toBe('number');
      expect(param?.defaultValue).toBe(10);
    });

    it('should parse enum param type', () => {
      const source = `
@meta {
  id: "test"
  syntax: "1.0.0"
  params: {
    mode: enum("dev", "prod", "test")
  }
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const param = result.ast?.meta?.params?.[0] as ParamDefinition | undefined;
      expect(param?.paramType.kind).toBe('enum');
      if (param?.paramType.kind === 'enum') {
        expect(param.paramType.options).toEqual(['dev', 'prod', 'test']);
      }
    });

    it('should parse multiple param definitions', () => {
      const source = `
@meta {
  id: "test"
  syntax: "1.0.0"
  params: {
    name: string
    count?: number = 5
    enabled: boolean
    mode: enum("a", "b")
  }
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.meta?.params).toHaveLength(4);
    });
  });

  describe('Template expressions {{var}}', () => {
    it('should parse template expression as value', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@identity {
  name: {{projectName}}
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const content = result.ast?.blocks[0]?.content;
      expect(content?.type).toBe('ObjectContent');
      if (content?.type === 'ObjectContent') {
        const nameValue = content.properties['name'] as TemplateExpression;
        expect(nameValue.type).toBe('TemplateExpression');
        expect(nameValue.name).toBe('projectName');
      }
    });

    it('should parse template expression in text content', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@identity {
  """
  Working on {{projectName}}
  """
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const content = result.ast?.blocks[0]?.content;
      expect(content?.type).toBe('TextContent');
      if (content?.type === 'TextContent') {
        expect(content.value).toContain('{{projectName}}');
      }
    });

    it('should parse template expression in array', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@identity {
  items: [{{first}}, {{second}}]
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const content = result.ast?.blocks[0]?.content;
      if (content?.type === 'ObjectContent') {
        const items = content.properties['items'] as TemplateExpression[];
        expect(items[0]?.type).toBe('TemplateExpression');
        expect(items[0]?.name).toBe('first');
        expect(items[1]?.type).toBe('TemplateExpression');
        expect(items[1]?.name).toBe('second');
      }
    });
  });

  describe('Edge cases', () => {
    it('should allow type keywords as field keys', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@identity {
  string: "text value"
  number: 42
  boolean: true
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const content = result.ast?.blocks[0]?.content;
      if (content?.type === 'ObjectContent') {
        expect(content.properties['string']).toBe('text value');
        expect(content.properties['number']).toBe(42);
        expect(content.properties['boolean']).toBe(true);
      }
    });

    it('should parse empty params list', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@inherit ./parent()
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.inherit?.params).toHaveLength(0);
    });

    it('should parse template expression with underscore in name', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@identity {
  value: {{_private_var}}
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const content = result.ast?.blocks[0]?.content;
      if (content?.type === 'ObjectContent') {
        const value = content.properties['value'] as TemplateExpression;
        expect(value.name).toBe('_private_var');
      }
    });

    it('should parse template expression with numbers in name', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@identity {
  value: {{var123}}
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const content = result.ast?.blocks[0]?.content;
      if (content?.type === 'ObjectContent') {
        const value = content.properties['value'] as TemplateExpression;
        expect(value.name).toBe('var123');
      }
    });

    it('should parse negative number param value', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@inherit ./parent(offset: -10)
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const params = result.ast?.inherit?.params ?? [];
      expect(params[0]?.value).toBe(-10);
    });

    it('should parse float number param value', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@inherit ./parent(rate: 3.14)
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const params = result.ast?.inherit?.params ?? [];
      expect(params[0]?.value).toBe(3.14);
    });

    it('should parse boolean false param value', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@inherit ./parent(enabled: false)
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const params = result.ast?.inherit?.params ?? [];
      expect(params[0]?.value).toBe(false);
    });

    it('should parse enum with single option', () => {
      const source = `
@meta {
  id: "test"
  syntax: "1.0.0"
  params: {
    mode: enum("only")
  }
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const param = result.ast?.meta?.params?.[0] as ParamDefinition | undefined;
      if (param?.paramType.kind === 'enum') {
        expect(param.paramType.options).toEqual(['only']);
      }
    });

    it('should parse enum with many options', () => {
      const source = `
@meta {
  id: "test"
  syntax: "1.0.0"
  params: {
    color: enum("red", "green", "blue", "yellow", "orange", "purple")
  }
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const param = result.ast?.meta?.params?.[0] as ParamDefinition | undefined;
      if (param?.paramType.kind === 'enum') {
        expect(param.paramType.options).toHaveLength(6);
      }
    });

    it('should parse optional param with number default', () => {
      const source = `
@meta {
  id: "test"
  syntax: "1.0.0"
  params: {
    port?: number = 3000
  }
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const param = result.ast?.meta?.params?.[0] as ParamDefinition | undefined;
      expect(param?.optional).toBe(true);
      expect(param?.defaultValue).toBe(3000);
    });

    it('should parse optional param with boolean default', () => {
      const source = `
@meta {
  id: "test"
  syntax: "1.0.0"
  params: {
    strict?: boolean = true
  }
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const param = result.ast?.meta?.params?.[0] as ParamDefinition | undefined;
      expect(param?.optional).toBe(true);
      expect(param?.defaultValue).toBe(true);
    });

    it('should parse @use with params before alias', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@use ./template(name: "test", count: 5) as myTemplate
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const use = result.ast?.uses[0];
      expect(use?.params).toHaveLength(2);
      expect(use?.alias).toBe('myTemplate');
    });

    it('should handle multiple template expressions in same block', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@context {
  name: {{projectName}}
  version: {{projectVersion}}
  author: {{authorName}}
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const content = result.ast?.blocks[0]?.content;
      if (content?.type === 'ObjectContent') {
        expect((content.properties['name'] as TemplateExpression).name).toBe('projectName');
        expect((content.properties['version'] as TemplateExpression).name).toBe('projectVersion');
        expect((content.properties['author'] as TemplateExpression).name).toBe('authorName');
      }
    });

    it('should parse string with special characters in param value', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@inherit ./parent(message: "Hello, World! How's it going?")
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const params = result.ast?.inherit?.params ?? [];
      expect(params[0]?.value).toBe("Hello, World! How's it going?");
    });

    it('should parse string with escaped quotes in param value', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@inherit ./parent(message: "Say \\"Hello\\"")
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const params = result.ast?.inherit?.params ?? [];
      expect(params[0]?.value).toBe('Say "Hello"');
    });
  });

  describe('Complex scenarios', () => {
    it('should parse params with template and use combined', () => {
      const source = `
@meta {
  id: "test"
  syntax: "1.0.0"
  params: {
    projectName: string
    runtime: string = "node18"
  }
}

@inherit ./base(projectName: "app")
@use ./testing(framework: "vitest") as tests

@identity {
  project: {{projectName}}
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);
      expect(result.ast?.meta?.params).toHaveLength(2);
      expect(result.ast?.inherit?.params).toHaveLength(1);
      expect(result.ast?.uses[0]?.params).toHaveLength(1);
    });

    it('should preserve location information for template expressions', () => {
      const source = `
@meta { id: "test" syntax: "1.0.0" }
@identity {
  name: {{projectName}}
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const content = result.ast?.blocks[0]?.content;
      if (content?.type === 'ObjectContent') {
        const value = content.properties['name'] as TemplateExpression;
        expect(value.loc).toBeDefined();
        expect(value.loc?.file).toBe('test.prs');
      }
    });

    it('should preserve location information for param definitions', () => {
      const source = `
@meta {
  id: "test"
  syntax: "1.0.0"
  params: {
    name: string
  }
}
`;
      const result = parse(source, { filename: 'test.prs' });
      expect(result.errors).toHaveLength(0);

      const param = result.ast?.meta?.params?.[0];
      expect(param?.loc).toBeDefined();
      expect(param?.loc?.file).toBe('test.prs');
    });
  });
});

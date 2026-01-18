import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { parse, parseFile, parseFileOrThrow } from '../parse';
import { ParseError } from '@promptscript/core';

const fixturesDir = join(__dirname, '__fixtures__');

describe('parse with recovery option', () => {
  it('should accept recovery as an alias for tolerant', () => {
    const invalidSource = '@meta { id: }'; // Missing value

    const result1 = parse(invalidSource, { tolerant: true });
    const result2 = parse(invalidSource, { recovery: true });

    expect(result1.errors.length).toBeGreaterThan(0);
    expect(result2.errors.length).toBeGreaterThan(0);
    // Both should attempt recovery and produce similar results
    expect(result1.errors.length).toBe(result2.errors.length);
  });

  it('should fail without recovery on invalid input', () => {
    const invalidSource = '@meta { id: }';

    const result = parse(invalidSource, { recovery: false });

    expect(result.ast).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('parseFile', () => {
  it('should parse a file from disk', () => {
    const filePath = join(fixturesDir, 'minimal.prs');
    const result = parseFile(filePath);

    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();
    expect(result.ast?.meta?.fields['id']).toBe('test-project');
  });

  it('should use file path as filename in errors', () => {
    const filePath = join(fixturesDir, 'minimal.prs');
    const result = parseFile(filePath);

    expect(result.errors).toHaveLength(0);
    // If there were errors, they should reference the file path
    expect(result.ast?.meta?.loc.file).toBe(filePath);
  });

  it('should return error for non-existent file', () => {
    const result = parseFile('/non/existent/file.prs');

    expect(result.ast).toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBeInstanceOf(ParseError);
    expect(result.errors[0]?.message).toContain('Failed to read file');
  });

  it('should pass options through to parse', () => {
    const filePath = join(fixturesDir, 'minimal.prs');
    const result = parseFile(filePath, { recovery: true });

    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();
  });

  it('should parse @agents and @knowledge blocks', () => {
    const filePath = join(fixturesDir, 'agents-and-knowledge.prs');
    const result = parseFile(filePath);

    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();

    // Verify @agents block was parsed
    const agentsBlock = result.ast?.blocks.find((b) => b.name === 'agents');
    expect(agentsBlock).toBeDefined();
    expect(agentsBlock?.content.type).toBe('ObjectContent');
    if (agentsBlock?.content.type === 'ObjectContent') {
      expect(agentsBlock.content.properties).toHaveProperty('code-reviewer');
      expect(agentsBlock.content.properties).toHaveProperty('debugger');
      expect(agentsBlock.content.properties).toHaveProperty('security-auditor');
    }

    // Verify @knowledge block was parsed
    const knowledgeBlock = result.ast?.blocks.find((b) => b.name === 'knowledge');
    expect(knowledgeBlock).toBeDefined();
    expect(knowledgeBlock?.content.type).toBe('TextContent');
    if (knowledgeBlock?.content.type === 'TextContent') {
      expect(knowledgeBlock.content.value).toContain('API Reference');
      expect(knowledgeBlock.content.value).toContain('Authentication');
    }
  });
});

describe('parseFileOrThrow', () => {
  it('should return AST for valid file', () => {
    const filePath = join(fixturesDir, 'minimal.prs');
    const ast = parseFileOrThrow(filePath);

    expect(ast).not.toBeNull();
    expect(ast.type).toBe('Program');
    expect(ast.meta?.fields['id']).toBe('test-project');
  });

  it('should throw for non-existent file', () => {
    expect(() => parseFileOrThrow('/non/existent/file.prs')).toThrow(ParseError);
  });

  it('should throw ParseError with file path', () => {
    try {
      parseFileOrThrow('/non/existent/file.prs');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ParseError);
      expect((err as ParseError).location?.file).toBe('/non/existent/file.prs');
    }
  });
});

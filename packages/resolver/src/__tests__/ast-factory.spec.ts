import { describe, it, expect } from 'vitest';
import type { ObjectContent, TextContent } from '@promptscript/core';
import { makeBlock, makeObjectContent, makeTextContent, VIRTUAL_LOC } from '../ast-factory.js';

describe('VIRTUAL_LOC', () => {
  it('has line: 1 and column: 1', () => {
    expect(VIRTUAL_LOC.line).toBe(1);
    expect(VIRTUAL_LOC.column).toBe(1);
  });

  it('has a non-empty file string', () => {
    expect(typeof VIRTUAL_LOC.file).toBe('string');
    expect(VIRTUAL_LOC.file.length).toBeGreaterThan(0);
  });
});

describe('makeObjectContent', () => {
  it('creates ObjectContent with correct type', () => {
    // Arrange
    const properties = { key: 'value' };

    // Act
    const result = makeObjectContent(properties);

    // Assert
    expect(result.type).toBe('ObjectContent');
  });

  it('creates ObjectContent with given properties', () => {
    // Arrange
    const properties = { name: 'hello', count: 42 };

    // Act
    const result = makeObjectContent(properties);

    // Assert
    expect(result.properties).toEqual(properties);
  });

  it('attaches a loc', () => {
    // Arrange / Act
    const result = makeObjectContent({});

    // Assert
    expect(result.loc).toBeDefined();
    expect(result.loc.line).toBe(1);
    expect(result.loc.column).toBe(1);
  });
});

describe('makeTextContent', () => {
  it('creates TextContent with given value', () => {
    // Arrange / Act
    const result = makeTextContent('hello world');

    // Assert
    expect(result.type).toBe('TextContent');
    expect(result.value).toBe('hello world');
  });

  it('uses VIRTUAL_LOC when no file is provided', () => {
    // Arrange / Act
    const result = makeTextContent('some text');

    // Assert
    expect(result.loc).toEqual(VIRTUAL_LOC);
  });

  it('uses file-based loc when file is provided', () => {
    // Arrange
    const file = '/some/path/to/file.md';

    // Act
    const result: TextContent = makeTextContent('content', file);

    // Assert
    expect(result.loc.file).toBe(file);
    expect(result.loc.line).toBe(1);
    expect(result.loc.column).toBe(1);
  });

  it('file-based loc is distinct from VIRTUAL_LOC when file is given', () => {
    // Arrange / Act
    const result = makeTextContent('content', '/some/file.md');

    // Assert
    expect(result.loc).not.toEqual(VIRTUAL_LOC);
  });
});

describe('makeBlock', () => {
  it('creates Block with correct type', () => {
    // Arrange
    const content: ObjectContent = makeObjectContent({});

    // Act
    const result = makeBlock('skills', content);

    // Assert
    expect(result.type).toBe('Block');
  });

  it('creates Block with given name', () => {
    // Arrange
    const content: ObjectContent = makeObjectContent({});

    // Act
    const result = makeBlock('context', content);

    // Assert
    expect(result.name).toBe('context');
  });

  it('creates Block with given content', () => {
    // Arrange
    const content: ObjectContent = makeObjectContent({ foo: 'bar' });

    // Act
    const result = makeBlock('identity', content);

    // Assert
    expect(result.content).toBe(content);
  });

  it('creates Block with TextContent', () => {
    // Arrange
    const content: TextContent = makeTextContent('some text');

    // Act
    const result = makeBlock('context', content);

    // Assert
    expect(result.type).toBe('Block');
    expect(result.content.type).toBe('TextContent');
  });

  it('attaches a loc', () => {
    // Arrange / Act
    const result = makeBlock('identity', makeObjectContent({}));

    // Assert
    expect(result.loc).toBeDefined();
    expect(result.loc.line).toBe(1);
    expect(result.loc.column).toBe(1);
  });
});

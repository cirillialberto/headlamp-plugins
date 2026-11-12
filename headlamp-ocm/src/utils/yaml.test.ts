import { describe, expect, it } from 'vitest';
import { toYaml, yamlEscapeString } from './yaml';

describe('yamlEscapeString', () => {
  it('returns the value unchanged when it does not need quoting', () => {
    expect(yamlEscapeString('simple')).toBe('simple');
    expect(yamlEscapeString('with spaces')).toBe('with spaces');
    expect(yamlEscapeString('12345')).toBe('12345');
  });

  it("returns '' for the empty string", () => {
    expect(yamlEscapeString('')).toBe("''");
  });

  it('quotes strings containing special characters', () => {
    expect(yamlEscapeString('a:b')).toBe("'a:b'");
    expect(yamlEscapeString('a-b')).toBe("'a-b'");
    expect(yamlEscapeString('a,b')).toBe("'a,b'");
    expect(yamlEscapeString('a#b')).toBe("'a#b'");
  });

  it('quotes YAML keywords (case-insensitive)', () => {
    expect(yamlEscapeString('true')).toBe("'true'");
    expect(yamlEscapeString('False')).toBe("'False'");
    expect(yamlEscapeString('null')).toBe("'null'");
    expect(yamlEscapeString('~')).toBe("'~'");
  });

  it('doubles single quotes inside quoted strings', () => {
    expect(yamlEscapeString("it's")).toBe("'it''s'");
  });

  it('quotes strings with leading or trailing whitespace', () => {
    expect(yamlEscapeString(' leading')).toBe("' leading'");
    expect(yamlEscapeString('trailing ')).toBe("'trailing '");
  });
});

describe('toYaml', () => {
  it('serializes primitives', () => {
    expect(toYaml(null)).toBe('null');
    expect(toYaml(undefined)).toBe('null');
    expect(toYaml('text')).toBe('text');
    expect(toYaml(42)).toBe('42');
    expect(toYaml(3.5)).toBe('3.5');
    expect(toYaml(true)).toBe('true');
    expect(toYaml(false)).toBe('false');
  });

  it('serializes arrays of scalars', () => {
    expect(toYaml(['a', 'b'])).toBe('- a\n- b');
  });

  it('serializes arrays of objects', () => {
    const value = [
      { name: 'a' },
      { name: 'b' },
    ];
    expect(toYaml(value)).toBe('-\n  name: a\n-\n  name: b');
  });

  it('serializes empty containers', () => {
    expect(toYaml([])).toBe('[]');
    expect(toYaml({})).toBe('{}');
  });

  it('serializes nested objects with indentation', () => {
    const value = { a: { b: 1 }, c: 'x' };
    expect(toYaml(value)).toBe('a:\n  b: 1\nc: x');
  });

  it('quotes keys that contain special characters', () => {
    expect(toYaml({ 'a:b': 1 })).toBe("'a:b': 1");
  });

  it('serializes an empty-string key as an empty quoted string', () => {
    expect(toYaml({ '': 1 })).toBe("'': 1");
  });

  it('serializes objects with array values', () => {
    const value = { list: [1, 2] };
    expect(toYaml(value)).toBe('list:\n  - 1\n  - 2');
  });
});

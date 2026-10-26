/**
 * Runs the built runtime package under Deno: every render case of the prompt bundle
 * conformance vectors, and one read through the node entry, from the dist files a
 * consumer installs.
 *
 * Usage (after `pnpm nx build runtime`):
 *   deno run --allow-read scripts/runtime-deno-smoke.mjs
 *
 * It needs read access only: no environment and no network permission.
 */
import { readdir, readFile } from 'node:fs/promises';
import { loadPrompt } from '../dist/packages/runtime/src/index.js';
import { directorySource } from '../dist/packages/runtime/src/node.js';

const vectors = new URL('../conformance/prompt-bundle/v1/', import.meta.url);
const names = (await readdir(vectors)).filter((name) => /^\d{3}-.*\.json$/.test(name)).sort();
let cases = 0;

function outcome(prompt, inputs) {
  try {
    const rendered = prompt.render(inputs);
    return {
      messages: rendered.messages,
      warnings: [...new Set(rendered.meta.warnings.map((w) => w.code))],
    };
  } catch (error) {
    return { error: error.code };
  }
}

const files = await Promise.all(names.map((name) => readFile(new URL(name, vectors), 'utf8')));

for (const [i, name] of names.entries()) {
  const vector = JSON.parse(files[i]);
  if (vector.error) {
    let code;
    try {
      loadPrompt(vector.bundle);
    } catch (error) {
      code = error.code;
    }
    if (code !== vector.error) throw new Error(`${name}: expected ${vector.error}, got ${code}`);
    continue;
  }
  const prompt = loadPrompt(vector.bundle);
  for (const renderCase of vector.render === undefined ? [] : [vector.render].flat()) {
    const expected = renderCase.error
      ? { error: renderCase.error }
      : { messages: renderCase.messages, warnings: renderCase.warnings ?? [] };
    const actual = outcome(prompt, renderCase.inputs);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
    cases++;
  }
}

// The node entry reads through node:fs/promises, which Deno provides
const file = await directorySource(new URL('.', vectors).pathname).read(names[0]);
if (!JSON.parse(file.text).bundle) throw new Error(`directorySource could not read ${names[0]}`);
console.log(`runtime: ${names.length} vectors, ${cases} render cases pass`);

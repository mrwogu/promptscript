// Page dates from git history, for the sitemap <lastmod> and "Last updated".
// Starlight reads git only for src/content/docs, our pages live in docs/.
import { execFileSync } from 'node:child_process';
import { docIdFromEntry } from './remark-mkdocs-compat.mjs';

/** Parses `git log --format=%x00%cI --name-only` output into URL path -> newest commit date. */
export function lastModifiedByPath(log) {
  const dates = new Map();
  let date;
  for (const line of log.split('\n')) {
    if (line.startsWith('\0')) {
      date = line.slice(1);
    } else if (line.startsWith('docs/') && line.endsWith('.md') && date) {
      const id = docIdFromEntry(line.slice('docs/'.length));
      const path = id === 'index' ? '/' : `/${id}/`;
      // git log lists newest commits first, so the first date wins.
      if (!dates.has(path)) dates.set(path, date);
    }
  }
  return dates;
}

let cached;

export function gitLastModified() {
  if (cached) return cached;
  try {
    // `:/docs` is the repo-level docs/ folder from any working directory.
    const log = execFileSync('git', ['log', '--format=%x00%cI', '--name-only', '--', ':/docs'], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    cached = lastModifiedByPath(log);
  } catch {
    // No git (e.g. a source tarball): pages just have no date.
    cached = new Map();
  }
  return cached;
}

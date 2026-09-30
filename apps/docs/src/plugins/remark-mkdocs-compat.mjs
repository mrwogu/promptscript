// Keeps docs/ sources readable on GitHub and in editors while Starlight
// renders them: relative `.md` links, a body H1 and `::::tabs` blocks.
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_DIR = fileURLToPath(new URL('../../../../docs', import.meta.url));
const REPO_BLOB = 'https://github.com/mrwogu/promptscript/blob/main/';

/** Keeps MkDocs URLs: README.md and index.md map to their directory. */
export function docIdFromEntry(entry) {
  const path = entry.replace(/\.mdx?$/, '').replace(/(^|\/)README$/, '$1index');
  if (path === 'index') return 'index';
  return path.replace(/\/index$/, '');
}

export function rewriteDocLink(url, filePath) {
  const match = /^([^:#?]+\.md)(#.*)?$/.exec(url);
  if (!match || url.startsWith('/')) return url;
  const target = resolve(dirname(filePath), decodeURI(match[1]));
  const rel = relative(DOCS_DIR, target).split('\\').join('/');
  const hash = match[2] ?? '';
  if (rel.startsWith('..')) {
    return REPO_BLOB + relative(resolve(DOCS_DIR, '..'), target).split('\\').join('/') + hash;
  }
  const id = docIdFromEntry(rel);
  return (id === 'index' ? '/' : `/${id}/`) + hash;
}

function walk(node, fn) {
  fn(node);
  if (node.children) for (const child of node.children) walk(child, fn);
}

function textOf(node) {
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(textOf).join('');
}

let tabGroup = 0;

function el(tagName, properties, children = []) {
  return { type: 'ps', data: { hName: tagName, hProperties: properties }, children };
}

// ::::tabs / :::tab[Label] ... ::: / :::: -> CSS-only radio tabs.
function toTabs(node) {
  const tabs = node.children.filter((c) => c.type === 'containerDirective' && c.name === 'tab');
  const group = `tabs-${++tabGroup}`;
  const controls = [];
  const panels = [];
  tabs.forEach((tab, index) => {
    const labelNode = tab.children[0]?.data?.directiveLabel ? tab.children.shift() : undefined;
    const label = labelNode ? textOf(labelNode) : `Tab ${index + 1}`;
    const id = `${group}-${index}`;
    controls.push(el('input', { type: 'radio', name: group, id, checked: index === 0 }), {
      type: 'ps',
      data: {
        hName: 'label',
        hProperties: { for: id },
        hChildren: [{ type: 'text', value: label }],
      },
    });
    panels.push(el('div', { className: ['ps-tab-panel'] }, tab.children));
  });
  node.type = 'ps';
  node.data = { hName: 'div', hProperties: { className: ['ps-tabs'] } };
  node.children = [...controls, ...panels];
}

export function remarkMkdocsCompat() {
  return (tree, file) => {
    // starlight-links-validator maps files to pages via src/content/docs.
    // Sources live in docs/, so hand it the page slug explicitly.
    const rel = file.path ? relative(DOCS_DIR, file.path).split('\\').join('/') : '';
    const id = rel && !rel.startsWith('..') ? docIdFromEntry(rel) : undefined;
    if (id && id !== 'index' && file.data.astro?.frontmatter) {
      file.data.astro.frontmatter.slug = id;
    }
    const headingIndex = tree.children.findIndex((c) => c.type === 'heading');
    if (headingIndex !== -1 && tree.children[headingIndex].depth === 1) {
      tree.children.splice(headingIndex, 1);
    }
    walk(tree, (node) => {
      if ((node.type === 'link' || node.type === 'definition') && file.path) {
        node.url = rewriteDocLink(node.url, file.path);
      }
      if (node.type === 'containerDirective' && node.name === 'tabs') toTabs(node);
    });
  };
}

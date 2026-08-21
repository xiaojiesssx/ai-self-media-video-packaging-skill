import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path));

describe('public README integrity', () => {
  it('links only existing local documentation', () => {
    const markdown = read('README.md').toString('utf8');
    const links = [...markdown.matchAll(/(?<!!)\[[^\]]*\]\(([^)]+)\)/g)]
      .map((match) => match[1])
      .filter((link) => !/^https?:\/\//.test(link) && !link.startsWith('#'));
    expect(links.length).toBeGreaterThanOrEqual(7);
    for (const link of links) expect(existsSync(resolve(root, link))).toBe(true);
  });

  it('contains no legacy contact or repository branding', () => {
    const markdown = read('README.md').toString('utf8');
    for (const term of [
      ['na', 'na', 'ya093'].join(''),
      ['na', 'na', '-wechat'].join(''),
      ['zhou', 'yue', 'chuan'].join(''),
      ['原', '住', '民'].join(''),
    ]) {
      expect(markdown.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });

  it('identifies the current maintainer and license boundary', () => {
    const markdown = read('README.md').toString('utf8');
    expect(markdown).toContain('作者与维护者：小杰');
    expect(markdown).toContain('[MIT License](LICENSE)');
  });
});

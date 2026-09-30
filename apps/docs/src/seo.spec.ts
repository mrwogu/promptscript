import { describe, expect, it } from 'vitest';
import { faqJsonLd, homeJsonLd, jsonLdTag, pageJsonLd } from './seo';

const parse = (content: string): { '@graph': Record<string, unknown>[] } => JSON.parse(content);

describe('jsonLdTag', () => {
  it('escapes < so page text cannot close the script tag', () => {
    const tag = jsonLdTag([{ name: '</script><b>' }]);

    expect(tag.content).not.toContain('<');
    expect(parse(tag.content)['@graph'][0].name).toBe('</script><b>');
  });
});

describe('homeJsonLd', () => {
  it('describes the website and the CLI with its version', () => {
    const graph = parse(homeJsonLd('1.2.3').content)['@graph'];

    expect(graph.map((node) => node['@type'])).toEqual(['WebSite', 'SoftwareApplication']);
    expect(graph[1].softwareVersion).toBe('1.2.3');
  });
});

describe('pageJsonLd', () => {
  it('adds an article and numbered breadcrumbs', () => {
    const graph = parse(
      pageJsonLd(
        {
          title: 'CI',
          description: 'CI guide',
          url: 'https://getpromptscript.dev/guides/ci/',
          dateModified: new Date('2026-01-02T03:04:05Z'),
        },
        [
          { name: 'PromptScript', url: 'https://getpromptscript.dev/' },
          { name: 'CI', url: 'https://getpromptscript.dev/guides/ci/' },
        ]
      ).content
    )['@graph'];

    expect(graph[0]).toMatchObject({
      '@type': 'TechArticle',
      headline: 'CI',
      description: 'CI guide',
      dateModified: '2026-01-02T03:04:05.000Z',
    });
    expect(graph[1].itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'PromptScript',
        item: 'https://getpromptscript.dev/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'CI',
        item: 'https://getpromptscript.dev/guides/ci/',
      },
    ]);
  });

  it('leaves out a missing description and date', () => {
    const [article] = parse(
      pageJsonLd({ title: 'X', url: 'https://getpromptscript.dev/x/' }, []).content
    )['@graph'];

    expect(article).not.toHaveProperty('description');
    expect(article).not.toHaveProperty('dateModified');
  });
});

describe('faqJsonLd', () => {
  it('turns each item into a question with an accepted answer', () => {
    const graph = parse(faqJsonLd([{ question: 'Is it free?', answer: 'Yes.' }]).content)['@graph'];

    expect(graph[0]['@type']).toBe('FAQPage');
    expect(graph[0].mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'Is it free?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes.' },
      },
    ]);
  });
});

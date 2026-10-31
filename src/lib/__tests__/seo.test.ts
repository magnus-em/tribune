import fs from 'fs';
import path from 'path';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import {
  DISALLOWED_PATHS,
  PUBLIC_ROUTES,
  SITE_DESCRIPTION,
  absoluteUrl,
  faqPageJsonLd,
  organizationJsonLd,
  serializeJsonLd,
} from '../seo';

const appDir = path.join(__dirname, '..', '..', 'app');
const routeExists = (p: string) =>
  fs.existsSync(path.join(appDir, p === '/' ? '' : p, 'page.tsx'));

describe('sitemap', () => {
  test('lists every public route as an absolute URL', () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toEqual(PUBLIC_ROUTES.map((r) => absoluteUrl(r.path)));
    for (const u of urls) expect(u).toMatch(/^https:\/\//);
  });

  test.each(PUBLIC_ROUTES.map((r) => r.path))('%s is a real page', (p) => {
    expect(routeExists(p)).toBe(true);
  });

  test('never includes a private path', () => {
    for (const r of PUBLIC_ROUTES) {
      for (const d of DISALLOWED_PATHS) expect(r.path.startsWith(d)).toBe(false);
    }
  });
});

describe('robots', () => {
  const r = robots();
  const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;

  test.each(['/admin', '/dashboard', '/api', '/auth', '/login'])('disallows %s', (p) => {
    expect(rules.disallow).toContain(p);
  });

  test('points at the sitemap', () => {
    expect(r.sitemap).toBe(absoluteUrl('/sitemap.xml'));
  });
});

describe('structured data', () => {
  test('organization is not typed as a law firm or LegalService', () => {
    const org = organizationJsonLd();
    const types = ([] as string[]).concat(org['@type'] as string | string[]);
    expect(types).not.toContain('LegalService');
    expect(types).not.toContain('Attorney');
    expect(org.description).toMatch(/Not a law firm/);
  });

  test('FAQPage mirrors the questions and answers it is given', () => {
    const faq = [{ q: 'Q1?', a: 'A1.' }, { q: 'Q2?', a: 'A2.' }];
    expect(faqPageJsonLd(faq)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Q1?', acceptedAnswer: { '@type': 'Answer', text: 'A1.' } },
        { '@type': 'Question', name: 'Q2?', acceptedAnswer: { '@type': 'Answer', text: 'A2.' } },
      ],
    });
  });

  test('serialization cannot close the script tag', () => {
    const out = serializeJsonLd({ text: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(JSON.parse(out).text).toBe('</script><script>alert(1)</script>');
  });
});

test('site description keeps Tribune as the actor and the 21-day deadline', () => {
  expect(SITE_DESCRIPTION).not.toMatch(/\b(we|us|our)\b/i);
  expect(SITE_DESCRIPTION).toMatch(/21 days/);
});

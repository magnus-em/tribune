import {
  followUpAvailableMessage,
  followUpAvailableSubject,
  renderFollowUpAvailableEmail,
} from '../follow-up-available';

const props = {
  tenantName: 'Jane Doe',
  caseId: '123e4567-e89b-12d3-a456-426614174000',
  letterNumber: 2,
  siteUrl: 'https://usetribune.org',
};

describe('follow-up available email', () => {
  const html = renderFollowUpAvailableEmail(props);

  test('links to the tenant case page', () => {
    expect(html).toContain('https://usetribune.org/dashboard/case/123e4567-e89b-12d3-a456-426614174000');
  });

  test('says nothing was sent and the letter needs the tenant\'s approval', () => {
    expect(html).toContain('Nothing has been sent.');
    expect(html).toContain('only if you read it and approve it');
  });

  test('carries the information-not-advice disclaimer', () => {
    expect(html).toContain('Legal Information, Not Legal Advice');
    expect(html).toContain('does not provide legal advice');
  });

  test('Tribune is the actor: no we/us/our/team voice', () => {
    const text = html.replace(/<[^>]+>/g, ' ');
    expect(text).not.toMatch(/\b(we|us|our|we're|I)\b/i);
    expect(text).not.toMatch(/\bteam\b|\badmin\b/i);
    expect(text).toContain('— Tribune');
  });

  test('uses only the first name and escapes it', () => {
    expect(html).toContain('Hi Jane,');
    expect(html).not.toContain('Doe');
    const evil = renderFollowUpAvailableEmail({ ...props, tenantName: '<script>x</script> Doe' });
    expect(evil).not.toContain('<script>');
    expect(evil).toContain('&lt;script&gt;x&lt;/script&gt;');
  });

  test('falls back when no name is on file', () => {
    expect(renderFollowUpAvailableEmail({ ...props, tenantName: '  ' })).toContain('Hi there,');
  });

  test('subject and in-app message name the letter and keep approval with the tenant', () => {
    expect(followUpAvailableSubject(3)).toBe('Letter 3 is ready for your review — Tribune');
    const msg = followUpAvailableMessage(3, new Date('2026-10-28T15:00:00.000Z'));
    expect(msg.title).toBe('Letter 3 is ready for your review');
    expect(msg.body).toContain('October 28, 2026');
    expect(msg.body).toContain('only if you read it and approve it');
    expect(msg.body).not.toMatch(/\b(we|us|our)\b/i);
  });
});

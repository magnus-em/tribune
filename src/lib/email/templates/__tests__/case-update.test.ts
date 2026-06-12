import { renderCaseUpdateEmail } from '../case-update';
import type { CaseUpdateEmailProps } from '../case-update';

describe('Case Update Email Template', () => {
  const mockProps: CaseUpdateEmailProps = {
    tenantName: 'Jane Doe',
    caseId: '123e4567-e89b-12d3-a456-426614174000',
    messageTitle: 'Your demand letter is ready',
    messagePreview: 'We have prepared your first demand letter. Please review it in your dashboard.',
    siteUrl: 'https://usetribune.org',
  };

  test('renders valid HTML email', () => {
    const html = renderCaseUpdateEmail(mockProps);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html>');
    expect(html).toContain('</html>');
  });

  test('includes tenant name', () => {
    const html = renderCaseUpdateEmail(mockProps);

    expect(html).toContain('Hi Jane');
  });

  test('includes message title and preview', () => {
    const html = renderCaseUpdateEmail(mockProps);

    expect(html).toContain('Your demand letter is ready');
    expect(html).toContain('We have prepared your first demand letter');
  });

  test('includes link to case with correct URL', () => {
    const html = renderCaseUpdateEmail(mockProps);

    expect(html).toContain('https://usetribune.org/dashboard/case/123e4567-e89b-12d3-a456-426614174000');
    expect(html).toContain('View Full Update');
  });

  test('includes legal disclaimer', () => {
    const html = renderCaseUpdateEmail(mockProps);

    expect(html).toContain('Legal Information, Not Legal Advice');
    expect(html).toContain('Tribune is not a law firm');
    expect(html).toContain('does not provide legal advice');
  });

  test('includes Tribune branding', () => {
    const html = renderCaseUpdateEmail(mockProps);

    expect(html).toContain('Tribune');
    expect(html).toContain('usetribune.org');
  });

  test('has proper email styling', () => {
    const html = renderCaseUpdateEmail(mockProps);

    expect(html).toContain('font-family');
    expect(html).toContain('max-width: 600px');
    expect(html).toContain('background-color');
  });

  test('handles different tenant names', () => {
    const propsWithLongName = {
      ...mockProps,
      tenantName: 'Christopher Alexander Johnson',
    };

    const html = renderCaseUpdateEmail(propsWithLongName);

    expect(html).toContain('Hi Christopher');
  });

  test('handles different site URLs', () => {
    const propsWithDifferentUrl = {
      ...mockProps,
      siteUrl: 'http://localhost:3000',
    };

    const html = renderCaseUpdateEmail(propsWithDifferentUrl);

    expect(html).toContain('http://localhost:3000/dashboard/case/');
    expect(html).toContain('localhost:3000');
  });

  test('truncates long message previews appropriately', () => {
    const propsWithLongPreview = {
      ...mockProps,
      messagePreview: 'A'.repeat(500), // Very long preview
    };

    const html = renderCaseUpdateEmail(propsWithLongPreview);

    expect(html).toContain('A');
    expect(html.length).toBeLessThan(10000); // Should not be excessively long
  });
});

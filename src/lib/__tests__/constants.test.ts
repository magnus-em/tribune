import {
  CONTINGENCY_PCT,
  STATUTE_DAYS,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_FILE_TYPES,
  MIN_LETTER_NUMBER,
  MAX_LETTER_NUMBER,
} from '../constants';

describe('Business Constants', () => {
  test('contingency percentage is 15%', () => {
    expect(CONTINGENCY_PCT).toBe(15);
  });

  test('statutory deadline is 21 days (CT § 47a-21)', () => {
    expect(STATUTE_DAYS).toBe(21);
  });

  test('max file size is 10MB', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });

  test('allowed file types include common document formats', () => {
    expect(ALLOWED_FILE_TYPES).toContain('application/pdf');
    expect(ALLOWED_FILE_TYPES).toContain('image/jpeg');
    expect(ALLOWED_FILE_TYPES).toContain('image/png');
  });

  test('letter numbers range from 1 to 3', () => {
    expect(MIN_LETTER_NUMBER).toBe(1);
    expect(MAX_LETTER_NUMBER).toBe(3);
  });
});

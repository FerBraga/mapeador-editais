import { truncateText } from '../text-truncation';

describe('truncateText', () => {
  it('returns the text unchanged when it is within the limit', () => {
    expect(truncateText('texto curto', 100)).toBe('texto curto');
  });

  it('truncates text that exceeds the configured limit', () => {
    const text = 'a'.repeat(50);
    expect(truncateText(text, 10)).toBe('a'.repeat(10));
  });

  it('handles text exactly at the limit without truncating', () => {
    const text = 'a'.repeat(10);
    expect(truncateText(text, 10)).toBe(text);
  });
});

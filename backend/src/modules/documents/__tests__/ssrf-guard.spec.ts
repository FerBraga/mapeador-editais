import { isAllowedScheme, isPrivateOrReservedIp } from '../ssrf-guard';

describe('isAllowedScheme', () => {
  it('allows http and https', () => {
    expect(isAllowedScheme(new URL('http://example.test/file.pdf'))).toBe(true);
    expect(isAllowedScheme(new URL('https://example.test/file.pdf'))).toBe(true);
  });

  it('rejects other schemes', () => {
    expect(isAllowedScheme(new URL('file:///etc/passwd'))).toBe(false);
    expect(isAllowedScheme(new URL('ftp://example.test/file.pdf'))).toBe(false);
  });
});

describe('isPrivateOrReservedIp', () => {
  it('rejects IPv4 private/loopback/link-local ranges', () => {
    expect(isPrivateOrReservedIp('10.0.0.5', 4)).toBe(true);
    expect(isPrivateOrReservedIp('127.0.0.1', 4)).toBe(true);
    expect(isPrivateOrReservedIp('192.168.1.1', 4)).toBe(true);
    expect(isPrivateOrReservedIp('172.16.0.1', 4)).toBe(true);
    expect(isPrivateOrReservedIp('169.254.169.254', 4)).toBe(true);
  });

  it('allows public IPv4 addresses', () => {
    expect(isPrivateOrReservedIp('8.8.8.8', 4)).toBe(false);
    expect(isPrivateOrReservedIp('200.160.2.3', 4)).toBe(false);
  });

  it('rejects IPv6 loopback and link-local ranges', () => {
    expect(isPrivateOrReservedIp('::1', 6)).toBe(true);
    expect(isPrivateOrReservedIp('fe80::1', 6)).toBe(true);
    expect(isPrivateOrReservedIp('fc00::1', 6)).toBe(true);
  });

  it('allows public IPv6 addresses', () => {
    expect(isPrivateOrReservedIp('2001:4860:4860::8888', 6)).toBe(false);
  });
});

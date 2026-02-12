import { describe, it, expect } from 'vitest';
import { calculateAllowedIPs, mergeIntervals, subtractIntervals, rangeToCidrs } from './cidr';
import { ipToBigInt, bigIntToIp, ipv6ToBigInt, bigIntToIpv6, isValidCidr, parseCidr } from './ip';

describe('CIDR Logic', () => {
  describe('Basic IPv4 Exclusions', () => {
    it('should exclude single private range from full range (IPv4)', () => {
      const excludes = ['192.168.0.0/24'];
      const result = calculateAllowedIPs(excludes);
      expect(result).toContain('0.0.0.0/1');
      expect(result).toContain('::/0');
    });

    it('should handle empty exclusions', () => {
      const excludes: string[] = [];
      const result = calculateAllowedIPs(excludes);
      expect(result).toContain('0.0.0.0/0');
      expect(result).toContain('::/0');
    });

    it('should exclude multiple private ranges', () => {
      const excludes = ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12'];
      const result = calculateAllowedIPs(excludes);
      // Result should NOT contain 0.0.0.0/0 since ranges are excluded
      expect(result).not.toContain('0.0.0.0/0');
      // Should have multiple CIDRs to cover remaining space
      expect(result.length).toBeGreaterThan(1);
    });

    it('should handle /32 single IP exclusion', () => {
      const excludes = ['8.8.8.8/32'];
      const result = calculateAllowedIPs(excludes);
      expect(result).not.toContain('0.0.0.0/0');
      expect(result.length).toBeGreaterThan(1);
    });
  });

  describe('IPv6 Exclusions', () => {
    it('should handle IPv6 exclusion', () => {
      const excludes = ['2001:db8::/32'];
      const result = calculateAllowedIPs(excludes);
      
      expect(result).toContain('0.0.0.0/0');
      expect(result).not.toContain('::/0');
      expect(result.length).toBeGreaterThan(1);
    });

    it('should exclude IPv6 localhost', () => {
      const excludes = ['::1/128'];
      const result = calculateAllowedIPs(excludes);
      expect(result).not.toContain('::/0');
    });

    it('should handle IPv6 ULA range exclusion', () => {
      const excludes = ['fd00::/8'];
      const result = calculateAllowedIPs(excludes);
      expect(result).not.toContain('::/0');
    });
  });

  describe('Dual Stack Exclusions', () => {
    it('should handle dual stack exclusions', () => {
      const excludes = ['192.168.0.0/24', '2001:db8::/32'];
      const result = calculateAllowedIPs(excludes);
      
      expect(result).toContain('0.0.0.0/1');
      expect(result).not.toContain('0.0.0.0/0');
      expect(result).not.toContain('::/0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle overlapping ranges', () => {
      const excludes = ['192.168.0.0/16', '192.168.1.0/24'];
      const result = calculateAllowedIPs(excludes);
      // Should not error and should exclude both properly
      expect(result).not.toContain('0.0.0.0/0');
    });

    it('should handle adjacent ranges', () => {
      const excludes = ['192.168.0.0/24', '192.168.1.0/24'];
      const result = calculateAllowedIPs(excludes);
      expect(result).not.toContain('0.0.0.0/0');
    });

    it('should exclude entire IPv4 space', () => {
      const excludes = ['0.0.0.0/0'];
      const result = calculateAllowedIPs(excludes);
      // Should have no IPv4 results (or empty IPv4 portion)
      const ipv4Results = result.filter(r => !r.includes(':'));
      expect(ipv4Results.length).toBe(0);
    });
  });
});

describe('CIDR Parsing', () => {
  describe('Valid CIDRs', () => {
    it('should parse valid IPv4 CIDR', () => {
      const result = parseCidr('192.168.1.0/24');
      expect(result).not.toBeNull();
      expect(result?.prefix).toBe(24);
    });

    it('should parse valid IPv6 CIDR', () => {
      const result = parseCidr('2001:db8::/32');
      expect(result).not.toBeNull();
      expect(result?.prefix).toBe(32);
    });

    it('should parse /32 IPv4', () => {
      const result = parseCidr('8.8.8.8/32');
      expect(result).not.toBeNull();
      expect(result?.prefix).toBe(32);
    });

    it('should parse /128 IPv6', () => {
      const result = parseCidr('::1/128');
      expect(result).not.toBeNull();
      expect(result?.prefix).toBe(128);
    });

    it('should parse /0 (full range)', () => {
      const result = parseCidr('0.0.0.0/0');
      expect(result).not.toBeNull();
      expect(result?.prefix).toBe(0);
    });
  });

  describe('Invalid CIDRs', () => {
    it('should reject invalid format (no prefix)', () => {
      expect(() => parseCidr('192.168.1.0')).toThrow();
    });

    it('should reject invalid format (no IP)', () => {
      expect(() => parseCidr('/24')).toThrow();
    });

    it('should reject invalid IPv4 address', () => {
      expect(() => parseCidr('256.1.1.1/24')).toThrow();
    });

    it('should reject prefix out of range (IPv4)', () => {
      expect(() => parseCidr('192.168.1.0/33')).toThrow();
    });

    it('should reject prefix out of range (IPv6)', () => {
      expect(() => parseCidr('2001:db8::/129')).toThrow();
    });
  });
});

describe('Range to CIDRs Conversion', () => {
  it('should convert /24 range correctly', () => {
    const start = ipToBigInt('192.168.1.0');
    const end = ipToBigInt('192.168.1.255');
    const result = rangeToCidrs(start, end, 4);
    expect(result.length).toBe(1);
    expect(result[0]).toBe('192.168.1.0/24');
  });

  it('should convert /16 range correctly', () => {
    const start = ipToBigInt('10.0.0.0');
    const end = ipToBigInt('10.0.255.255');
    const result = rangeToCidrs(start, end, 4);
    expect(result.length).toBe(1);
    expect(result[0]).toBe('10.0.0.0/16');
  });

  it('should convert /32 (single IP) correctly', () => {
    const start = ipToBigInt('8.8.8.8');
    const end = ipToBigInt('8.8.8.8');
    const result = rangeToCidrs(start, end, 4);
    expect(result.length).toBe(1);
    expect(result[0]).toBe('8.8.8.8/32');
  });

  it('should convert full IPv4 range', () => {
    const start = ipToBigInt('0.0.0.0');
    const end = ipToBigInt('255.255.255.255');
    const result = rangeToCidrs(start, end, 4);
    expect(result.length).toBe(1);
    expect(result[0]).toBe('0.0.0.0/0');
  });
});

describe('IP Utilities', () => {
  describe('IPv4 Conversions', () => {
    it('should convert IP to BigInt correctly', () => {
      expect(ipToBigInt('0.0.0.0')).toBe(0n);
      expect(ipToBigInt('0.0.0.1')).toBe(1n);
      expect(ipToBigInt('255.255.255.255')).toBe(4294967295n);
      expect(ipToBigInt('192.168.1.1')).toBe(3232235777n);
    });

    it('should convert BigInt to IP correctly', () => {
      expect(bigIntToIp(0n)).toBe('0.0.0.0');
      expect(bigIntToIp(1n)).toBe('0.0.0.1');
      expect(bigIntToIp(4294967295n)).toBe('255.255.255.255');
      expect(bigIntToIp(3232235777n)).toBe('192.168.1.1');
    });

    it('should be reversible', () => {
      const ips = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '8.8.8.8'];
      for (const ip of ips) {
        expect(bigIntToIp(ipToBigInt(ip))).toBe(ip);
      }
    });
  });

  describe('IPv6 Conversions', () => {
    it('should convert IPv6 to BigInt correctly', () => {
      expect(ipv6ToBigInt('::')).toBe(0n);
      expect(ipv6ToBigInt('::1')).toBe(1n);
    });

    it('should convert BigInt to IPv6 correctly', () => {
      expect(bigIntToIpv6(0n)).toBe('::');
      expect(bigIntToIpv6(1n)).toBe('::1');
    });
  });

  describe('CIDR Validation', () => {
    it('should validate correct CIDRs', () => {
      expect(isValidCidr('192.168.1.0/24')).toBe(true);
      expect(isValidCidr('10.0.0.0/8')).toBe(true);
      expect(isValidCidr('0.0.0.0/0')).toBe(true);
      expect(isValidCidr('::/0')).toBe(true);
      expect(isValidCidr('2001:db8::/32')).toBe(true);
    });

    it('should reject invalid CIDRs', () => {
      expect(isValidCidr('192.168.1.0')).toBe(false);
      expect(isValidCidr('192.168.1.0/')).toBe(false);
      expect(isValidCidr('/24')).toBe(false);
      expect(isValidCidr('invalid')).toBe(false);
      expect(isValidCidr('192.168.1.0/33')).toBe(false);
    });
  });
});

describe('Interval Operations', () => {
  describe('Merge Intervals', () => {
    it('should merge overlapping intervals', () => {
      const intervals = [
        { start: 0n, end: 10n, version: 4 as const },
        { start: 5n, end: 15n, version: 4 as const },
      ];
      const result = mergeIntervals(intervals);
      expect(result.length).toBe(1);
      expect(result[0].start).toBe(0n);
      expect(result[0].end).toBe(15n);
    });

    it('should merge adjacent intervals', () => {
      const intervals = [
        { start: 0n, end: 10n, version: 4 as const },
        { start: 11n, end: 20n, version: 4 as const },
      ];
      const result = mergeIntervals(intervals);
      expect(result.length).toBe(1);
      expect(result[0].start).toBe(0n);
      expect(result[0].end).toBe(20n);
    });

    it('should not merge non-adjacent intervals', () => {
      const intervals = [
        { start: 0n, end: 10n, version: 4 as const },
        { start: 20n, end: 30n, version: 4 as const },
      ];
      const result = mergeIntervals(intervals);
      expect(result.length).toBe(2);
    });
  });

  describe('Subtract Intervals', () => {
    it('should subtract middle range', () => {
      const base = { start: 0n, end: 100n, version: 4 as const };
      const excludes = [{ start: 40n, end: 60n, version: 4 as const }];
      const result = subtractIntervals(base, excludes);
      expect(result.length).toBe(2);
      expect(result[0].start).toBe(0n);
      expect(result[0].end).toBe(39n);
      expect(result[1].start).toBe(61n);
      expect(result[1].end).toBe(100n);
    });

    it('should subtract start range', () => {
      const base = { start: 0n, end: 100n, version: 4 as const };
      const excludes = [{ start: 0n, end: 20n, version: 4 as const }];
      const result = subtractIntervals(base, excludes);
      expect(result.length).toBe(1);
      expect(result[0].start).toBe(21n);
      expect(result[0].end).toBe(100n);
    });

    it('should subtract end range', () => {
      const base = { start: 0n, end: 100n, version: 4 as const };
      const excludes = [{ start: 80n, end: 100n, version: 4 as const }];
      const result = subtractIntervals(base, excludes);
      expect(result.length).toBe(1);
      expect(result[0].start).toBe(0n);
      expect(result[0].end).toBe(79n);
    });
  });
});

describe('WireGuard Use Cases', () => {
  it('should generate AllowedIPs for VPN with LAN exclusion', () => {
    // Common WireGuard use case: route all through VPN except local LAN
    const excludes = ['192.168.0.0/16', '10.0.0.0/8'];
    const result = calculateAllowedIPs(excludes);
    
    // Should NOT contain 0.0.0.0/0
    expect(result).not.toContain('0.0.0.0/0');
    // Should contain ::/0 for IPv6
    expect(result).toContain('::/0');
  });

  it('should handle typical home network exclusion', () => {
    // Typical home router network
    const excludes = ['192.168.1.0/24'];
    const result = calculateAllowedIPs(excludes);
    
    expect(result).not.toContain('0.0.0.0/0');
    expect(result.length).toBeGreaterThan(1);
  });

  it('should handle corporate network exclusion', () => {
    // Corporate network with multiple ranges
    const excludes = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
    const result = calculateAllowedIPs(excludes);
    
    expect(result).not.toContain('0.0.0.0/0');
    // Should still route IPv6 through VPN
    expect(result).toContain('::/0');
  });

  it('should handle cloud provider IP exclusion', () => {
    // Exclude specific cloud ranges
    const excludes = ['8.8.8.0/24']; // Example: Google DNS range
    const result = calculateAllowedIPs(excludes);
    
    expect(result).not.toContain('0.0.0.0/0');
    expect(result.length).toBeGreaterThan(1);
  });
});

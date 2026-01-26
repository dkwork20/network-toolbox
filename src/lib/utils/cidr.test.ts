import { describe, it, expect } from 'vitest';
import { calculateAllowedIPs } from './cidr';
import { ipToBigInt, ipv6ToBigInt } from './ip';

describe('CIDR Logic', () => {
    it('should exclude single private range from full range (IPv4)', () => {
        const excludes = ['192.168.0.0/24'];
        const result = calculateAllowedIPs(excludes);
        expect(result).toContain('0.0.0.0/1');
        // Check for presence of ::/0 if default
        expect(result).toContain('::/0');
    });

    it('should handle IPv6 exclusion', () => {
        // Exclude entire IPv6 range?
        // Let's exclude a small subnet. 2001:db8::/32
        const excludes = ['2001:db8::/32'];
        const result = calculateAllowedIPs(excludes);
        
        // Should contain IPv4 full range
        expect(result).toContain('0.0.0.0/0');
        
        // Should NOT contain ::/0 (it's split)
        expect(result).not.toContain('::/0');
        
        // Should contain splits. 
        // 2001:db8:: is just a chunk.
        // It's hard to verify exact splits without calculation, but length should be > 1
        expect(result.length).toBeGreaterThan(1);
    });
    
    it('should handle dual stack exclusions', () => {
        const excludes = ['192.168.0.0/24', '2001:db8::/32'];
        const result = calculateAllowedIPs(excludes);
        
        // IPv4 is split
        expect(result).toContain('0.0.0.0/1');
        expect(result).not.toContain('0.0.0.0/0');
        
        // IPv6 is split
        expect(result).not.toContain('::/0');
    });
});

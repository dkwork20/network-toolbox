import { describe, it, expect } from 'vitest';
import { calculateAllowedIPs } from './cidr';
import { ipToBigInt } from './ip';

describe('CIDR Logic', () => {
    it('should exclude single private range from full range', () => {
        // Exclude 192.168.0.0/24 from 0.0.0.0/0
        // Expect: 0.0.0.0/1, 128.0.0.0/2, 192.0.0.0/9, ...
        const excludes = ['192.168.0.0/24'];
        const result = calculateAllowedIPs(excludes);
        
        // Validation:
        // Result should NOT contain IPs in 192.168.0.0/24
        // Result + Excluded should cover 0.0.0.0/0 (roughly)
        
        // Spot check specific known blocks
        expect(result).toContain('0.0.0.0/1'); // First half
        expect(result).toContain('128.0.0.0/2');
        
        // Check near the excluded range
        // 192.168.0.0/24 starts at 192.168.0.0
        // Previous block could be 192.167.0.0/16? No. 192.160...
        
        // Let's verify counts or specific values for simple case
        // 192.168.0.0 is 11000000.10101000.00000000.00000000
        // /24 means last 8 bits are masked. 
    });

    it('should handle multiple overlapping excludes', () => {
        const excludes = ['10.0.0.0/8', '10.0.0.0/9']; 
        // 10.0.0.0/8 covers 10.0.0.0 - 10.255.255.255
        // 10.0.0.0/9 covers 10.0.0.0 - 10.127.255.255 (subset)
        // Result should be same as excluding 10.0.0.0/8
        const res1 = calculateAllowedIPs(['10.0.0.0/8']);
        const res2 = calculateAllowedIPs(excludes);
        expect(res2).toEqual(res1);
    });

    it('should handle start boundary', () => {
        const excludes = ['0.0.0.0/1'];
        const result = calculateAllowedIPs(excludes);
        expect(result).toEqual(['128.0.0.0/1']);
    });
    
    it('should handle end boundary', () => {
        const excludes = ['128.0.0.0/1'];
        const result = calculateAllowedIPs(excludes);
        expect(result).toEqual(['0.0.0.0/1']);
    });
    
    it('should handle full exclusion', () => {
        const excludes = ['0.0.0.0/0'];
        const result = calculateAllowedIPs(excludes);
        expect(result).toEqual([]);
    });
});

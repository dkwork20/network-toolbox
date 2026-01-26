import { ipToBigInt, bigIntToIp, parseCidr } from './ip';

interface Interval {
    start: bigint;
    end: bigint;
}

/**
 * Merges overlapping or adjacent intervals.
 * @param intervals List of intervals
 */
export function mergeIntervals(intervals: Interval[]): Interval[] {
    if (intervals.length === 0) return [];
    
    // Sort by start address
    const sorted = [...intervals].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
    
    const result: Interval[] = [];
    let current = sorted[0];
    
    for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        // If overlap or adjacent (end + 1 >= next.start)
        if (current.end + 1n >= next.start) {
            current.end = current.end > next.end ? current.end : next.end;
        } else {
            result.push(current);
            current = next;
        }
    }
    result.push(current);
    
    return result;
}

/**
 * Subtracts a list of excluded intervals from a base interval.
 * @param base The base interval (AllowedIPs usually 0.0.0.0/0 -> 0 to Max)
 * @param excludes List of intervals to remove
 */
export function subtractIntervals(base: Interval, excludes: Interval[]): Interval[] {
    const sortedExcludes = mergeIntervals(excludes);
    const result: Interval[] = [];
    
    let currentStart = base.start;
    
    for (const exclude of sortedExcludes) {
        // If exclude is completely beyond allowed range, stop
        if (exclude.start > base.end) break;
        
        // If exclude is completely before allowed range, skip
        if (exclude.end < currentStart) continue;
        
        // Calculate overlap
        const overlapStart = exclude.start > currentStart ? exclude.start : currentStart;
        const overlapEnd = exclude.end < base.end ? exclude.end : base.end;
        
        // If there is a valid IP block before the overlap
        if (overlapStart > currentStart) {
            result.push({ start: currentStart, end: overlapStart - 1n });
        }
        
        // Move current pointer past the overlap
        currentStart = overlapEnd + 1n;
        
        if (currentStart > base.end) break;
    }
    
    // Add remaining tail
    if (currentStart <= base.end) {
        result.push({ start: currentStart, end: base.end });
    }
    
    return result;
}

/**
 * Converts a range [start, end] to a list of minimal CIDRs.
 * @param start Start IP BigInt
 * @param end End IP BigInt
 */
export function rangeToCidrs(start: bigint, end: bigint): string[] {
    const cidrs: string[] = [];
    let current = start;
    
    while (current <= end) {
        // Find largest power of 2 that fits alignment
        let maxBits = 0;
        while (maxBits < 32 && current % (2n << BigInt(maxBits)) === 0n) {
            maxBits++;
        }
        
        // Constrain by end
        // Width = 2^bits. Need (current + width - 1) <= end
        let bits = BigInt(maxBits);
        while (bits >= 0n) {
            const width = 1n << bits;
            if (current + width - 1n <= end) {
                // Found largest block
                const prefix = 32n - bits;
                cidrs.push(`${bigIntToIp(current)}/${prefix}`);
                current += width;
                break;
            }
            bits--;
        }
    }
    
    return cidrs;
}

/**
 * Main function: Given excluded CIDRs, return minimal AllowedIPs CIDRs.
 * @param excludedCidrs Array of CIDR strings to exclude
 * @param fullRangeCidr The full range (default 0.0.0.0/0)
 */
export function calculateAllowedIPs(excludedCidrs: string[], fullRangeCidr: string = '0.0.0.0/0'): string[] {
    const fullRange = parseCidr(fullRangeCidr);
    const baseInterval: Interval = { start: fullRange.start, end: fullRange.end };
    
    const excludeIntervals: Interval[] = [];
    for (const cidr of excludedCidrs) {
        if (!cidr.trim()) continue;
        try {
            const { start, end } = parseCidr(cidr.trim());
            excludeIntervals.push({ start, end });
        } catch (e) {
            console.warn(`Skipping invalid CIDR: ${cidr}`, e);
        }
    }
    
    const allowedIntervals = subtractIntervals(baseInterval, excludeIntervals);
    
    const resultCidrs: string[] = [];
    for (const interval of allowedIntervals) {
        resultCidrs.push(...rangeToCidrs(interval.start, interval.end));
    }
    
    return resultCidrs;
}

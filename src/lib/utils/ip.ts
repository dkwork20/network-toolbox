/**
 * Converts a standard IPv4 string to a BigInt.
 */
export function ipToBigInt(ip: string): bigint {
	const parts = ip.split('.');
	if (parts.length !== 4) {
		throw new Error(`Invalid IPv4 address: ${ip}`);
	}
	let result = 0n;
	for (const part of parts) {
		const num = parseInt(part, 10);
		if (isNaN(num) || num < 0 || num > 255) {
			throw new Error(`Invalid IPv4 octet: ${part}`);
		}
		result = (result << 8n) + BigInt(num);
	}
	return result;
}

/**
 * Converts a BigInt to a standard IPv4 string.
 */
export function bigIntToIp(num: bigint): string {
	if (num < 0n || num > 0xffffffffn) {
		throw new Error(`Value out of IPv4 range: ${num}`);
	}
	const parts: string[] = [];
	for (let i = 0; i < 4; i++) {
		const part = Number(num & 0xffn);
		parts.unshift(part.toString());
		num = num >> 8n;
	}
	return parts.join('.');
}

/**
 * Checks if string is likely IPv6
 */
export function isIpv6(ip: string): boolean {
    return ip.includes(':');
}

/**
 * Converts IPv6 string to BigInt with robust expansion logic
 */
export function ipv6ToBigInt(ip: string): bigint {
     if (!ip) throw new Error('Empty IP');
     
     // Handle standard IPv6 expansion
     let parts: string[] = [];
     
     if (ip === '::') {
         parts = new Array(8).fill('0');
     } else if (ip.startsWith('::')) {
          // ::1 -> "", "1". 
          const rest = ip.substring(2).split(':');
          parts = [...new Array(8 - rest.length).fill('0'), ...rest];
     } else if (ip.endsWith('::')) {
          // 1:: -> "1", "".
          const rest = ip.substring(0, ip.length - 2).split(':');
          parts = [...rest, ...new Array(8 - rest.length).fill('0')];
     } else if (ip.includes('::')) {
          const splits = ip.split('::');
          if (splits.length > 2) throw new Error('Invalid IPv6: multiple ::');
          const [pre, post] = splits;
          const preParts = pre.split(':');
          const postParts = post.split(':');
          const missing = 8 - (preParts.length + postParts.length);
          if (missing < 0) throw new Error(`Invalid IPv6: too many segments`);
          parts = [...preParts, ...new Array(missing).fill('0'), ...postParts];
     } else {
          parts = ip.split(':');
     }
     
    if (parts.length !== 8) throw new Error(`Invalid IPv6: expected 8 segments, got ${parts.length}`);

    let num = 0n;
    for ( let i = 0; i < 8; i++) {
        const hex = parts[i];
        if (!/^[0-9a-fA-F]{1,4}$/.test(hex) && hex !== '0' && hex !== '') { 
            throw new Error(`Invalid IPv6 segment: "${hex}"`);
        }
        const val = parseInt(hex || '0', 16);
        if (isNaN(val)) throw new Error(`Invalid segment value: ${hex}`);
        num = (num << 16n) + BigInt(val);
    }
    return num;
}

export function bigIntToIpv6(num: bigint): string {
    if (num < 0n || num > (1n << 128n) - 1n) throw new Error('Value out of IPv6 range');
    
    const parts: string[] = [];
    for (let i = 0; i < 8; i++) {
        const segment = num & 0xffffn;
        parts.unshift(segment.toString(16));
        num = num >> 16n;
    }

    // Find longest sequence of '0' segments
    let longestStart = -1;
    let longestLen = 0;
    let currentStart = -1;
    let currentLen = 0;

    for (let i = 0; i < 8; i++) {
        if (parts[i] === '0') {
            if (currentStart === -1) currentStart = i;
            currentLen++;
        } else {
            if (currentLen > longestLen) {
                longestLen = currentLen;
                longestStart = currentStart;
            }
            currentStart = -1;
            currentLen = 0;
        }
    }
    // Check end
    if (currentLen > longestLen) {
        longestLen = currentLen;
        longestStart = currentStart;
    }

    if (longestLen > 1) {
        const head = parts.slice(0, longestStart).join(':');
        const tail = parts.slice(longestStart + longestLen).join(':');
        return `${head}::${tail}`;
    }

    return parts.join(':');
}

/**
 * Validates CIDR (v4 or v6)
 */
export function isValidCidr(cidr: string): boolean {
    try {
        parseCidr(cidr);
        return true;
    } catch {
        return false;
    }
}

/**
 * Parses CIDR (v4 or v6)
 */
export function parseCidr(cidr: string) {
    const [ipStr, maskStr] = cidr.split('/');
    if (!ipStr || !maskStr) throw new Error(`Invalid CIDR format: ${cidr}`);
    
    const isV6 = isIpv6(ipStr);
    const prefix = parseInt(maskStr, 10);
    const totalBits = isV6 ? 128n : 32n;
    
    if (isNaN(prefix) || prefix < 0 || prefix > Number(totalBits)) throw new Error(`Invalid prefix length: ${maskStr}`);
    
    const ipVal = isV6 ? ipv6ToBigInt(ipStr) : ipToBigInt(ipStr);
    
    const hostBits = totalBits - BigInt(prefix);
    const start = (ipVal >> hostBits) << hostBits;
    const end = start + (1n << hostBits) - 1n;
    
    return { start, end, prefix, version: isV6 ? 6 : 4 };
}

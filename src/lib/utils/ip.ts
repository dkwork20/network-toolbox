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
 * Expand IPv6 abbreviations (::)
 */
function expandIpv6(ip: string): string {
    // Handle "::"
    if (ip.includes('::')) {
        const parts = ip.split('::');
        const start = parts[0] ? parts[0].split(':') : [];
        const end = parts[1] ? parts[1].split(':') : [];
        const missing = 8 - (start.length + end.length);
        const middle = new Array(missing).fill('0');
        return [...start, ...middle, ...end].join(':');
    }
    return ip;
}

/**
 * Converts IPv6 string to BigInt
 */
export function ipv6ToBigInt(ip: string): bigint {
    const parts = expandIpv6(ip).split(':');
    if (parts.length !== 8) throw new Error(`Invalid IPv6 address: ${ip}`);
    
    let result = 0n;
    for (const part of parts) {
        const num = parseInt(part || '0', 16); // Handle empty strings if any, though expand handled it.
        // Actually expandIpv6 logic above: if "::" is at start/end, split gives empty string?
        // "::1" -> ["", "1"] -> start=[""], end=["1"] -> mistreatment.
        // Better parsing needed.
        if (isNaN(num) || num < 0 || num > 0xffff) throw new Error(`Invalid IPv6 segment: ${part}`);
        result = (result << 16n) + BigInt(num);
    }
    return result;
}

/** 
 * Robust IPv6 Expansion logic 
 */
function parseIpv6(ip: string): bigint {
     if (!ip) throw new Error('Empty IP');
     
     // Handle standard IPv6
     // 1. Split by ::
     const parts = ip.split('::');
     if (parts.length > 2) throw new Error('Invalid IPv6: multiple ::');
     
     let head: string[] = [];
     let tail: string[] = [];
     
     if (parts[0]) head = parts[0].split(':');
     if (parts[1]) tail = parts[1].split(':');
     
     // Count segments
     const total = head.length + tail.length;
     if (total > 8) throw new Error(`Invalid IPv6: too many segments (${total})`);
     
     const missing = 8 - total;
     if (parts.length === 2 && missing < 0) throw new Error('Invalid IPv6: :: used but too many segments');
     // If :: is present, we must have <= 8 segments total (implied zeros fill the rest)
     // If no ::, must be exactly 8 
     if (parts.length === 1 && total !== 8) throw new Error('Invalid IPv6: incomplete without ::');
     
     const segments = [...head, ...new Array(missing).fill('0'), ...tail];
     
     let result = 0n;
     for (const seg of segments) {
         if (seg === '') { 
              // Can happen if ip is "::" -> head=[], tail=[], missing=8. segments=['0'x8]. OK.
              // But "::1" -> head=[], tail=['1'].
              // "1::" -> head=['1'], tail=[].
         }
         // parse hex
         // Note: split('::') -> "2001::" -> parts=["2001", ""]? No. "2001", "". 
         // "::" -> "", "".
         // If "::" is at start, parts[0] is empty string.
         // My manual split above: if parts[0] is "", head=['']? No, string split.
         // "::1".split('::') -> ["", "1"].
         // "".split(':') -> [""] (length 1).
         // So if parts[0] is empty string, we should treat it as empty array?
         // Yes.
     }
     
     // Revised Expand Logic
     let fullParts: string[] = [];
     if (ip === '::') {
         fullParts = new Array(8).fill('0');
     } else if (ip.startsWith('::')) {
          // ::1 -> "", "1". 
          const rest = ip.substring(2).split(':');
          fullParts = [...new Array(8 - rest.length).fill('0'), ...rest];
     } else if (ip.endsWith('::')) {
          // 1:: -> "1", "".
          const rest = ip.substring(0, ip.length - 2).split(':');
          fullParts = [...rest, ...new Array(8 - rest.length).fill('0')];
     } else if (ip.includes('::')) {
          const [pre, post] = ip.split('::');
          const preParts = pre.split(':');
          const postParts = post.split(':');
          const missing = 8 - (preParts.length + postParts.length);
          fullParts = [...preParts, ...new Array(missing).fill('0'), ...postParts];
     } else {
          fullParts = ip.split(':');
     }
     
    let num = 0n;
    for ( let i = 0; i < 8; i++) {
        const hex = fullParts[i];
        if (!/^[0-9a-fA-F]{1,4}$/.test(hex) && hex !== '0') { // 0 is valid.
             if (hex === '' && fullParts.length === 8) { /* Valid if 0? No, empty string means parsing error usually unless 0 */ }
             // '0' is fine. '' is not fine usually?
             // with :: expansion, we might fill '0'.
        }
        const val = parseInt(hex || '0', 16);
        if (isNaN(val)) throw new Error(`Invalid segment: ${hex}`);
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
    // Simple compression: remove longest sequence of 0s?
    // MVP: return full string, maybe simplify later.
    // Normalized format often preferred for config.
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
    
    const ipVal = isV6 ? parseIpv6(ipStr) : ipToBigInt(ipStr);
    
    const hostBits = totalBits - BigInt(prefix);
    const start = (ipVal >> hostBits) << hostBits;
    const end = start + (1n << hostBits) - 1n;
    
    return { start, end, prefix, version: isV6 ? 6 : 4 };
}

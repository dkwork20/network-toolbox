/**
 * Converts a standard IPv4 string to a BigInt.
 * @param ip IPv4 string (e.g., "192.168.0.1")
 * @returns BigInt representation
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
 * @param num BigInt representation
 * @returns IPv4 string
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
 * Validates if the input string is a valid CIDR
 * @param cidr CIDR string (e.g., "192.168.0.0/24")
 */
export function isValidCidr(cidr: string): boolean {
    try {
        const [ip, mask] = cidr.split('/');
        if (!ip || !mask) return false;
        
        // Validate IP
        ipToBigInt(ip);
        
        // Validate mask
        const maskNum = parseInt(mask, 10);
        if (isNaN(maskNum) || maskNum < 0 || maskNum > 32) return false;
        
        return true;
    } catch {
        return false;
    }
}

/**
 * Parses a CIDR string into start and end BigInt addresses.
 * returns { start, end, prefix }
 */
export function parseCidr(cidr: string) {
    if (!isValidCidr(cidr)) throw new Error(`Invalid CIDR: ${cidr}`);
    
    const [ipStr, maskStr] = cidr.split('/');
    const prefix = parseInt(maskStr, 10);
    const ipVal = ipToBigInt(ipStr);
    
    // Valid mask: Set all host bits to 0 for start, 1 for end
    // However, user input might depend on how strict we are.
    // Standard WireGuard usage usually implies the network address.
    // We should normalize it: start includes the host bits implicitly? 
    // No, standard CIDR starts at the network address.
    // E.g. 192.168.0.1/24 -> 192.168.0.0 - 192.168.0.255
    
    // Mask logic
    const hostBits = 32n - BigInt(prefix);
    const mask = (1n << BigInt(prefix)) - 1n; // This logic for mask is tricky with shift.
    // Better: 
    // network = ip & (allOnes << hostBits)
    // broadcast = network | (allOnes >> networkBits... no) 
    // broadcast = network + (2^hostBits - 1)
    
    const totalBits = 32n;
    const networkMask = ((1n << totalBits) - 1n) << hostBits & 0xffffffffn; // Ensure 32-bit wrap? BigInt doesn't wrap.
    
    // Actually: 
    // (1 << 32) - (1 << hostBits) is the mask?
    // Let's use simpler logic: 
    // start = ip & (0xFFFFFFFF << (32 - prefix))
    // But we need to handle full 32-bit correctly.
    
    const start = (ipVal >> hostBits) << hostBits;
    const end = start + (1n << hostBits) - 1n;
    
    return { start, end, prefix };
}

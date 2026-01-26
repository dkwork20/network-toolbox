import { bigIntToIp, isIpv6 } from './ip';

/**
 * Generates a Windows Batch script (.bat) to add persistent routes.
 */
export function generateWindowsScript(cidrs: string[], gateway: string): string {
    const lines = ['@echo off', 'echo Adding static routes...'];
    
    // Check for Admin privileges? (Optional, out of scope for MVP script)
    // lines.push('REM Run as Administrator');
    
    const validGw = gateway || '<GATEWAY_IP>';
    
    for (const cidr of cidrs) {
        if (!cidr.includes('/')) continue;
        const isV6 = isIpv6(cidr.split('/')[0]);
        
        if (isV6) {
             lines.push(`route add ${cidr} ${validGw}`);
        } else {
            try {
                const [ip, maskStr] = cidr.split('/');
                const prefix = parseInt(maskStr, 10);
                const maskLong = (0xffffffffn << (32n - BigInt(prefix))) & 0xffffffffn;
                const netmask = bigIntToIp(maskLong);
                lines.push(`route add ${ip} mask ${netmask} ${validGw} -p`);
            } catch {
                lines.push(`REM Invalid CIDR: ${cidr}`);
            }
        }
    }
    
    lines.push('echo Done.');
    lines.push('pause');
    return lines.join('\r\n');
}

/**
 * Generates a Linux shell script (.sh) to add routes.
 */
export function generateLinuxScript(cidrs: string[], gateway: string, iface?: string): string {
    const lines = ['#!/bin/bash', '# Auto-generated routing script', ''];
    
    const validGw = gateway || '<GATEWAY_IP>';
    const dev = iface ? ` dev ${iface}` : '';
    
    for (const cidr of cidrs) {
         if (!cidr.includes('/')) continue;
         const isV6 = isIpv6(cidr.split('/')[0]);
         const cmd = isV6 ? 'ip -6 route add' : 'ip route add';
         lines.push(`sudo ${cmd} ${cidr} via ${validGw}${dev}`);
    }
    
    return lines.join('\n');
}

/**
 * Generates a macOS shell script (.sh) to add routes.
 */
export function generateMacScript(cidrs: string[], gateway: string): string {
    const lines = ['#!/bin/bash', '# Auto-generated routing script', ''];
    
    const validGw = gateway || '<GATEWAY_IP>';
    
    for (const cidr of cidrs) {
        if (!cidr.includes('/')) continue;
        const isV6 = isIpv6(cidr.split('/')[0]);
        if (isV6) {
             lines.push(`sudo route -n add -inet6 ${cidr} ${validGw}`);
        } else {
             lines.push(`sudo route -n add -net ${cidr} ${validGw}`);
        }
    }
    
    return lines.join('\n');
}

/**
 * Helper to trigger download
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

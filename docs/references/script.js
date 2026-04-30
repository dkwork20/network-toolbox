// Robust BigInt-based implementation — fixes infinite loop and supports multiple CIDRs.

// ---- Helpers: BigInt IP conversions ----
function ipToBigInt(ip) {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) throw new Error('Invalid IPv4');
  let res = 0n;
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) throw new Error('Invalid IPv4 octet');
    res = (res << 8n) + BigInt(n);
  }
  return res;
}

function bigIntToIp(nBig) {
  // nBig is BigInt 0..0xFFFFFFFF
  const n = Number(nBig); // safe for 32-bit
  return [
    (n >>> 24) & 0xFF,
    (n >>> 16) & 0xFF,
    (n >>> 8) & 0xFF,
    n & 0xFF
  ].join('.');
}

// Parse CIDR like "192.168.0.0/24" to [startBig, endBig]
function cidrToRangeBig(cidr) {
  const parts = cidr.split('/');
  if (parts.length !== 2) throw new Error('Invalid CIDR: ' + cidr);
  const ip = parts[0].trim();
  const mask = Number(parts[1].trim());
  if (!Number.isInteger(mask) || mask < 0 || mask > 32) throw new Error('Invalid mask: ' + cidr);
  const base = ipToBigInt(ip);
  const size = (1n << BigInt(32 - mask));
  const start = base & (~(size - 1n)); // align base to network
  const end = start + size - 1n;
  return [start, end];
}

// Merge and normalize exclude ranges: input array of [s,e] BigInt, sorted or unsorted
function mergeRanges(ranges) {
  if (!ranges.length) return [];
  const arr = ranges.slice().sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const out = [];
  let [cs, ce] = arr[0];
  for (let i = 1; i < arr.length; i++) {
    const [s, e] = arr[i];
    if (s <= ce + 1n) {
      // overlap or contiguous -> merge
      if (e > ce) ce = e;
    } else {
      out.push([cs, ce]);
      cs = s; ce = e;
    }
  }
  out.push([cs, ce]);
  return out;
}

// Subtract merged exclude ranges from base range [0..2^32-1]
function subtractRanges(base, excludes) {
  // base: [bS, bE]
  let ranges = [base];
  for (const ex of excludes) {
    const next = [];
    for (const r of ranges) {
      const [rs, re] = r;
      const [es, ee] = ex;
      if (ee < rs || es > re) {
        // no overlap
        next.push([rs, re]);
      } else {
        if (es > rs) next.push([rs, es - 1n]);
        if (ee < re) next.push([ee + 1n, re]);
      }
    }
    ranges = next;
    if (ranges.length === 0) break;
  }
  return ranges;
}

// compute exponent e such that (1n << e) === power (power is exact 2^k)
function bigIntLog2(power) {
  let e = 0;
  let cur = 1n;
  while (cur < power) { cur <<= 1n; e++; if (e > 64) break; }
  return e;
}

// Convert [start,end] BigInt range to minimal CIDRs
function rangeToCidrsBig(start, end) {
  const out = [];
  let cur = start;
  while (cur <= end) {
    // lowestOneBit: largest power of two dividing cur
    let lowest;
    if (cur === 0n) {
      // smallest power-of-two block starting at zero is 2^31 initially; use highest single-bit <= remaining later
      lowest = 1n << 31n;
    } else {
      lowest = cur & (-cur);
    }

    let remaining = end - cur + 1n;

    // make sure block fits in remaining
    while (lowest > remaining) {
      lowest >>= 1n;
    }

    // compute mask = 32 - log2(lowest)
    const e = bigIntLog2(lowest);
    const mask = 32 - e;
    out.push(`${bigIntToIp(cur)}/${mask}`);
    cur = cur + lowest;
  }
  return out;
}

// Main calculate invoked by button
function calculateAllowed() {
  const area = document.getElementById('excludeInput').value;
  const output = document.getElementById('output');
  output.value = 'Calculating...';

  try {
    const lines = area.split('\n').map(l => l.trim()).filter(Boolean);
    const excludeRanges = lines.map(cidrToRangeBig);

    // merge overlaps
    const merged = mergeRanges(excludeRanges);

    // base full range
    const full = [0n, (1n << 32n) - 1n];

    // subtract
    const remaining = subtractRanges(full, merged);

    // convert each to minimal CIDRs
    const cidrs = [];
    for (const [s,e] of remaining) {
      cidrs.push(...rangeToCidrsBig(s,e));
    }

    output.value = cidrs.join(',\n');
  } catch (err) {
    output.value = 'Error: ' + (err && err.message ? err.message : String(err));
  }
}

// wire up buttons
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('calcBtn').addEventListener('click', calculateAllowed);
  document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('excludeInput').value = '';
    document.getElementById('output').value = '';
  });
});

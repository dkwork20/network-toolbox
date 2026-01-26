import { calculateAllowedIPs } from '../utils/cidr';

self.onmessage = (e: MessageEvent) => {
    const { excludes, fullRange } = e.data;
    try {
        const allowed = calculateAllowedIPs(excludes, fullRange);
        self.postMessage({ result: allowed });
    } catch (error) {
        self.postMessage({ error: (error as Error).message });
    }
};

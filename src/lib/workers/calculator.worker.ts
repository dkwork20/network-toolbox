import { calculateAllowedIPs } from '../utils/cidr';

self.onmessage = (e: MessageEvent) => {
    // fullRanges can be passed, or default to both
    const { excludes, fullRanges } = e.data;
    try {
        const ranges = fullRanges || ['0.0.0.0/0', '::/0'];
        const allowed = calculateAllowedIPs(excludes, ranges);
        self.postMessage({ result: allowed });
    } catch (error) {
        self.postMessage({ error: (error as Error).message });
    }
};

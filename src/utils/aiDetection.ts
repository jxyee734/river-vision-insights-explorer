export const detectAnomalies = (data: any[]): {isAnomaly: boolean; parameter?: string; message?: string; severity?: string} | null => {
  // Placeholder implementation for anomaly detection
  // You can replace this with actual logic
  if (data.length === 0) return null;

  // Example logic: Check if any value exceeds a threshold
  const threshold = 100;
  for (const item of data) {
    if (item.value > threshold) {
      return {
        isAnomaly: true,
        parameter: item.parameter,
        message: `Value exceeds threshold of ${threshold}`,
        severity: 'high',
      };
    }
  }

  return { isAnomaly: false };
};
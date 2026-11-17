/**
 * Formats a timestamp into a 2-digit hour:minute string with graceful fallback.
 */
export function formatClockTime(timestamp?: number): string {
  if (!timestamp) return '--:--';
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

/**
 * Formats a number into a standard USD currency string ($XX.XX).
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

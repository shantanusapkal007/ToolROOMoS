/**
 * Formats a number to standard INR or USD currency string depending on locale preferences.
 * Defaults to INR as per the base requirement.
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '&#8377;0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats an ISO Date string into a human readable standard format.
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

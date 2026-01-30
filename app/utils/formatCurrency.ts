/**
 * Format a number as Guatemalan Quetzales (GTQ).
 * Example: 35.00 -> "Q35.00"
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ',
        minimumFractionDigits: 2
    }).format(amount);
};

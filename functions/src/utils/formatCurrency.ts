// ============================================================
// CURRENCY FORMATTING UTILITY
// Formats numbers as South African Rand (ZAR)
// ============================================================

/**
 * Formats a number as South African Rand currency.
 * Output format: "R XX,XXX.XX"
 *
 * @param amount - The numeric amount to format
 * @returns Formatted currency string (e.g., "R 12,345.67")
 *
 * @example
 * ```typescript
 * formatZAR(12345.67);  // "R 12,345.67"
 * formatZAR(0);         // "R 0.00"
 * formatZAR(-500);      // "-R 500.00"
 * formatZAR(1000000);   // "R 1,000,000.00"
 * ```
 */
export function formatZAR(amount: number): string {
    // Handle edge cases
    if (amount === null || amount === undefined || isNaN(amount)) {
        return 'R 0.00';
    }

    // Handle negative numbers
    const isNegative = amount < 0;
    const absoluteAmount = Math.abs(amount);

    // Format using Intl.NumberFormat for proper locale handling
    const formatter = new Intl.NumberFormat('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const formattedNumber = formatter.format(absoluteAmount);

    // Construct the final string with R prefix
    if (isNegative) {
        return `-R ${formattedNumber}`;
    }

    return `R ${formattedNumber}`;
}

/**
 * Formats a number as South African Rand currency without the currency symbol.
 * Output format: "XX,XXX.XX"
 *
 * @param amount - The numeric amount to format
 * @returns Formatted number string without currency symbol
 *
 * @example
 * ```typescript
 * formatZARAmount(12345.67);  // "12,345.67"
 * ```
 */
export function formatZARAmount(amount: number): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0.00';
    }

    const formatter = new Intl.NumberFormat('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return formatter.format(Math.abs(amount));
}

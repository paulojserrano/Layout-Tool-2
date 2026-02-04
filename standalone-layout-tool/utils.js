// --- Number Formatting Helpers ---
export function formatNumber(numStr) {
    if (numStr === '' || numStr === null || typeof numStr === 'undefined') return '';
    // Remove non-numeric characters except decimal point
    let num = parseFloat(numStr.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '';
    // Format with commas, no decimals
    return Math.round(num).toLocaleString('en-US');
}

// NEW function for decimals
export function formatDecimalNumber(numStr, places = 2) {
    if (numStr === '' || numStr === null || typeof numStr === 'undefined') return '';
    // Remove non-numeric characters except decimal point
    let num = parseFloat(numStr.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '';

    // Use toLocaleString to format with decimals
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 0, // Don't show .00 for 1
        maximumFractionDigits: places // Show up to 2 decimal places
    });
}

export function parseNumber(str) {
    if (str === '' || str === null) return 0;
    // Remove commas
    let num = parseFloat(str.toString().replace(/,/g, ''));
    if (isNaN(num)) return 0;
    return num;
}

// Helper function for 50mm pitch rounding
export function roundUpTo50(value) {
    return Math.ceil(value / 50) * 50;
}

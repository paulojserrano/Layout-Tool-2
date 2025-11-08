// --- Number Formatting Helpers ---
export function formatNumber(numStr) {
    if (numStr === '' || numStr === null) return '';
    // Remove non-numeric characters except decimal point
    let num = parseFloat(numStr.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '';
    // Format with commas, no decimals
    return Math.round(num).toLocaleString('en-US');
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

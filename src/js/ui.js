import {
    layoutModeSelect, flueSpaceContainer, mainViewTabs, viewSubTabs,
    warehouseCanvas, rackDetailCanvas, elevationCanvas,
    summaryTotalLocations, toteQtyPerBayInput, totesDeepSelect,
    // --- NEW IMPORTS ---
    solverConfigSelect, systemLengthInput, systemWidthInput, clearHeightInput
} from './dom.js';
import { drawWarehouse, drawRackDetail, drawElevationView } from './drawing.js';
// --- NEW IMPORTS ---
import { parseNumber, formatNumber } from './utils.js';
import { configurations } from './config.js';

export let calculationResults = {
    totalBays: 0,
    maxLevels: 0,
    // --- NEW ---
    toteQtyPerBay: 1,
    totesDeep: 1
};

let rafId = null; // Single RAF ID for debouncing all draw calls

// ... (toggleFlueSpace - no changes) ...
function toggleFlueSpace() {
    if (layoutModeSelect.value === 's-d-s') {
        flueSpaceContainer.style.display = 'block';
    } else {
        flueSpaceContainer.style.display = 'none';
    }
}
// --- MODIFIED: Function to calculate combined results ---
function updateCombinedResults() {
    // Read values from the global results object
    const { totalBays, maxLevels, toteQtyPerBay, totesDeep } = calculationResults;

    if (totalBays === 0 || maxLevels === 0) {
        summaryTotalLocations.textContent = '0';
        return;
    }

    const totalLocations = totalBays * maxLevels * toteQtyPerBay * totesDeep;
    summaryTotalLocations.textContent = totalLocations.toLocaleString('en-US');
}


// --- MODIFIED: Debounced Draw Function ---
export function requestRedraw() {
    if (rafId) {
        cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
        // --- Get selected config ---
        const configKey = solverConfigSelect.value;
        const config = configurations[configKey] || null;

        if (!config) {
            console.error("Redraw requested but no config is selected.");
            return;
        }

        // --- Get global inputs ---
        const sysLength = parseNumber(systemLengthInput.value);
        const sysWidth = parseNumber(systemWidthInput.value);
        const sysHeight = parseNumber(clearHeightInput.value);

        // --- Pass config to all draw functions ---
        // These functions will now update the global `calculationResults`
        drawWarehouse(sysLength, sysWidth, sysHeight, config);
        drawRackDetail(sysLength, sysWidth, sysHeight, config);
        drawElevationView(sysLength, sysWidth, sysHeight, config);

        // This function now reads from `calculationResults`
        updateCombinedResults();

        rafId = null;
    });
}

export function initializeUI(redrawInputs, numberInputs) {
    // Redraw on input change
    redrawInputs.forEach(input => {
        input.addEventListener('input', requestRedraw);
    });

    // Handle layout mode change
    layoutModeSelect.addEventListener('change', () => {
        toggleFlueSpace();
        requestRedraw();
    });

    // Apply number formatting on 'blur'
    numberInputs.forEach(input => {
        // Don't format <select> elements
        if (input.tagName.toLowerCase() === 'select') return;

        input.value = formatNumber(input.value); // Format initial
        input.addEventListener('blur', () => {
            input.value = formatNumber(input.value);
        });
    });

    // Redraw on window resize
    const resizeObserver = new ResizeObserver(requestRedraw);
    // Observe all canvas parent containers
    resizeObserver.observe(warehouseCanvas.parentElement);
    resizeObserver.observe(rackDetailCanvas.parentElement);
    resizeObserver.observe(elevationCanvas.parentElement);

    // ... (mainViewTabs logic - no changes) ...
    mainViewTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('main-tab-button')) {
            // Deactivate all main tabs
            mainViewTabs.querySelectorAll('.main-tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.main-tab-content').forEach(content => content.classList.remove('active'));

            // Activate clicked
            e.target.classList.add('active');
            const tabId = e.target.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Request a redraw to ensure the newly visible canvas is drawn
            // (important if switching *back* to Solver tab)
            requestRedraw();
        }
    });
    // ... (viewSubTabs logic - no changes) ...
    viewSubTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('sub-tab-button')) {
            // Deactivate all sub-tabs
            viewSubTabs.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.sub-tab-content').forEach(content => content.classList.remove('active'));

            // Activate clicked
            e.target.classList.add('active');
            const tabId = e.target.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Request a redraw to ensure the newly visible canvas is drawn
            requestRedraw();
        }
    });
    // --- Initial Setup ---
    toggleFlueSpace();
    // Initial draw is handled by the ResizeObservers
}

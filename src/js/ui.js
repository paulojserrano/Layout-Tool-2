import {
    layoutModeSelect, flueSpaceContainer, mainViewTabs, viewSubTabs,
    warehouseCanvas, rackDetailCanvas, elevationCanvas,
    summaryTotalLocations, toteQtyPerBayInput, totesDeepSelect
} from './dom.js';
import { drawWarehouse, drawRackDetail, drawElevationView } from './drawing.js';
import { parseNumber, formatNumber } from './utils.js'; // Added formatNumber

export let calculationResults = {
    totalBays: 0,
    maxLevels: 0
};

let rafId = null; // Single RAF ID for debouncing all draw calls

// --- Helper Function to Toggle Flue Space Input ---
function toggleFlueSpace() {
    if (layoutModeSelect.value === 's-d-s') {
        flueSpaceContainer.style.display = 'block';
    } else {
        flueSpaceContainer.style.display = 'none';
    }
}

// --- NEW: Function to calculate combined results ---
function updateCombinedResults() {
    const { totalBays, maxLevels } = calculationResults;

    if (totalBays === 0 || maxLevels === 0) {
        summaryTotalLocations.textContent = '0';
        return;
    }

    const totesPerBay_horiz = parseNumber(toteQtyPerBayInput.value) || 1;
    const totesDeep = parseNumber(totesDeepSelect.value) || 1;

    const totalLocations = totalBays * maxLevels * totesPerBay_horiz * totesDeep;

    summaryTotalLocations.textContent = totalLocations.toLocaleString('en-US');
}


// --- Debounced Draw Function ---
export function requestRedraw() {
    if (rafId) {
        cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
        drawWarehouse();        // This updates calculationResults.totalBays
        drawRackDetail();       // This one just draws
        drawElevationView();    // This updates calculationResults.maxLevels & draws both elevations
        updateCombinedResults(); // This uses both results to calc locations
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
    resizeObserver.observe(elevationCanvas.parentElement); // Add new canvas

    // --- NEW: Main Tab switching logic (now just Solver/Config) ---
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

    // --- Renamed: Sub-Tab switching logic (within Solver's Viz) ---
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

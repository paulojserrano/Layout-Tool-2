import {
    layoutModeSelect, flueSpaceContainer, mainViewTabs, viewSubTabs,
    warehouseCanvas, rackDetailCanvas, elevationCanvas,
    // REQ 3: summaryTotalLocations removed
    toteQtyPerBayInput, totesDeepSelect,
    // --- NEW IMPORTS ---
    solverConfigSelect, systemLengthInput, systemWidthInput, clearHeightInput
} from './dom.js';
import { drawWarehouse, drawRackDetail, drawElevationView } from './drawing.js';
// --- NEW IMPORTS ---
import { parseNumber, formatNumber } from './utils.js';
import { configurations } from './config.js';
import { getViewState } from './viewState.js'; // <-- ADDED IMPORT

// REQ 3: calculationResults object removed
let rafId = null; // Single RAF ID for debouncing all draw calls

// ... (toggleFlueSpace - no changes) ...
function toggleFlueSpace() {
    if (layoutModeSelect.value === 's-d-s') {
        flueSpaceContainer.style.display = 'block';
    } else {
        flueSpaceContainer.style.display = 'none';
    }
}
// REQ 3: updateCombinedResults function removed


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
        // REQ 3: These functions no longer update a global results object
        drawWarehouse(sysLength, sysWidth, sysHeight, config);
        drawRackDetail(sysLength, sysWidth, sysHeight, config);
        drawElevationView(sysLength, sysWidth, sysHeight, config);

        // REQ 3: This function call was removed
        // updateCombinedResults();

        rafId = null;
    });
}

// --- NEW: Zoom & Pan Logic (Moved from drawing.js) ---
// --- REMOVED: viewStates and getViewState (now in viewState.js) ---

function applyZoomPan(canvas, drawFunction) {
    const state = getViewState(canvas); // <-- THIS WILL NOW WORK

    const wheelHandler = (event) => {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const worldX_before = (mouseX - state.offsetX) / state.scale;
        const worldY_before = (mouseY - state.offsetY) / state.scale;

        const zoomFactor = 1.1;
        const newScale = event.deltaY < 0 ? state.scale * zoomFactor : state.scale / zoomFactor;
        state.scale = Math.max(0.1, Math.min(newScale, 50)); // Clamp scale

        state.offsetX = mouseX - worldX_before * state.scale;
        state.offsetY = mouseY - worldY_before * state.scale;

        drawFunction();
    };

    const mouseDownHandler = (event) => {
        state.isPanning = true;
        state.lastPanX = event.clientX;
        state.lastPanY = event.clientY;
        canvas.style.cursor = 'grabbing';
    };

    const mouseMoveHandler = (event) => {
        if (!state.isPanning) return;
        const dx = event.clientX - state.lastPanX;
        const dy = event.clientY - state.lastPanY;
        state.offsetX += dx;
        state.offsetY += dy;
        state.lastPanX = event.clientX;
        state.lastPanY = event.clientY;
        drawFunction();
    };

    const mouseUpHandler = () => {
        state.isPanning = false;
        canvas.style.cursor = 'grab';
    };
    
    const mouseLeaveHandler = () => {
        state.isPanning = false;
        canvas.style.cursor = 'default';
    };


    // Add event listeners
    canvas.addEventListener('wheel', wheelHandler);
    canvas.addEventListener('mousedown', mouseDownHandler);
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mouseup', mouseUpHandler);
    canvas.addEventListener('mouseleave', mouseLeaveHandler);

}
// --- END: Zoom & Pan Logic ---


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

    // --- ADDED: Apply Zoom/Pan controls ---
    applyZoomPan(warehouseCanvas, requestRedraw);
    applyZoomPan(rackDetailCanvas, requestRedraw);
    applyZoomPan(elevationCanvas, requestRedraw);

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

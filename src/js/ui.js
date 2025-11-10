import {
    mainViewTabs,
    warehouseCanvas, rackDetailCanvas, elevationCanvas,
    
    // --- NEW IMPORTS ---
    solverConfigSelect, systemLengthInput, systemWidthInput, clearHeightInput,
    comparisonTabButton // Import new tab button
} from './dom.js';
import { drawWarehouse, drawRackDetail, drawElevationView } from './drawing.js';
import { parseNumber, formatNumber, formatDecimalNumber } from './utils.js'; // MODIFIED
import { configurations } from './config.js';
import { getViewState } from './viewState.js';

let rafId = null; // Single RAF ID for debouncing all draw calls

// --- Debounced Draw Function ---
export function requestRedraw() {
    if (rafId) {
        cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
        // --- Get selected config ---
        const configKey = solverConfigSelect.value;
        const config = configurations[configKey] || null;

        if (!config) {
            // This can happen on initial load before config is populated
            // console.warn("Redraw requested but no config is selected.");
            return;
        }

        // --- Get global inputs ---
        const sysLength = parseNumber(systemLengthInput.value);
        const sysWidth = parseNumber(systemWidthInput.value);
        const sysHeight = parseNumber(clearHeightInput.value);

        // --- Pass config to all draw functions ---
        drawWarehouse(sysLength, sysWidth, sysHeight, config);
        drawRackDetail(sysLength, sysWidth, sysHeight, config);
        drawElevationView(sysLength, sysWidth, sysHeight, config);

        rafId = null;
    });
}

// --- Zoom & Pan Logic ---
function applyZoomPan(canvas, drawFunction) {
    const state = getViewState(canvas);

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


export function initializeUI(redrawInputs, numberInputs, decimalInputs = []) { // MODIFIED
    // Redraw on input change
    redrawInputs.forEach(input => {
        input.addEventListener('input', requestRedraw);
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

    // NEW: Apply decimal formatting on 'blur'
    decimalInputs.forEach(input => {
        // Don't format <select> elements
        if (input.tagName.toLowerCase() === 'select') return;

        input.value = formatDecimalNumber(input.value, 2); // Format initial
        input.addEventListener('blur', () => {
            input.value = formatDecimalNumber(input.value, 2);
        });
    });

    // Redraw on window resize
    const resizeObserver = new ResizeObserver(requestRedraw);
    resizeObserver.observe(warehouseCanvas.parentElement);
    resizeObserver.observe(rackDetailCanvas.parentElement);
    resizeObserver.observe(elevationCanvas.parentElement);

    // --- ADDED: Apply Zoom/Pan controls ---
    applyZoomPan(warehouseCanvas, requestRedraw);
    applyZoomPan(rackDetailCanvas, requestRedraw);
    applyZoomPan(elevationCanvas, requestRedraw);

    // --- Main Tab Navigation ---
    mainViewTabs.addEventListener('click', (e) => {
        // MODIFIED: Check for disabled
        if (e.target.classList.contains('main-tab-button') && !e.target.disabled) {
            // Deactivate all main tabs
            mainViewTabs.querySelectorAll('.main-tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.main-tab-content').forEach(content => content.classList.remove('active'));

            // Activate clicked
            e.target.classList.add('active');
            const tabId = e.target.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Request a redraw to ensure the newly visible canvas is drawn
            requestRedraw();
        }
    });

    // Initial draw is handled by the ResizeObservers
}
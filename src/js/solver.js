import {
    // Solver Tab
    solverStorageReqInput, solverThroughputReqInput,
    solverAspectRatioInput, solverMaxPerfDensityInput, runSolverButton,
    solverStatus, solverResultLength, solverResultWidth,
    solverResultFootprint, solverResultLocations, solverResultPerfDensity,
    applySolverButton, solverModal, solverModalMessage,
    solverModalContinue, solverModalStop, solverModalBackdrop,
    systemLengthInput, systemWidthInput, mainViewTabs,
    solverConfigSelect,

    // Config Tab Inputs (for loading values)
    toteWidthInput, toteLengthInput, toteHeightInput,
    toteQtyPerBayInput, totesDeepSelect,
    toteToToteDistInput, toteToUprightDistInput, toteBackToBackDistInput,
    uprightLengthInput, uprightWidthInput, hookAllowanceInput,
    aisleWidthInput, setbackTopInput, setbackBottomInput,
    layoutModeSelect, flueSpaceInput,
    baseBeamHeightInput, beamWidthInput, minClearanceInput,
    overheadClearanceInput, sprinklerThresholdInput, sprinklerClearanceInput
} from './dom.js';
import { parseNumber, formatNumber } from './utils.js';
import { getMetrics } from './calculations.js';
import { requestRedraw } from './ui.js';
import { configurations } from './config.js'; // Removed defaultConfig

let solverTempResults = null;
let solverFinalResults = null;

// --- Solver Modal Controls ---
// ... (no changes here) ...

// --- NEW FUNCTION ---
// Loads a selected configuration object into the "Configuration" tab's inputs
function loadConfigToUI(config) {
    if (!config) return;

    // Use formatNumber to make them look nice
    toteWidthInput.value = formatNumber(config['tote-width']);
    toteLengthInput.value = formatNumber(config['tote-length']);
    toteHeightInput.value = formatNumber(config['tote-height']);
    toteQtyPerBayInput.value = formatNumber(config['tote-qty-per-bay']);
    totesDeepSelect.value = config['totes-deep']; // This is a select, not a text input
    toteToToteDistInput.value = formatNumber(config['tote-to-tote-dist']);
    toteToUprightDistInput.value = formatNumber(config['tote-to-upright-dist']);
    toteBackToBackDistInput.value = formatNumber(config['tote-back-to-back-dist']);
    uprightLengthInput.value = formatNumber(config['upright-length']);
    uprightWidthInput.value = formatNumber(config['upright-width']);
    hookAllowanceInput.value = formatNumber(config['hook-allowance']);
    aisleWidthInput.value = formatNumber(config['aisle-width']);
    flueSpaceInput.value = formatNumber(config['flue-space']);
    baseBeamHeightInput.value = formatNumber(config['base-beam-height']);
    beamWidthInput.value = formatNumber(config['beam-width']);
    minClearanceInput.value = formatNumber(config['min-clearance']);
    overheadClearanceInput.value = formatNumber(config['overhead-clearance']);
    sprinklerThresholdInput.value = formatNumber(config['sprinkler-threshold']);
    sprinklerClearanceInput.value = formatNumber(config['sprinkler-clearance']);

    // Note: We don't load setback/layout mode as they seem global
}

// ... (updateSolverResults function - no changes) ...
function showSolverModal(message) {
    solverModalMessage.textContent = message;
    solverModal.style.display = 'flex';
}
function hideSolverModal() {
    solverModal.style.display = 'none';
}

function updateSolverResults(results) {
    solverResultLength.textContent = formatNumber(results.L);
    solverResultWidth.textContent = formatNumber(results.W);
    solverResultFootprint.textContent = results.footprint.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    solverResultLocations.textContent = formatNumber(results.totalLocations);
    solverResultPerfDensity.textContent = (results.density || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    solverFinalResults = results; // Store for the "Apply" button
    
    // Apply the results to the inputs on the Configuration tab
    systemLengthInput.value = formatNumber(solverFinalResults.L);
    systemWidthInput.value = formatNumber(solverFinalResults.W);
    
    requestRedraw();
}
// --- Solver Main Function ---
async function runSolver(continueForPerformance = false) {
    // ... (no changes to runSolverButton, applySolverButton) ...
    runSolverButton.disabled = true;
    applySolverButton.style.display = 'none';
    // Get Solver Inputs
    const storageReq = parseNumber(solverStorageReqInput.value);
    const throughputReq = parseNumber(solverThroughputReqInput.value);
    const aspectRatio = parseNumber(solverAspectRatioInput.value) || 1.0;
    const maxDensity = parseNumber(solverMaxPerfDensityInput.value) || 50;
    
    // Get Selected Configuration
    const selectedConfigName = solverConfigSelect.value; // e.g., "hps3-e2-650-dd"
    // MODIFIED: Fallback to null instead of defaultConfig
    const selectedConfig = configurations[selectedConfigName] || null;

    if (storageReq === 0 || throughputReq === 0 || aspectRatio === 0) {
        solverStatus.textContent = "Error: Please check solver inputs.";
        runSolverButton.disabled = false;
        return;
    }

    // --- NEW: Check if config is valid ---
    if (!selectedConfig) {
        solverStatus.textContent = "Error: No valid configuration selected.";
        runSolverButton.disabled = false;
        return;
    }

    // ... (no changes to currentL, step, safetyBreak, etc.) ...
    let currentL = continueForPerformance ? solverTempResults.L : 10000; // Start at 10m
    const step = 1000; // 1m steps
    let safetyBreak = continueForPerformance ? 200 : 100; // 200m or 100m
    let storageMetResults = continueForPerformance ? solverTempResults : null;
    // ... (no changes to solverLoop) ...
    if (continueForPerformance) {
        solverStatus.textContent = "Solving for performance...";
    } else {
        solverStatus.textContent = "Solving for storage...";
    }
    // Inside solverLoop, the line:
    // metrics = getMetrics(currentL, currentW, selectedConfig);
    // is NOW correct because selectedConfig is the full object.
    function solverLoop() {
        let metrics;
        if (!continueForPerformance) {
            // --- Loop 1: Find Storage ---
            currentL += step;
            let currentW = currentL / aspectRatio;
            // Get metrics using the *current* config params from the other tab
            metrics = getMetrics(currentL, currentW, selectedConfig); 

            if (metrics.totalLocations >= storageReq) {
                // Found storage target
                storageMetResults = { ...metrics, density: throughputReq / metrics.footprint };
                solverTempResults = storageMetResults; // Save for modal

                if (storageMetResults.density > maxDensity) {
                    // Storage met, but density is too high
                    const msg = `Storage target met at ${formatNumber(metrics.totalLocations)} locations. However, performance density is ${storageMetResults.density.toFixed(1)} (target: ${maxDensity}). Continue expanding to meet performance target?`;
                    showSolverModal(msg);
                    // Stop the loop, modal buttons will take over
                    runSolverButton.disabled = false; // Re-enable button
                    return;
                } else {
                    // Storage and performance met in one go!
                    updateSolverResults(storageMetResults);
                    solverStatus.textContent = "Complete.";
                    runSolverButton.disabled = false;
                    return;
                }
            }
        } else {
            // --- Loop 2: Find Performance ---
            currentL += step;
            let currentW = currentL / aspectRatio;
            metrics = getMetrics(currentL, currentW, selectedConfig);
            let density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;

            if (density <= maxDensity) {
                // Performance target met
                updateSolverResults({ ...metrics, density: density });
                solverStatus.textContent = "Complete.";
                runSolverButton.disabled = false;
                return;
            }
        }

        // Check safety break
        if (currentL > (safetyBreak * 1000)) {
            solverStatus.textContent = `Error: No solution found under ${safetyBreak}m.`;
            runSolverButton.disabled = false;
            return;
        }

        // Continue loop
        requestAnimationFrame(solverLoop);
    }
    // ... (no changes to the rest of runSolver) ...
    requestAnimationFrame(solverLoop);
}

export function initializeSolver() {
    runSolverButton.addEventListener('click', () => runSolver(false));

    // --- NEW: Load config to UI on change ---
    solverConfigSelect.addEventListener('change', () => {
        const selectedConfig = configurations[solverConfigSelect.value] || null;
        loadConfigToUI(selectedConfig);
        requestRedraw(); // Redraw visualization with new config
    });

    // --- NEW: Load initial config on startup ---
    const initialConfig = configurations[solverConfigSelect.value] || null;
    loadConfigToUI(initialConfig);

    // ... (no changes to modal listeners) ...
    solverModalStop.addEventListener('click', () => {
        hideSolverModal();
        updateSolverResults(solverTempResults); // Use the stored storage-met results
        solverStatus.textContent = "Complete (Storage target met).";
        runSolverButton.disabled = false;
    });

    solverModalContinue.addEventListener('click', () => {
        hideSolverModal();
        runSolver(true); // Start part 2
    });

    solverModalBackdrop.addEventListener('click', hideSolverModal);
}

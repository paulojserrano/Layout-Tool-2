import {
    solverStorageReqInput, solverThroughputReqInput,
    solverAspectRatioInput, solverMaxPerfDensityInput, runSolverButton,
    solverStatus, solverResultLength, solverResultWidth,
    solverResultFootprint, solverResultLocations, solverResultPerfDensity,
    applySolverButton, solverModal, solverModalMessage,
    solverModalContinue, solverModalStop, solverModalBackdrop,
    systemLengthInput, systemWidthInput, mainViewTabs,
    solverConfigSelect // Import the new select
} from './dom.js';
import { parseNumber, formatNumber } from './utils.js';
import { getMetrics } from './calculations.js';
import { requestRedraw } from './ui.js';

let solverTempResults = null;
let solverFinalResults = null;

// --- Solver Modal Controls ---
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
    applySolverButton.style.display = 'block';
}

// --- Solver Main Function ---
async function runSolver(continueForPerformance = false) {
    runSolverButton.disabled = true;
    applySolverButton.style.display = 'none';

    // Get Solver Inputs
    const storageReq = parseNumber(solverStorageReqInput.value);
    const throughputReq = parseNumber(solverThroughputReqInput.value);
    const aspectRatio = parseNumber(solverAspectRatioInput.value) || 1.0;
    const maxDensity = parseNumber(solverMaxPerfDensityInput.value) || 50;
    
    // Get Selected Configuration (for future use)
    const selectedConfig = solverConfigSelect.value;
    // FOR NOW: The 'getMetrics' function will implicitly use the 'default' config
    // by reading values from the Configuration tab's inputs.
    // LATER: This 'selectedConfig' could be used to fetch different parameter sets.

    if (storageReq === 0 || throughputReq === 0 || aspectRatio === 0) {
        solverStatus.textContent = "Error: Please check solver inputs.";
        runSolverButton.disabled = false;
        return;
    }

    let currentL = continueForPerformance ? solverTempResults.L : 10000; // Start at 10m
    const step = 1000; // 1m steps
    let safetyBreak = continueForPerformance ? 200 : 100; // 200m or 100m
    let storageMetResults = continueForPerformance ? solverTempResults : null;

    if (continueForPerformance) {
        solverStatus.textContent = "Solving for performance...";
    } else {
        solverStatus.textContent = "Solving for storage...";
    }

    // Use requestAnimationFrame to avoid blocking the UI
    function solverLoop() {
        let metrics;
        if (!continueForPerformance) {
            // --- Loop 1: Find Storage ---
            currentL += step;
            let currentW = currentL / aspectRatio;
            // Get metrics using the *current* config params from the other tab
            metrics = getMetrics(currentL, currentW); 

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
            metrics = getMetrics(currentL, currentW);
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

    // Start the first iteration
    requestAnimationFrame(solverLoop);
}

export function initializeSolver() {
    runSolverButton.addEventListener('click', () => runSolver(false));

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

    applySolverButton.addEventListener('click', () => {
        if (solverFinalResults) {
            // Apply the results to the inputs on the Configuration tab
            systemLengthInput.value = formatNumber(solverFinalResults.L);
            systemWidthInput.value = formatNumber(solverFinalResults.W);

            // !! REMOVED: Tab-switching logic. User stays on solver screen.
            // mainViewTabs.querySelector('[data-tab="configTabContent"]').click();

            // Trigger a redraw of the canvases (which are on this tab)
            // with the new values.
            requestRedraw();
        }
    });
}

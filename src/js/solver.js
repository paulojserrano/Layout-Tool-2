import {
    // Solver Tab
    solverStorageReqInput, solverThroughputReqInput,
    solverAspectRatioInput,
    runSolverButton,
    solverStatus, solverResultLength, solverResultWidth,
    solverResultFootprint, solverResultLocations, solverResultPerfDensity,
    applySolverButton, solverModal, solverModalMessage,
    solverModalContinue, solverModalStop, solverModalBackdrop,
    systemLengthInput, systemWidthInput, mainViewTabs,
    solverConfigSelect,
    clearHeightInput,

    // --- NEW: Comparison Tab ---
    comparisonTabButton,
    comparisonResultsContainer,
    runAllOptionsButton,
    runAllStatus,

    // --- NEW: Result Metrics ---
    solverResultGrossVolume,
    solverResultTotalBays,
    solverResultCapacityUtil,
    solverResultRowsAndBays,

} from './dom.js';
import { parseNumber, formatNumber } from './utils.js';
import { getMetrics } from './calculations.js';
import { requestRedraw } from './ui.js';
import { configurations } from './config.js'; // MODIFIED: Import all configs

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


// --- Update Results Panel (Main Tab) ---
function updateSolverResults(results) {
    // --- Basic Metrics ---
    solverResultLength.textContent = formatNumber(results.L);
    solverResultWidth.textContent = formatNumber(results.W);
    solverResultFootprint.textContent = results.footprint.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    solverResultLocations.textContent = formatNumber(results.totalLocations);
    solverResultPerfDensity.textContent = (results.density || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // --- NEW Metrics ---
    const grossVolume = results.toteVolume_m3 * results.totalLocations;
    const capacityUtil = (results.density > 0 && results.maxPerfDensity > 0) ? (results.density / results.maxPerfDensity) * 100 : 0;
    
    solverResultGrossVolume.textContent = grossVolume.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    solverResultTotalBays.textContent = formatNumber(results.totalBays);
    solverResultCapacityUtil.textContent = capacityUtil.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
    solverResultRowsAndBays.textContent = `${formatNumber(results.numRows)} x ${formatNumber(results.baysPerRack)}`;


    // --- Store and Apply ---
    solverFinalResults = results; // Store for the "Apply" button
    
    // Apply the results to the inputs on the Configuration tab
    systemLengthInput.value = formatNumber(solverFinalResults.L);
    systemWidthInput.value = formatNumber(solverFinalResults.W);

    // --- NEW: Enable Comparison Tab ---
    if (comparisonTabButton) {
        comparisonTabButton.disabled = false;
        comparisonTabButton.classList.remove('disabled');
    }
    
    requestRedraw();
}

// --- Solver Main Function (Interactive) ---
async function runSolver(continueForPerformance = false) {
    runSolverButton.disabled = true;
    applySolverButton.style.display = 'none';
    // Get Solver Inputs
    const storageReq = parseNumber(solverStorageReqInput.value);
    const throughputReq = parseNumber(solverThroughputReqInput.value);
    const aspectRatio = parseNumber(solverAspectRatioInput.value) || 1.0;
    const sysHeight = parseNumber(clearHeightInput.value);
    
    // Get Selected Configuration
    const selectedConfigName = solverConfigSelect.value;
    const selectedConfig = configurations[selectedConfigName] || null;

    if (!selectedConfig) {
        solverStatus.textContent = "Error: No valid configuration selected.";
        runSolverButton.disabled = false;
        return;
    }
    
    // --- MODIFIED: Get maxDensity from metrics result ---
    // const maxDensity = selectedConfig['max-perf-density'] || 50;
    // We'll get this from the metrics object now

    if (storageReq === 0 || throughputReq === 0 || aspectRatio === 0 || sysHeight === 0) {
        solverStatus.textContent = "Error: Please check solver inputs.";
        runSolverButton.disabled = false;
        return;
    }

    let currentL = continueForPerformance ? solverTempResults.L : 10000; // Start at 10m
    const step = 1000; // 1m steps
    let safetyBreak = 1000; // 1000m
    let storageMetResults = continueForPerformance ? solverTempResults : null;

    if (continueForPerformance) {
        solverStatus.textContent = "Solving for performance...";
    } else {
        solverStatus.textContent = "Solving for storage...";
    }

    function solverLoop() {
        let metrics;
        if (!continueForPerformance) {
            // --- Loop 1: Find Storage ---
            currentL += step;
            let currentW = currentL / aspectRatio;
            metrics = getMetrics(currentL, currentW, sysHeight, selectedConfig); 

            if (metrics.totalLocations >= storageReq) {
                // Found storage target
                const density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;
                storageMetResults = { ...metrics, density: density };
                solverTempResults = storageMetResults; // Save for modal

                if (storageMetResults.density > metrics.maxPerfDensity) {
                    // Storage met, but density is too high
                    const msg = `Storage target met at ${formatNumber(metrics.totalLocations)} locations. However, performance density is ${storageMetResults.density.toFixed(1)} (target: ${metrics.maxPerfDensity}). Continue expanding to meet performance target?`;
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
            metrics = getMetrics(currentL, currentW, sysHeight, selectedConfig);
            let density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;

            if (density <= metrics.maxPerfDensity) {
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
    
    requestAnimationFrame(solverLoop);
}


// --- NEW: Headless Solver for a Single Config ---
/**
 * Runs a non-blocking, promise-based solver for a single configuration.
 * Does not use requestAnimationFrame or interact with the DOM.
 * Automatically continues to solve for performance if storage target is met but density is too high.
 */
function findSolutionForConfig(storageReq, throughputReq, aspectRatio, sysHeight, config, configKey) {
    return new Promise((resolve) => {
        // --- MODIFIED: maxDensity comes from metrics ---
        // const maxDensity = config['max-perf-density'] || 50;
        let currentL = 10000; // Start at 10m
        const step = 1000; // 1m steps
        let safetyBreak = 1000; // 1000m
        let storageMetResults = null;

        // --- Loop 1: Find Storage ---
        while (currentL <= (safetyBreak * 1000)) {
            currentL += step;
            let currentW = currentL / aspectRatio;
            let metrics = getMetrics(currentL, currentW, sysHeight, config);

            if (metrics.totalLocations >= storageReq) {
                const density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;
                storageMetResults = { ...metrics, density: density };
                break; // Found storage
            }
        }

        // --- Check results of Loop 1 ---
        if (!storageMetResults) {
            resolve(null); // No solution found within safety break
            return;
        }

        if (storageMetResults.density <= storageMetResults.maxPerfDensity) {
            // Storage and performance met in one go!
            resolve({ ...storageMetResults, configKey, configName: config.name });
            return;
        }

        // --- Loop 2: Find Performance (if needed) ---
        // Start from the length where storage was met
        while (currentL <= (safetyBreak * 1000)) {
            currentL += step;
            let currentW = currentL / aspectRatio;
            let metrics = getMetrics(currentL, currentW, sysHeight, config);
            let density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;

            if (density <= metrics.maxPerfDensity) {
                // Performance target met
                resolve({ ...metrics, density: density, configKey, configName: config.name });
                return;
            }
        }

        // If loop 2 finishes without meeting performance
        resolve(null);
    });
}

// --- NEW: HTML Card Generator ---
function createResultCard(result) {
    if (!result) return '';

    const footprint = result.footprint.toLocaleString('en-US', { maximumFractionDigits: 1 });
    const locations = formatNumber(result.totalLocations);
    const density = result.density.toLocaleString('en-US', { maximumFractionDigits: 2 });
    
    // NEW Metrics
    const grossVolume = (result.toteVolume_m3 * result.totalLocations).toLocaleString('en-US', { maximumFractionDigits: 1 });
    const capacityUtil = ((result.density > 0 && result.maxPerfDensity > 0) ? (result.density / result.maxPerfDensity) * 100 : 0).toLocaleString('en-US', { maximumFractionDigits: 1 });
    const totalBays = formatNumber(result.totalBays);
    const rowsAndBays = `${formatNumber(result.numRows)} x ${formatNumber(result.baysPerRack)}`;

    return `
        <div class="comparison-card">
            <h3 class="comparison-card-title">${result.configName}</h3>
            
            <div class="comparison-card-metric">
                <span class="comparison-card-label">Footprint (m²)</span>
                <span class="comparison-card-value">${footprint}</span>
            </div>
            
            <div class="comparison-card-metric">
                <span class="comparison-card-label">Perf. Density</span>
                <span class="comparison-card-value">${density}</span>
            </div>
            
            <div classKA-Block class="comparison-card-metric">
                <span class="comparison-card-label">Cap. Utilization</span>
                <span class="comparison-card-value">${capacityUtil} %</span>
            </div>

            <div class="comparison-card-metric">
                <span class="comparison-card-label">Locations</span>
                <span class="comparison-card-value-small">${locations}</span>
            </div>
            
            <div class="comparison-card-metric">
                <span class="comparison-card-label">Gross Volume (m³)</span>
                <span class="comparison-card-value-small">${grossVolume}</span>
            </div>
            
            <div class="comparison-card-metric">
                <span class="comparison-card-label">Total Bays</span>
                <span class="comparison-card-value-small">${totalBays}</span>
            </div>
            
            <div class="comparison-card-metric">
                <span class="comparison-card-label">Rows x Bays/Row</span>
                <span class="comparison-card-value-small">${rowsAndBays}</span>
            </div>
        </div>
    `;
}

// --- NEW: Main Function for Comparison Tab ---
export async function runAllConfigurationsSolver() {
    runAllOptionsButton.disabled = true;
    runAllStatus.textContent = "Running all configurations...";
    comparisonResultsContainer.innerHTML = ''; // Clear previous results

    // Get Solver Inputs
    const storageReq = parseNumber(solverStorageReqInput.value);
    const throughputReq = parseNumber(solverThroughputReqInput.value);
    const aspectRatio = parseNumber(solverAspectRatioInput.value) || 1.0;
    const sysHeight = parseNumber(clearHeightInput.value);

    if (storageReq === 0 || throughputReq === 0 || aspectRatio === 0 || sysHeight === 0) {
        runAllStatus.textContent = "Error: Please check solver inputs on main tab.";
        runAllOptionsButton.disabled = false;
        return;
    }

    const promises = [];
    for (const configKey in configurations) {
        const config = configurations[configKey];
        promises.push(findSolutionForConfig(
            storageReq,
            throughputReq,
            aspectRatio,
            sysHeight,
            config,
            configKey
        ));
    }

    try {
        const allResults = await Promise.all(promises);
        
        const validResults = allResults.filter(res => res !== null);

        // Sort by footprint, smallest to largest
        validResults.sort((a, b) => a.footprint - b.footprint);

        if (validResults.length === 0) {
            comparisonResultsContainer.innerHTML = '<p class="text-slate-500 col-span-full">No valid solutions found for any configuration.</p>';
        } else {
            comparisonResultsContainer.innerHTML = validResults.map(createResultCard).join('');
        }

        runAllStatus.textContent = `Complete. Found ${validResults.length} valid solutions.`;
        runAllOptionsButton.disabled = false;

    } catch (error) {
        console.error("Error during comparison solve:", error);
        runAllStatus.textContent = "An error occurred. Check console for details.";
        runAllOptionsButton.disabled = false;
    }
}


// --- Main Initialization ---
export function initializeSolver() {
    runSolverButton.addEventListener('click', () => runSolver(false));

    solverConfigSelect.addEventListener('change', () => {
        requestRedraw(); // Redraw visualization with new config
    });

    // Modal listeners
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
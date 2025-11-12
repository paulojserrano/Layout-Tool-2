import {
    // Solver Tab
    solverStorageReqInput, solverThroughputReqInput,
    solverAspectRatioInput,
    runSolverButton,
    solverStatus, solverResultLength, solverResultWidth,
    solverResultFootprint, solverResultLocations, solverResultPerfDensity,
    exportResultsButton, // MODIFIED: Removed applySolverButton
    // MODIFIED: Renamed inputs
    warehouseLengthInput, warehouseWidthInput, mainViewTabs,
    solverConfigSelect,
    clearHeightInput,
    solverExpandPDCheckbox, // NEW
    solverReduceLevelsCheckbox, // NEW
    solverExpandConstraintsCheckbox, // NEW
    // NEW: Warning icons
    solverResultLengthWarning, solverResultWidthWarning,

    // --- NEW: Comparison Tab ---
    comparisonTabButton,
    comparisonResultsContainer,
    // MODIFIED: Removed runAllOptionsButton
    runAllStatus,

    // --- NEW: Result Metrics ---
    solverResultGrossVolume,
    solverResultTotalBays,
    solverResultCapacityUtil,
    solverResultRowsAndBays,

} from './dom.js';
import { parseNumber, formatNumber } from './utils.js';
// MODIFIED: calculateElevationLayout was imported twice, fixed.
import { getMetrics, calculateLayout, calculateElevationLayout } from './calculations.js';
import { requestRedraw } from './ui.js';
import { configurations } from './config.js'; // MODIFIED: Import all configs

let solverTempResults = null;
export let solverFinalResults = null; // MODIFIED: Export this

// --- MODIFIED: Solver Modal Controls REMOVED ---
// function showSolverModal(message) { ... }
// function hideSolverModal() { ... }


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

    // --- NEW: Check for constraint violations ---
    const warehouseL = parseNumber(warehouseLengthInput.value);
    const warehouseW = parseNumber(warehouseWidthInput.value);
    
    const lengthBroken = warehouseL > 0 && results.L > warehouseL;
    const widthBroken = warehouseW > 0 && results.W > warehouseW;

    solverResultLengthWarning.style.display = lengthBroken ? 'inline' : 'none';
    solverResultWidthWarning.style.display = widthBroken ? 'inline' : 'none';

    // --- Store and Apply ---
    solverFinalResults = results; // Store for the "Apply" button
    
    // MODIFIED: Do NOT update the warehouse L/W inputs
    // systemLengthInput.value = formatNumber(solverFinalResults.L);
    // systemWidthInput.value = formatNumber(solverFinalResults.W);

    // MODIFIED: Show buttons
    exportResultsButton.style.display = 'block';

    // --- NEW: Enable Comparison Tab ---
    if (comparisonTabButton) {
        comparisonTabButton.disabled = false;
        comparisonTabButton.classList.remove('disabled');
    }
    
    requestRedraw();
}

// --- Solver Main Function (Interactive) ---
// MODIFIED: continueForPerformance is now set internally
async function runSolver() {
    runSolverButton.disabled = true;
    exportResultsButton.style.display = 'none'; // MODIFIED: Hide export button
    // NEW: Hide warnings
    solverResultLengthWarning.style.display = 'none';
    solverResultWidthWarning.style.display = 'none';
    
    // Get Solver Inputs
    const storageReq = parseNumber(solverStorageReqInput.value);
    const throughputReq = parseNumber(solverThroughputReqInput.value);
    const aspectRatio = parseNumber(solverAspectRatioInput.value) || 1.0;
    const sysHeight = parseNumber(clearHeightInput.value);
    const expandForPerformance = solverExpandPDCheckbox.checked; // NEW
    const reduceLevels = solverReduceLevelsCheckbox.checked; // NEW
    const expandConstraints = solverExpandConstraintsCheckbox.checked; // NEW
    
    // Get Warehouse Constraints
    const warehouseL = parseNumber(warehouseLengthInput.value);
    const warehouseW = parseNumber(warehouseWidthInput.value);

    // Get Selected Configuration
    const selectedConfigName = solverConfigSelect.value;
    const selectedConfig = configurations[selectedConfigName] || null;

    if (!selectedConfig) {
        solverStatus.textContent = "Error: No valid configuration selected.";
        runSolverButton.disabled = false;
        return;
    }
    
    if (storageReq === 0 || throughputReq === 0 || aspectRatio === 0 || sysHeight === 0) {
        solverStatus.textContent = "Error: Please check solver inputs.";
        runSolverButton.disabled = false;
        return;
    }

    let currentL = 10000; // Start at 10m
    const step = 1000; // 1m steps
    let safetyBreak = 1000; // 1000m
    let storageMetResults = null;
    let continueForPerformance = false; // Internal state

    solverStatus.textContent = "Solving for storage...";

    function solverLoop() {
        let metrics;
        let currentW = currentL / aspectRatio;

        if (!continueForPerformance) {
            // --- Loop 1: Find Storage ---
            
            // --- NEW: Check constraints ---
            if (!expandConstraints && (currentL > warehouseL || currentW > warehouseW)) {
                solverStatus.textContent = "Error: No solution found within constraints.";
                runSolverButton.disabled = false;
                return;
            }

            currentL += step; // Increment *after* check, *before* calc
            currentW = currentL / aspectRatio;
            metrics = getMetrics(currentL, currentW, sysHeight, selectedConfig); 

            if (metrics.totalLocations >= storageReq) {
                // Found storage target
                const density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;
                storageMetResults = { ...metrics, density: density };
                // solverTempResults = storageMetResults; // No longer need temp results for modal

                if (storageMetResults.density > metrics.maxPerfDensity) {
                    // Storage met, but density is too high
                    
                    // MODIFIED: Check checkbox instead of showing modal
                    if (expandForPerformance) {
                        // User wants to continue
                        continueForPerformance = true;
                        solverStatus.textContent = "Solving for performance...";
                        // Continue to next animation frame
                    } else {
                        // User does not want to continue, stop here
                        updateSolverResults(storageMetResults);
                        solverStatus.textContent = "Complete (Storage target met).";
                        runSolverButton.disabled = false;
                        return;
                    }

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

            // --- NEW: Check constraints ---
            if (!expandConstraints && (currentL > warehouseL || currentW > warehouseW)) {
                solverStatus.textContent = "Complete (Storage met, perf. needs expansion).";
                updateSolverResults(storageMetResults); // Update with last valid result (storageMet)
                runSolverButton.disabled = false;
                return;
            }

            currentL += step; // Increment *after* check, *before* calc
            currentW = currentL / aspectRatio;
            metrics = getMetrics(currentL, currentW, sysHeight, selectedConfig);
            let density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;

            if (density <= metrics.maxPerfDensity) {
                // Performance target met
                
                // --- NEW: Reduction Logic ---
                let finalMetrics = { ...metrics, density: density };

                if (reduceLevels && finalMetrics.totalLocations > storageReq) {
                    // We met performance, and now we check if we can reduce levels
                    // We need the L/W from this step
                    const perfL = finalMetrics.L;
                    const perfW = finalMetrics.W;
                    const perfDensity = finalMetrics.density;

                    let bestMetrics = finalMetrics; // Start with the max-level solution
                    
                    // Iterate downwards from (maxLevels - 1)
                    for (let levels = finalMetrics.calculatedMaxLevels - 1; levels > 0; levels--) {
                        // Recalculate metrics with this specific level count
                        const reducedMetrics = getMetrics(perfL, perfW, sysHeight, selectedConfig, levels);
                        
                        if (reducedMetrics.totalLocations >= storageReq) {
                            // This level count is still above the storage requirement
                            // Is it better than the last one? Yes, it's closer.
                            bestMetrics = { ...reducedMetrics, density: perfDensity }; // Keep the same L/W, so density is the same
                        } else {
                            // We went one level too low. The previous one (`bestMetrics`) is the answer.
                            break; 
                        }
                    }
                    // After the loop, bestMetrics holds the optimal solution
                    updateSolverResults(bestMetrics);

                } else {
                    // Just update with the original performance-met solution
                    updateSolverResults(finalMetrics);
                }
                
                solverStatus.textContent = "Complete.";
                runSolverButton.disabled = false;
                return;
            }
        }

        // Check safety break
        if (currentL > (safetyBreak * 1000)) {
            if (!continueForPerformance) {
                solverStatus.textContent = `Error: No storage solution found under ${safetyBreak}m.`;
            } else {
                solverStatus.textContent = `Error: No performance solution found under ${safetyBreak}m.`;
                // No solution, but update with the storage-met one
                updateSolverResults(storageMetResults);
            }
            runSolverButton.disabled = false;
            return;
        }

        // Continue loop
        requestAnimationFrame(solverLoop);
    }
    
    requestAnimationFrame(solverLoop);
}


// --- MODIFIED: Renamed function ---
function exportLayout() {
    if (!solverFinalResults) {
        console.error("No solver results to export.");
        return;
    }

    // 1. Get current config
    const selectedConfigName = solverConfigSelect.value;
    const config = configurations[selectedConfigName];
    if (!config) {
        console.error("No configuration selected.");
        return;
    }

    // 2. Get dimensions from stored results
    const sysLength = solverFinalResults.L;
    const sysWidth = solverFinalResults.W;
    const sysHeight = parseNumber(clearHeightInput.value);

    // 3. Re-run calculations to get detailed layout objects
    // (This logic is copied from getMetrics and drawWarehouse)

    // --- Config parameters ---
    const toteWidth = config['tote-width'] || 0;
    const toteLength = config['tote-length'] || 0;
    const toteQtyPerBay = config['tote-qty-per-bay'] || 1;
    const totesDeep = config['totes-deep'] || 1; // This is config totes deep
    const toteToToteDist = config['tote-to-tote-dist'] || 0;
    const toteToUprightDist = config['tote-to-upright-dist'] || 0;
    const toteBackToBackDist = config['tote-back-to-back-dist'] || 0;
    const uprightLength = config['upright-length'] || 0;
    const aisleWidth = config['aisle-width'] || 0;
    const flueSpace = config['rack-flue-space'] || 0;
    const hookAllowance = config['hook-allowance'] || 0;
    const setbackTop = config['top-setback'] || 0;
    const setbackBottom = config['bottom-setback'] || 0;
    const setbackLeft = config['setback-left'] || 0;
    const setbackRight = config['setback-right'] || 0;
    const layoutMode = config['layout-mode'] || 's-d-s';
    const considerTunnels = config['considerTunnels'] || false;
    const considerBackpacks = config['considerBackpacks'] || false;

    // --- Bay Dimensions ---
    const clearOpening = (toteQtyPerBay * toteLength) +
        (2 * toteToUprightDist) +
        (Math.max(0, toteQtyPerBay - 1) * toteToToteDist);

    // MODIFIED: Calculate both depths
    const configBayDepth = (totesDeep * toteWidth) +
        (Math.max(0, totesDeep - 1) * toteBackToBackDist) +
        hookAllowance;
        
    const singleBayDepth = (1 * toteWidth) +
        (Math.max(0, 1 - 1) * toteBackToBackDist) +
        hookAllowance;

    // --- Run Layout Calculation ---
    // MODIFIED: Pass both depths
    const layout = calculateLayout(configBayDepth, singleBayDepth, aisleWidth, sysLength, sysWidth, layoutMode, flueSpace, setbackTop, setbackBottom, setbackLeft, setbackRight, uprightLength, clearOpening, considerTunnels);

    // --- Generate Tunnel/Backpack Sets (from drawWarehouse) ---
    let tunnelPositions = new Set();
    if (considerTunnels) {
        const numTunnelBays = Math.floor(layout.baysPerRack / 9);
        if (numTunnelBays > 0) {
            const spacing = (layout.baysPerRack + 1) / (numTunnelBays + 1);
            for (let k = 1; k <= numTunnelBays; k++) {
                const tunnelIndex = Math.round(k * spacing) - 1;
                tunnelPositions.add(tunnelIndex);
            }
        }
    }
    
    const backpackPositions = new Set();
    if (considerBackpacks) {
        const tunnelIndices = Array.from(tunnelPositions).sort((a, b) => a - b);
        const boundaries = [0, ...tunnelIndices, layout.baysPerRack];
        
        for (let j = 0; j < boundaries.length - 1; j++) {
            let sectionStart = (j === 0) ? 0 : boundaries[j] + 1;
            let sectionEnd = boundaries[j+1];
            let sectionLength = (tunnelPositions.has(sectionEnd)) ? (sectionEnd - sectionStart) : (sectionEnd - sectionStart);
            if (sectionLength < 1) continue;
            const numBackpackBays = Math.floor(sectionLength / 5);
            if (numBackpackBays === 0) continue;
            const backpackSpacing = (sectionLength + 1) / (numBackpackBays + 1);
            for (let k = 1; k <= numBackpackBays; k++) {
                const backpackIndexInSection = Math.round(k * backpackSpacing) - 1;
                const backpackIndexGlobal = sectionStart + backpackIndexInSection;
                if (!tunnelPositions.has(backpackIndexGlobal)) {
                    backpackPositions.add(backpackIndexGlobal);
                }
            }
        }
    }

    // 4. Create output array (temporary)
    const outputBays = [];

    // --- Calculate Centering Offsets (from drawWarehouse) ---
    const usableWidth_world = sysWidth - setbackLeft - setbackRight;
    const layoutOffsetX_world = (usableWidth_world - layout.totalLayoutWidth) / 2;
    const layoutOffsetY_world = (layout.usableLength - layout.totalRackLength_world) / 2;

    const repeatingBayUnitWidth = clearOpening + uprightLength;

    // 5. Iterate through layout and create bay objects
    layout.layoutItems.forEach(item => {
        if (item.type !== 'rack') return;

        for (let i = 0; i < layout.baysPerRack; i++) {
            // Determine bay type
            const isTunnel = tunnelPositions.has(i);
            const isBackpack = !isTunnel && backpackPositions.has(i);
            let bayType = 'Standard';
            if (isTunnel) bayType = 'Tunnel';
            else if (isBackpack) bayType = 'Backpack';

            // Calculate Y coordinate (center of bay opening)
            const bay_y_center = layoutOffsetY_world + uprightLength + (i * repeatingBayUnitWidth) + (clearOpening / 2);
            const final_y = setbackTop + bay_y_center;
            
            // Calculate X coordinate for Rack 1
            // MODIFIED: A single rack's center is based on item.width (which is singleBayDepth or configBayDepth)
            const bay_x_center_rack1 = layoutOffsetX_world + item.x + (item.width / 2);
            const final_x_rack1 = setbackLeft + bay_x_center_rack1;

            outputBays.push({
                x: final_x_rack1, // Store pre-offset X
                y: final_y, // Store pre-offset Y
                type: bayType
            });

            // Calculate X coordinate for Rack 2 if it's a double
            if (item.rackType === 'double') {
                // MODIFIED: A double rack's components are *always* configBayDepth
                const bay_x_center_rack2 = layoutOffsetX_world + item.x + configBayDepth + flueSpace + (configBayDepth / 2);
                const final_x_rack2 = setbackLeft + bay_x_center_rack2;
                
                outputBays.push({
                    x: final_x_rack2, // Store pre-offset X
                    y: final_y, // Store pre-offset Y
                    type: bayType
                });
            }
        }
    });

    // 6. NEW: Group bays by type and format for LISP
    
    // Get LISP properties from config
    const lispProps = config.lispExportProps;
    const dynamicPropName = config.dynamicPropName || "BayType";
    
    // Fallback default properties
    const defaultProps = {
        standard: { blockName: "BAY_STD_DEFAULT", color: 256, rotation: 0, xOffset: 0, yOffset: 0 },
        backpack: { blockName: "BAY_BP_DEFAULT", color: 5, rotation: 0, xOffset: 0, yOffset: 0 },
        tunnel: { blockName: "BAY_TUN_DEFAULT", color: 2, rotation: 90, xOffset: 0, yOffset: 0 }
    };
    
    if (!lispProps) {
        console.error("lispExportProps not found in configuration. Using defaults.");
    }

    const bayGroups = new Map();

    // Group bays by their type and apply offsets
    for (const bay of outputBays) {
        const bayType = bay.type; // "Standard", "Backpack", or "Tunnel"
        
        // Get the correct properties for this bay type
        let props;
        if (bayType === 'Standard') {
            props = (lispProps && lispProps.standard) ? lispProps.standard : defaultProps.standard;
        } else if (bayType === 'Backpack') {
            props = (lispProps && lispProps.backpack) ? lispProps.backpack : defaultProps.backpack;
        } else { // Tunnel
            props = (lispProps && lispProps.tunnel) ? lispProps.tunnel : defaultProps.tunnel;
        }

        // Apply offsets
        const finalX = Math.round(bay.x + (props.xOffset || 0));
        const finalY = Math.round(bay.y + (props.yOffset || 0));
        const coordString = `(${finalX},${finalY},0)`; // Format (x,y,z)

        // Group by type. Store the coordinates and the properties used.
        if (!bayGroups.has(bayType)) {
            bayGroups.set(bayType, { 
                coords: [], 
                props: props // Store the properties for this group
            });
        }
        bayGroups.get(bayType).coords.push(coordString);
    }

    // Build the final text file content
    const lispStrings = [];
    bayGroups.forEach((data, bayType) => {
        
        const props = data.props;
        const coordList = data.coords;

        // Get all properties, with fallbacks
        const blockName = props.blockName || "BAY_UNKNOWN_DEFAULT";
        const blockColor = props.color || 256;
        const blockRotation = props.rotation || 0;

        // {BlockName,Color,Rotation|PropName:Value|Coordinates}
        const propStr = `{${blockName},${blockColor},${blockRotation}`;
        const dynPropStr = `|${dynamicPropName}:${bayType}`;
        const coordStr = `|${coordList.join('')}`; // (x,y,z)(x,y,z)
        
        lispStrings.push(propStr + dynPropStr + coordStr + "}");
    });

    const fileContent = lispStrings.join('\n');

    // 7. Create text file and trigger download
    const blob = new Blob([fileContent], { type: 'text/plain' }); // Changed to text/plain
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bay_layout.txt'; // Changed to .txt
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}


// --- NEW: Headless Solver for a Single Config ---
/**
 * Runs a non-blocking, promise-based solver for a single configuration.
 * Does not use requestAnimationFrame or interact with the DOM.
 * Automatically continues to solve for performance if storage target is met but density is too high.
 */
// MODIFIED: Added expandForPerformance, reduceLevels, warehouseL, warehouseW arguments
function findSolutionForConfig(storageReq, throughputReq, aspectRatio, sysHeight, config, configKey, expandForPerformance, reduceLevels, warehouseL, warehouseW) {
    return new Promise((resolve) => {
        // --- MODIFIED: maxDensity comes from metrics ---
        // const maxDensity = config['max-perf-density'] || 50;
        let currentL = 10000; // Start at 10m
        const step = 1000; // 1m steps
        let safetyBreak = 1000; // 1000m
        let storageMetResults = null;

        // --- Loop 1: Find Storage ---
        while (currentL <= (safetyBreak * 1000)) {
            let currentW = currentL / aspectRatio;
            
            // --- NEW: Check constraints ---
            if (!expandForPerformance && (currentL > warehouseL || currentW > warehouseW)) {
                break; // Hit constraint
            }

            currentL += step;
            currentW = currentL / aspectRatio;
            let metrics = getMetrics(currentL, currentW, sysHeight, config);

            if (metrics.totalLocations >= storageReq) {
                const density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;
                storageMetResults = { ...metrics, density: density };
                break; // Found storage
            }
        }

        // --- Check results of Loop 1 ---
        if (!storageMetResults) {
            resolve(null); // No solution found within safety break or constraints
            return;
        }

        // MODIFIED: Check density and expandForPerformance flag
        if (storageMetResults.density <= storageMetResults.maxPerfDensity || !expandForPerformance) {
            // Storage and performance met in one go!
            // OR we were told not to expand.
            // In either case, we don't expand, so we don't reduce.
            resolve({ ...storageMetResults, configKey, configName: config.name });
            return;
        }

        // --- Loop 2: Find Performance (if needed) ---
        // Start from the length where storage was met
        let performanceMetMetrics = null; // NEW
        while (currentL <= (safetyBreak * 1000)) {
            let currentW = currentL / aspectRatio;

            // --- NEW: Check constraints ---
            if (!expandForPerformance && (currentL > warehouseL || currentW > warehouseW)) {
                break; // Hit constraint
            }
            
            currentL += step;
            currentW = currentL / aspectRatio;
            let metrics = getMetrics(currentL, currentW, sysHeight, config);
            let density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;

            if (density <= metrics.maxPerfDensity) {
                // Performance target met
                performanceMetMetrics = { ...metrics, density: density }; // NEW
                break; // NEW
            }
        }

        // NEW: Check if Loop 2 found a solution
        if (!performanceMetMetrics) {
            // We either hit safety break or constraint
            // We must return the storage-met result, as that's the best we could do.
            resolve({ ...storageMetResults, configKey, configName: config.name });
            return;
        }

        // --- NEW: Reduction Logic ---
        if (reduceLevels && performanceMetMetrics.totalLocations > storageReq) {
            let bestMetrics = performanceMetMetrics;
            // We need the L/W from the performance-met solution
            const perfL = performanceMetMetrics.L;
            const perfW = performanceMetMetrics.W;
            const perfDensity = performanceMetMetrics.density;

            for (let levels = performanceMetMetrics.calculatedMaxLevels - 1; levels > 0; levels--) {
                const reducedMetrics = getMetrics(perfL, perfW, sysHeight, config, levels);
                
                if (reducedMetrics.totalLocations >= storageReq) {
                    bestMetrics = { ...reducedMetrics, density: perfDensity };
                } else {
                    break; // Went too low
                }
            }
            resolve({ ...bestMetrics, configKey, configName: config.name });

        } else {
            // Don't reduce, just return the performance-met solution
            resolve({ ...performanceMetMetrics, configKey, configName: config.name });
        }
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
// MODIFIED: Export this function so ui.js can call it
export async function runAllConfigurationsSolver() {
    // MODIFIED: Removed button disable
    // runAllOptionsButton.disabled = true;
    runAllStatus.textContent = "Running all configurations...";
    comparisonResultsContainer.innerHTML = ''; // Clear previous results

    // Get Solver Inputs
    const storageReq = parseNumber(solverStorageReqInput.value);
    const throughputReq = parseNumber(solverThroughputReqInput.value);
    const aspectRatio = parseNumber(solverAspectRatioInput.value) || 1.0;
    const sysHeight = parseNumber(clearHeightInput.value);
    // NEW: Read checkbox states
    const expandForPerformance = solverExpandPDCheckbox.checked;
    const reduceLevels = solverReduceLevelsCheckbox.checked;
    const expandConstraints = solverExpandConstraintsCheckbox.checked; // NEW
    
    // NEW: Get warehouse constraints
    const warehouseL = parseNumber(warehouseLengthInput.value);
    const warehouseW = parseNumber(warehouseWidthInput.value);


    if (storageReq === 0 || throughputReq === 0 || aspectRatio === 0 || sysHeight === 0) {
        runAllStatus.textContent = "Error: Please check solver inputs on main tab.";
        // runAllOptionsButton.disabled = false;
        return;
    }

    const promises = [];
    for (const configKey in configurations) {
        const config = configurations[configKey];
        // MODIFIED: Pass new arguments
        promises.push(findSolutionForConfig(
            storageReq,
            throughputReq,
            aspectRatio,
            sysHeight,
            config,
            configKey,
            expandForPerformance, // Pass flag
            reduceLevels,         // Pass flag
            warehouseL,           // Pass constraint
            warehouseW            // Pass constraint
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
        // runAllOptionsButton.disabled = false;

    } catch (error) {
        console.error("Error during comparison solve:", error);
        runAllStatus.textContent = "An error occurred. Check console for details.";
        // runAllOptionsButton.disabled = false;
    }
}


// --- Main Initialization ---
export function initializeSolver() {
    runSolverButton.addEventListener('click', () => runSolver());

    // NEW: Add listener for export button
    // MODIFIED: Call renamed function
    exportResultsButton.addEventListener('click', exportLayout);

    solverConfigSelect.addEventListener('change', () => {
        requestRedraw(); // Redraw visualization with new config
    });

    // MODIFIED: Modal listeners REMOVED
}
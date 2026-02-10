import {
    solverStorageReqInput, solverThroughputReqInput,
    solverTotePresetSelect, solverToteFaceInput, solverToteDepthInput, solverToteHeightInput,
    solverEquivalentVolumeCheckbox,
    runSolverButton,
    solverConfigStatus,
    solverConfigResultsContainer,
    solverConfigResultsScroller,
    solverResultsSection,
    solverVisualizationsSection,
    solverResultLength, solverResultWidth,
    solverResultFootprint, solverResultLocations, solverResultPerfDensity,
    exportResultsButton,
    warehouseLengthInput, warehouseWidthInput, mainViewTabs,
    clearHeightInput,
    solverExpandPDCheckbox,
    solverReduceLevelsCheckbox,
    solverRespectConstraintsCheckbox,
    solverResultLengthWarning, solverResultWidthWarning,
    solverMethodSelect,
    solverAspectRatioInput,
    solverFixedLength,
    solverFixedWidth,
    solverManualLength,
    solverManualWidth,
    solverResultGrossVolume,
    solverResultTotalBays,
    solverResultCapacityUtil,
    solverResultRowsAndBays,
    solverResultPDUtil,
    unitToggle,
    solverResultFootprintUnit,
    solverResultGrossVolumeUnit,
    robotPathTopLinesInput,
    robotPathBottomLinesInput,
    robotPathAddLeftACRCheckbox,
    robotPathAddRightACRCheckbox,
    userSetbackTopInput,
    userSetbackBottomInput,
    userSetbackLeftInput,
    userSetbackRightInput,
    // Manual
    manualSystemConfigSelect,
    manualLengthSlider,
    manualWidthSlider,
    manualToteSizeSelect,
    manualToteHeightSelect,
    manualThroughputInput,
    manualClearHeightInput,
    pdUtilCard,
    solverResultRobotCount

} from './dom.js';
import { parseNumber, formatNumber } from '../utils.js';
import { getMetrics, calculateLayout, calculateElevationLayout } from './calculations.js';
import { requestRedraw } from './ui.js';
import { configurations } from './config.js';
import { exportLayout } from './export.js';

export let selectedSolverResult = null;
let allSolverResults = [];
let isImperial = false;

function calculateRobotCount(config, throughput) {
    if (!config || !throughput || throughput <= 0) return "-";
    const efficiencies = config['robot-efficiencies'];
    if (!efficiencies) return "-";

    let parts = [];
    for (const [type, eff] of Object.entries(efficiencies)) {
        const count = Math.ceil(throughput / eff);
        parts.push(`${count} ${type}`);
    }
    return parts.join(", ");
}

export function toggleUnits() {
    isImperial = !isImperial;
    if (unitToggle) unitToggle.textContent = isImperial ? 'Imperial' : 'Metric';
    if (solverResultFootprintUnit) solverResultFootprintUnit.textContent = isImperial ? 'ft²' : 'm²';
    if (solverResultGrossVolumeUnit) solverResultGrossVolumeUnit.textContent = isImperial ? 'ft³' : 'm³';

    if (selectedSolverResult) {
        updateSolverResults(selectedSolverResult);
    }
}

export function setSelectedSolverResult(result) {
    selectedSolverResult = result;
}

export function getSolverResultByKey(key) {
    return allSolverResults.find(r => r.configKey === key);
}

export function reSolveCurrent() {
    if (!selectedSolverResult) return;

    // Check if in manual mode
    const activeTab = document.querySelector('.main-tab-button.active')?.getAttribute('data-tab');
    if (activeTab === 'manualTabContent') {
        runManualLayout();
        return;
    }

    const config = configurations[selectedSolverResult.configKey];
    if (!config) return;

    const storageReq = parseNumber(solverStorageReqInput.value);
    const throughputReq = parseNumber(solverThroughputReqInput.value);
    const sysHeight = parseNumber(clearHeightInput.value);
    const toteHeight = solverToteHeightInput ? Number(solverToteHeightInput.value) : 300;

    const warehouseL = parseNumber(warehouseLengthInput.value);
    const warehouseW = parseNumber(warehouseWidthInput.value);
    const respectConstraints = solverRespectConstraintsCheckbox.checked;
    const expandForPerformance = solverExpandPDCheckbox.checked;
    const reduceLevels = solverReduceLevelsCheckbox.checked;

    let solverOptions = { method: solverMethodSelect.value };
    if (solverOptions.method === 'aspectRatio') solverOptions.value = parseNumber(solverAspectRatioInput.value);
    else if (solverOptions.method === 'fixedLength') solverOptions.value = parseNumber(solverFixedLength.value);
    else if (solverOptions.method === 'fixedWidth') solverOptions.value = parseNumber(solverFixedWidth.value);

    const pathSettings = {
        topAMRLines: robotPathTopLinesInput ? parseNumber(robotPathTopLinesInput.value) : 3,
        bottomAMRLines: robotPathBottomLinesInput ? parseNumber(robotPathBottomLinesInput.value) : 3,
        addLeftACR: robotPathAddLeftACRCheckbox ? robotPathAddLeftACRCheckbox.checked : false,
        addRightACR: robotPathAddRightACRCheckbox ? robotPathAddRightACRCheckbox.checked : false,
        userSetbackTop: userSetbackTopInput ? parseNumber(userSetbackTopInput.value) : 500,
        userSetbackBottom: userSetbackBottomInput ? parseNumber(userSetbackBottomInput.value) : 500,
        userSetbackLeft: userSetbackLeftInput ? parseNumber(userSetbackLeftInput.value) : 500,
        userSetbackRight: userSetbackRightInput ? parseNumber(userSetbackRightInput.value) : 500
    };

    findSolutionForConfig(
        storageReq, throughputReq, sysHeight, config, selectedSolverResult.configKey,
        expandForPerformance, reduceLevels, warehouseL, warehouseW, respectConstraints,
        solverOptions, pathSettings, toteHeight
    ).then(newResult => {
        if (newResult) {
            newResult.throughputReq = throughputReq;
            setSelectedSolverResult(newResult);
            updateSolverResults(newResult);
            requestRedraw(true);
        }
    });
}

// --- Manual Run Function ---
export function runManualLayout() {
    if (!manualSystemConfigSelect) return;

    // Use sliders for dimensions
    const L = Number(manualLengthSlider.value);
    const W = Number(manualWidthSlider.value);

    // Config
    const configKey = manualSystemConfigSelect.value;
    const config = configurations[configKey];

    const H = parseNumber(manualClearHeightInput.value);
    const toteHeight = parseNumber(manualToteHeightSelect.value);
    const throughput = parseNumber(manualThroughputInput.value);

    const pathSettings = {
        topAMRLines: robotPathTopLinesInput ? parseNumber(robotPathTopLinesInput.value) : 3,
        bottomAMRLines: robotPathBottomLinesInput ? parseNumber(robotPathBottomLinesInput.value) : 3,
        addLeftACR: robotPathAddLeftACRCheckbox ? robotPathAddLeftACRCheckbox.checked : false,
        addRightACR: robotPathAddRightACRCheckbox ? robotPathAddRightACRCheckbox.checked : false,
        userSetbackTop: userSetbackTopInput ? parseNumber(userSetbackTopInput.value) : 500,
        userSetbackBottom: userSetbackBottomInput ? parseNumber(userSetbackBottomInput.value) : 500,
        userSetbackLeft: userSetbackLeftInput ? parseNumber(userSetbackLeftInput.value) : 500,
        userSetbackRight: userSetbackRightInput ? parseNumber(userSetbackRightInput.value) : 500
    };

    const metrics = getMetrics(L, W, H, config, pathSettings, null, toteHeight);

    // Calculate density based on manual throughput
    const manualDensity = (metrics.footprint > 0) ? throughput / metrics.footprint : 0;

    // Robot Count
    const robotCount = calculateRobotCount(config, throughput);

    const result = {
        configKey: configKey,
        configName: config.name,
        L: L,
        W: W,
        sysHeight: H,
        resolvedToteHeight: toteHeight,
        throughputReq: throughput,
        ...metrics,
        density: manualDensity,
        robotCount: robotCount,
        isExpanded: false,
        isReduced: false
    };

    setSelectedSolverResult(result);

    if (solverConfigResultsContainer) solverConfigResultsContainer.style.display = 'none';

    updateSolverResults(result);
    requestRedraw(false);
}


export function updateSolverResults(results) {
    if (!results) {
        if (solverResultsSection) solverResultsSection.style.display = 'none';
        if (exportResultsButton) exportResultsButton.style.display = 'none';
        return;
    }

    if (solverResultLength) solverResultLength.textContent = formatNumber(results.L);
    if (solverResultWidth) solverResultWidth.textContent = formatNumber(results.W);
    if (solverResultLocations) solverResultLocations.textContent = formatNumber(results.totalLocations);
    if (solverResultPerfDensity) solverResultPerfDensity.textContent = (results.density || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let footprintVal = results.footprint;
    let grossVolVal = results.toteVolume_m3 * results.totalLocations;

    if (isImperial) {
        footprintVal = footprintVal * 10.7639;
        grossVolVal = grossVolVal * 35.3147;
    }

    if (solverResultFootprint) solverResultFootprint.textContent = footprintVal.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (solverResultGrossVolume) solverResultGrossVolume.textContent = grossVolVal.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (solverResultRobotCount) solverResultRobotCount.textContent = results.robotCount || "-";

    // PD UTILIZATION CALCULATION & STYLING
    const capacityUtil = (results.density > 0 && results.maxPerfDensity > 0) ? (results.density / results.maxPerfDensity) * 100 : 0;

    if (solverResultPDUtil) {
        solverResultPDUtil.textContent = capacityUtil.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';

        // Color Logic
        if (pdUtilCard) {
            // Reset classes
            pdUtilCard.classList.remove('border-orange-400', 'bg-orange-50', 'border-red-500', 'bg-red-50');
            const valSpan = solverResultPDUtil;
            valSpan.classList.remove('text-orange-600', 'text-red-600');

            if (capacityUtil > 100) {
                // RED
                pdUtilCard.classList.add('border-red-500', 'bg-red-50');
                valSpan.classList.add('text-red-600');
            } else if (capacityUtil >= 95) {
                // ORANGE
                pdUtilCard.classList.add('border-orange-400', 'bg-orange-50');
                valSpan.classList.add('text-orange-600');
            }
        }
    }

    if (solverResultTotalBays) solverResultTotalBays.textContent = formatNumber(results.totalBays);
    if (solverResultRowsAndBays) solverResultRowsAndBays.textContent = `${formatNumber(results.numRows)} x ${formatNumber(results.baysPerRack)}`;

    const warehouseL = parseNumber(warehouseLengthInput.value);
    const warehouseW = parseNumber(warehouseWidthInput.value);

    const solverMethod = solverMethodSelect.value;
    const respectConstraints = solverRespectConstraintsCheckbox.checked;
    const lengthBroken = (solverMethod !== 'manual') && respectConstraints && warehouseL > 0 && results.L > warehouseL;
    const widthBroken = (solverMethod !== 'manual') && respectConstraints && warehouseW > 0 && results.W > warehouseW;

    if (solverResultLengthWarning) solverResultLengthWarning.style.display = lengthBroken ? 'inline' : 'none';
    if (solverResultWidthWarning) solverResultWidthWarning.style.display = widthBroken ? 'inline' : 'none';

    if (exportResultsButton) exportResultsButton.style.display = 'block';
    if (solverResultsSection) solverResultsSection.style.display = 'block';
}

function findSolutionForConfig(storageReq, throughputReq, sysHeight, config, configKey, expandForPerformance, reduceLevels, warehouseL, warehouseW, respectConstraints, options, pathSettings, toteHeight) {
    return new Promise((resolve) => {
        let currentL = 10000;
        let currentW = 10000;
        const step = 1000;
        const safetyBreak = 1000;
        let storageMetResults = null;
        let metrics;

        switch (options.method) {
            case 'aspectRatio':
                currentL = 10000;
                while (currentL <= (safetyBreak * 1000)) {
                    currentW = currentL / options.value;
                    if (respectConstraints && (currentL > warehouseL || currentW > warehouseW)) break;
                    currentL += step;
                    currentW = currentL / options.value;
                    metrics = getMetrics(currentL, currentW, sysHeight, config, pathSettings, null, toteHeight);
                    if (metrics.totalLocations >= storageReq) {
                        const density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;
                        storageMetResults = { ...metrics, density: density, isExpanded: false, isReduced: false };
                        break;
                    }
                }
                if (!storageMetResults) { resolve(null); return; }
                if (storageMetResults.density <= storageMetResults.maxPerfDensity || !expandForPerformance) {
                    storageMetResults.throughputReq = throughputReq;
                    storageMetResults.robotCount = calculateRobotCount(config, throughputReq);
                    resolve({ ...storageMetResults, configKey, configName: config.name });
                    return;
                }
                while (currentL <= (safetyBreak * 1000)) {
                    currentW = currentL / options.value;
                    if (respectConstraints && (currentL > warehouseL || currentW > warehouseW)) break;

                    currentL += step;
                    currentW = currentL / options.value;
                    metrics = getMetrics(currentL, currentW, sysHeight, config, pathSettings, null, toteHeight);
                    let density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;
                    if (density <= metrics.maxPerfDensity) {
                        storageMetResults = { ...metrics, density: density, isExpanded: true, isReduced: false };
                        break;
                    }
                }
                break;
            case 'fixedLength':
                currentL = options.value;
                currentW = 10000;
                while (currentW <= (safetyBreak * 1000)) {
                    if (respectConstraints && (currentW > warehouseW)) break;
                    currentW += step;
                    metrics = getMetrics(currentL, currentW, sysHeight, config, pathSettings, null, toteHeight);
                    if (metrics.totalLocations >= storageReq) {
                        const density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;
                        storageMetResults = { ...metrics, density: density, isExpanded: false, isReduced: false };
                        break;
                    }
                }
                if (!storageMetResults) { resolve(null); return; }
                if (storageMetResults.density <= storageMetResults.maxPerfDensity || !expandForPerformance) {
                    storageMetResults.throughputReq = throughputReq;
                    resolve({ ...storageMetResults, configKey, configName: config.name });
                    return;
                }
                while (currentW <= (safetyBreak * 1000)) {
                    if (respectConstraints && (currentW > warehouseW)) break;
                    currentW += step;
                    metrics = getMetrics(currentL, currentW, sysHeight, config, pathSettings, null, toteHeight);
                    let density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;
                    if (density <= metrics.maxPerfDensity) {
                        storageMetResults = { ...metrics, density: density, isExpanded: true, isReduced: false };
                        break;
                    }
                }
                break;
            case 'fixedWidth':
                currentW = options.value;
                currentL = 10000;
                while (currentL <= (safetyBreak * 1000)) {
                    if (respectConstraints && (currentL > warehouseL)) break;
                    currentL += step;
                    metrics = getMetrics(currentL, currentW, sysHeight, config, pathSettings, null, toteHeight);
                    if (metrics.totalLocations >= storageReq) {
                        const density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;
                        storageMetResults = { ...metrics, density: density, isExpanded: false, isReduced: false };
                        break;
                    }
                }
                if (!storageMetResults) { resolve(null); return; }
                if (storageMetResults.density <= storageMetResults.maxPerfDensity || !expandForPerformance) {
                    storageMetResults.throughputReq = throughputReq;
                    resolve({ ...storageMetResults, configKey, configName: config.name });
                    return;
                }
                while (currentL <= (safetyBreak * 1000)) {
                    if (respectConstraints && (currentL > warehouseL)) break;
                    currentL += step;
                    metrics = getMetrics(currentL, currentW, sysHeight, config, pathSettings, null, toteHeight);
                    let density = (metrics.footprint > 0) ? throughputReq / metrics.footprint : 0;
                    if (density <= metrics.maxPerfDensity) {
                        storageMetResults = { ...metrics, density: density, isExpanded: true, isReduced: false };
                        break;
                    }
                }
                break;
            case 'manual':
                resolve(null);
                return;
        }

        if (storageMetResults && reduceLevels && storageMetResults.isExpanded && storageMetResults.totalLocations > storageReq) {
            let bestMetrics = storageMetResults;
            const perfL = storageMetResults.L;
            const perfW = storageMetResults.W;
            const perfDensity = storageMetResults.density;
            for (let levels = storageMetResults.calculatedMaxLevels - 1; levels > 0; levels--) {
                const reducedMetrics = getMetrics(perfL, perfW, sysHeight, config, pathSettings, levels, toteHeight);
                if (reducedMetrics.totalLocations >= storageReq) {
                    bestMetrics = { ...reducedMetrics, density: perfDensity, isExpanded: true, isReduced: true };
                } else {
                    break;
                }
            }
            bestMetrics.throughputReq = throughputReq;
            bestMetrics.robotCount = calculateRobotCount(config, throughputReq);
            resolve({ ...bestMetrics, configKey, configName: config.name });
        } else if (storageMetResults) {
            storageMetResults.throughputReq = throughputReq;
            storageMetResults.robotCount = calculateRobotCount(config, throughputReq);
            resolve({ ...storageMetResults, configKey, configName: config.name });
        } else {
            resolve(null);
        }
    });
}

function createResultCard(result) {
    if (!result) return '';
    const footprint = result.footprint.toLocaleString('en-US', { maximumFractionDigits: 1 });
    const locations = formatNumber(result.totalLocations);
    const density = result.density.toLocaleString('en-US', { maximumFractionDigits: 2 });
    const grossVolume = (result.toteVolume_m3 * result.totalLocations).toLocaleString('en-US', { maximumFractionDigits: 1 });
    const capacityUtil = ((result.density > 0 && result.maxPerfDensity > 0) ? (result.density / result.maxPerfDensity) * 100 : 0).toLocaleString('en-US', { maximumFractionDigits: 1 });
    const totalBays = formatNumber(result.totalBays);
    const rowsAndBays = `${formatNumber(result.numRows)} x ${formatNumber(result.baysPerRack)}`;
    const robotCount = result.robotCount || "-";

    return `
        <div class="comparison-card" data-config-key="${result.configKey}">
            <h3 class="comparison-card-title">${result.configName}</h3>
            <div class="comparison-card-metric"><span class="comparison-card-label">Footprint (m²)</span><span class="comparison-card-value">${footprint}</span></div>
            <div class="comparison-card-metric"><span class="comparison-card-label">Perf. Density</span><span class="comparison-card-value">${density}</span></div>
            <div class="comparison-card-metric"><span class="comparison-card-label">PD Utilization</span><span class="comparison-card-value">${capacityUtil} %</span></div>
            <div class="comparison-card-metric"><span class="comparison-card-label">Est. Robots</span><span class="comparison-card-value">${robotCount}</span></div>
            <div class="comparison-card-metric"><span class="comparison-card-label">Locations</span><span class="comparison-card-value-small">${locations}</span></div>
            <div class="comparison-card-metric"><span class="comparison-card-label">Gross Volume (m³)</span><span class="comparison-card-value-small">${grossVolume}</span></div>
            <div class="comparison-card-metric"><span class="comparison-card-label">Total Bays</span><span class="comparison-card-value-small">${totalBays}</span></div>
            <div class="comparison-card-metric"><span class="comparison-card-label">Rows x Bays/Row</span><span class="comparison-card-value-small">${rowsAndBays}</span></div>
        </div>
    `;
}

function generateSystemConfigs(face, depth, height) {
    // Templates
    const templateDD = configurations['hps3-e2-650-dd'];
    const templateTD = configurations['hps3-e2-650-td'];
    const templateSingle = configurations['HPC'];
    const templateDDHPC = configurations['HPC-DD'];

    const generated = [];

    // Common calculations
    const estimatedAisleWidth = depth + 550; // Heuristic
    const targetBayWidth = 2200;
    const qtyPerBay = Math.max(1, Math.floor(targetBayWidth / face));

    // 1. Custom Double Deep
    if (templateDD) {
        const newKey = `CUSTOM-DD-${face}x${depth}`;
        const newConfig = JSON.parse(JSON.stringify(templateDD)); // Deep clone
        newConfig.name = `Double Deep (${face}x${depth})`;
        newConfig['tote-width'] = depth;
        newConfig['tote-length'] = face;
        newConfig['tote-height'] = height;
        newConfig['tote-qty-per-bay'] = qtyPerBay;
        newConfig['aisle-width-low'] = estimatedAisleWidth;
        newConfig['aisle-width-high'] = estimatedAisleWidth;

        // Add to global configurations so it can be retrieved later
        configurations[newKey] = newConfig;
        generated.push(newKey);
    }

    // 2. Custom Triple Deep
    if (templateTD) {
        const newKey = `CUSTOM-TD-${face}x${depth}`;
        const newConfig = JSON.parse(JSON.stringify(templateTD));
        newConfig.name = `Triple Deep (${face}x${depth})`;
        newConfig['tote-width'] = depth;
        newConfig['tote-length'] = face;
        newConfig['tote-height'] = height;
        newConfig['tote-qty-per-bay'] = qtyPerBay;
        newConfig['aisle-width-low'] = estimatedAisleWidth;
        newConfig['aisle-width-high'] = estimatedAisleWidth;

        configurations[newKey] = newConfig;
        generated.push(newKey);
    }

    // 3. Custom Single Deep
    if (templateSingle) {
        const newKey = `CUSTOM-SD-${face}x${depth}`;
        const newConfig = JSON.parse(JSON.stringify(templateSingle));
        newConfig.name = `Single Deep (${face}x${depth})`;
        newConfig['tote-width'] = depth;
        newConfig['tote-length'] = face;
        newConfig['tote-height'] = height;
        newConfig['tote-qty-per-bay'] = Math.max(1, qtyPerBay - 1); // Usually less dense horizontally? Or same?
        // Let's keep consistent qtyPerBay logic or just stick to what template uses relative to its size
        // Single Deep template uses 3 totes for 450 width. 3 * 450 = 1350. Maybe narrower bays.
        // Let's stick to calculated qtyPerBay.
        newConfig['tote-qty-per-bay'] = qtyPerBay;
        newConfig['aisle-width-low'] = 900; // Fixed for HPC? Or scale? Let's scale lightly.
        newConfig['aisle-width-high'] = 900;

        configurations[newKey] = newConfig;
        generated.push(newKey);
    }

    return generated;
}

async function runAllConfigurationsSolver() {
    if (runSolverButton) runSolverButton.disabled = true;
    if (solverConfigStatus) solverConfigStatus.textContent = "Running all configurations...";
    if (solverConfigResultsScroller) solverConfigResultsScroller.innerHTML = '';

    if (solverConfigResultsContainer) solverConfigResultsContainer.style.display = 'none';
    if (solverResultsSection) solverResultsSection.style.display = 'none';
    if (solverVisualizationsSection) solverVisualizationsSection.style.display = 'none';
    if (exportResultsButton) exportResultsButton.style.display = 'none';

    allSolverResults = [];
    setSelectedSolverResult(null);
    requestRedraw();

    const solverMethod = solverMethodSelect ? solverMethodSelect.value : 'aspectRatio';
    const throughputReq = solverThroughputReqInput ? parseNumber(solverThroughputReqInput.value) : 0;
    const sysHeight = clearHeightInput ? parseNumber(clearHeightInput.value) : 0;

    // Use new inputs
    const toteFace = solverToteFaceInput ? parseNumber(solverToteFaceInput.value) : 450;
    const toteDepth = solverToteDepthInput ? parseNumber(solverToteDepthInput.value) : 650;
    const toteHeight = solverToteHeightInput ? parseNumber(solverToteHeightInput.value) : 300;

    const pathSettings = {
        topAMRLines: robotPathTopLinesInput ? parseNumber(robotPathTopLinesInput.value) : 3,
        bottomAMRLines: robotPathBottomLinesInput ? parseNumber(robotPathBottomLinesInput.value) : 3,
        addLeftACR: robotPathAddLeftACRCheckbox ? robotPathAddLeftACRCheckbox.checked : false,
        addRightACR: robotPathAddRightACRCheckbox ? robotPathAddRightACRCheckbox.checked : false,
        userSetbackTop: userSetbackTopInput ? parseNumber(userSetbackTopInput.value) : 500,
        userSetbackBottom: userSetbackBottomInput ? parseNumber(userSetbackBottomInput.value) : 500,
        userSetbackLeft: userSetbackLeftInput ? parseNumber(userSetbackLeftInput.value) : 500,
        userSetbackRight: userSetbackRightInput ? parseNumber(userSetbackRightInput.value) : 500
    };

    const promises = [];

    if (solverMethod === 'manual') {
        // do nothing
    } else {
        const originalStorageReq = solverStorageReqInput ? parseNumber(solverStorageReqInput.value) : 0;
        const expandForPerformance = solverExpandPDCheckbox ? solverExpandPDCheckbox.checked : true;
        const reduceLevels = solverReduceLevelsCheckbox ? solverReduceLevelsCheckbox.checked : true;
        const respectConstraints = solverRespectConstraintsCheckbox ? solverRespectConstraintsCheckbox.checked : false;
        const warehouseL = warehouseLengthInput ? parseNumber(warehouseLengthInput.value) : 0;
        const warehouseW = warehouseWidthInput ? parseNumber(warehouseWidthInput.value) : 0;

        let solverOptions = {};
        if (solverMethod === 'aspectRatio') {
            solverOptions.method = 'aspectRatio';
            solverOptions.value = solverAspectRatioInput ? parseNumber(solverAspectRatioInput.value) : 1;
        } else if (solverMethod === 'fixedLength') {
            solverOptions.method = 'fixedLength';
            solverOptions.value = solverFixedLength ? parseNumber(solverFixedLength.value) : 0;
        } else if (solverMethod === 'fixedWidth') {
            solverOptions.method = 'fixedWidth';
            solverOptions.value = solverFixedWidth ? parseNumber(solverFixedWidth.value) : 0;
        }

        if (originalStorageReq === 0 || throughputReq === 0 || sysHeight === 0) {
            if (solverConfigStatus) solverConfigStatus.textContent = "Error: Please check solver inputs.";
            if (runSolverButton) runSolverButton.disabled = false;
            return;
        }

        // Generate Configs based on inputs
        const configKeysToRun = generateSystemConfigs(toteFace, toteDepth, toteHeight);

        for (const key of configKeysToRun) {
            const config = configurations[key];
            if (!config) continue;
            promises.push(findSolutionForConfig(
                originalStorageReq, throughputReq, sysHeight, config, key,
                expandForPerformance, reduceLevels, warehouseL, warehouseW, respectConstraints,
                solverOptions, pathSettings, toteHeight
            ));
        }
    }

    try {
        const allResults = await Promise.all(promises);
        const validResults = allResults.filter(res => res !== null);
        validResults.sort((a, b) => a.footprint - b.footprint);
        allSolverResults = validResults;

        if (validResults.length === 0) {
            if (solverConfigResultsScroller) solverConfigResultsScroller.innerHTML = '<p class="text-black font-mono font-bold p-2">No valid solutions found.</p>';
        } else {
            if (solverConfigResultsScroller) solverConfigResultsScroller.innerHTML = validResults.map(createResultCard).join('');
        }

        if (solverConfigStatus) solverConfigStatus.textContent = `Found ${validResults.length} solutions.`;
        if (solverConfigResultsContainer) solverConfigResultsContainer.style.display = 'block';
        if (runSolverButton) runSolverButton.disabled = false;

    } catch (error) {
        console.error(error);
        if (solverConfigStatus) solverConfigStatus.textContent = "Error.";
        if (runSolverButton) runSolverButton.disabled = false;
    }
}

export function initializeSolver() {
    if (runSolverButton) runSolverButton.addEventListener('click', runAllConfigurationsSolver);
    if (exportResultsButton) exportResultsButton.addEventListener('click', exportLayout);
    // NEW: Unit Toggle Listener
    if (unitToggle) unitToggle.addEventListener('click', toggleUnits);
}
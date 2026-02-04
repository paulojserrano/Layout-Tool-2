import {
    mainViewTabs, warehouseCanvas, rackDetailCanvas, elevationCanvas,
    warehouseLengthInput, warehouseWidthInput, clearHeightInput,
    solverConfigResultsScroller, solverResultsSection, solverVisualizationsSection,
    robotPathTopLinesInput, robotPathBottomLinesInput,
    robotPathAddLeftACRCheckbox, robotPathAddRightACRCheckbox,
    userSetbackTopInput, userSetbackBottomInput,
    userSetbackLeftInput, userSetbackRightInput,
    adjustedLocationsDisplay, solverToteHeightSelect,
    visTabsNav, viewContainerWarehouse, viewContainerElevation, viewContainerDetail,
    viewContainer3D,
    leftPanel, rightPanel, runButtonText,
    robotPathACRContainer, solverThroughputReqInput,
    solverFooter,
    manualLengthSlider, manualWidthSlider,
    manualLengthValue, manualWidthValue,
    manualSystemConfigSelect, manualToteSizeSelect, manualToteHeightSelect,
    manualClearHeightInput, manualThroughputInput,
    pdUtilCard, solverResultPDUtil,
    detailViewToggle // Imported detail toggle
} from './dom.js';

import { drawWarehouse } from './drawing/warehouseView.js';
import { drawRackDetail } from './drawing/rackDetailView.js';
import { drawElevationView } from './drawing/elevationView.js';
// NEW: Import 3D view functions
import { init3DView, draw3DView, animate3D, stopAnimate3D } from './drawing/3dview.js';

import { parseNumber, formatNumber, formatDecimalNumber } from '../utils.js';
import { configurations } from './config.js';
import { getViewState } from './viewState.js';
import { getMetrics } from './calculations.js';
import {
    selectedSolverResult, setSelectedSolverResult,
    getSolverResultByKey, updateSolverResults,
    reSolveCurrent, runManualLayout
} from './solver.js';

let rafId = null;
let debounceTimer = null;
let lastContentScaleWarehouse = 1;
let is3DInitialized = false;

function initializeVisTabs() {
    if (!visTabsNav) return;
    visTabsNav.addEventListener('click', (e) => {
        if (e.target.classList.contains('vis-tab-button')) {
            const buttons = visTabsNav.querySelectorAll('.vis-tab-button');
            buttons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            if (viewContainerWarehouse) viewContainerWarehouse.classList.add('hidden');
            if (viewContainerElevation) viewContainerElevation.classList.add('hidden');
            if (viewContainerDetail) viewContainerDetail.classList.add('hidden');
            if (viewContainer3D) viewContainer3D.classList.add('hidden');

            const target = e.target.dataset.target;

            // Stop 3D animation if not in 3D tab
            if (target !== '3d') {
                stopAnimate3D();
            }

            if (target === 'warehouse' && viewContainerWarehouse) viewContainerWarehouse.classList.remove('hidden');
            if (target === 'elevation' && viewContainerElevation) viewContainerElevation.classList.remove('hidden');
            if (target === 'detail' && viewContainerDetail) viewContainerDetail.classList.remove('hidden');

            // 3D Logic
            if (target === '3d' && viewContainer3D) {
                viewContainer3D.classList.remove('hidden');
                if (!is3DInitialized) {
                    init3DView(viewContainer3D);
                    is3DInitialized = true;
                }
                animate3D(); // Start animation loop
            }

            requestRedraw(false);
        }
    });
}

function resetCanvasView(canvas) {
    if (!canvas) return;
    const state = getViewState(canvas);
    state.scale = 1.0;
    state.offsetX = 0;
    state.offsetY = 0;
}

export function requestRedraw(maintainVisualScale = false) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
        if (!warehouseCanvas || !rackDetailCanvas || !elevationCanvas) return;

        const warehouseCtx = warehouseCanvas.getContext('2d');
        const rackCtx = rackDetailCanvas.getContext('2d');
        const elevCtx = elevationCanvas.getContext('2d');

        if (!maintainVisualScale) {
            resetCanvasView(warehouseCanvas);
            resetCanvasView(rackDetailCanvas);
            resetCanvasView(elevationCanvas);
        }

        if (!selectedSolverResult) {
            const w = warehouseCanvas.clientWidth, h = warehouseCanvas.clientHeight;
            warehouseCtx.clearRect(0, 0, w, h);
            rackCtx.clearRect(0, 0, rackDetailCanvas.clientWidth, rackDetailCanvas.clientHeight);
            elevCtx.clearRect(0, 0, elevationCanvas.clientWidth, elevationCanvas.clientHeight);

            warehouseCtx.save();
            warehouseCtx.setTransform(1, 0, 0, 1, 0, 0);
            warehouseCtx.textAlign = 'center'; warehouseCtx.textBaseline = 'middle';
            warehouseCtx.fillStyle = '#94a3b8';
            warehouseCtx.font = 'bold 16px Inter, sans-serif';
            warehouseCtx.fillText('Run Analysis or Manual Layout', w / 2, h / 2);
            warehouseCtx.restore();
            return;
        }

        const config = configurations[selectedSolverResult.configKey];
        if (!config) return;

        // Use properties from result object to support both Solver and Manual modes
        let drawL = selectedSolverResult.L;
        let drawW = selectedSolverResult.W;

        // Priority: Manual Height > Result Height > Input Height
        const sysHeight = selectedSolverResult.sysHeight ? selectedSolverResult.sysHeight : parseNumber(clearHeightInput.value);
        const toteHeight = selectedSolverResult.resolvedToteHeight ? selectedSolverResult.resolvedToteHeight : (solverToteHeightSelect ? Number(solverToteHeightSelect.value) : 300);

        const metrics = getMetrics(drawL, drawW, sysHeight, config, null, selectedSolverResult.maxLevels, toteHeight);

        const drawConfig = {
            ...config,
            'tote-height': toteHeight,
            'aisle-width': metrics.resolvedAisleWidth
        };

        const state = getViewState(warehouseCanvas);
        const oldZoom = state.scale;

        const newContentScale = drawWarehouse(drawL, drawW, sysHeight, drawConfig, selectedSolverResult);
        drawRackDetail(0, 0, sysHeight, drawConfig, selectedSolverResult);
        drawElevationView(0, 0, sysHeight, drawConfig, selectedSolverResult);

        // --- NEW: Update 3D View if active ---
        // We only redraw geometry if the tab is visible to save resources
        if (viewContainer3D && !viewContainer3D.classList.contains('hidden')) {
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
            // Pass detail toggle state
            const isDetailView = detailViewToggle ? detailViewToggle.checked : false;
            draw3DView(drawL, drawW, sysHeight, drawConfig, selectedSolverResult, pathSettings, isDetailView);
        }

        // --- Alerts for Expansion/Reduction ---
        if (selectedSolverResult.isExpanded || selectedSolverResult.isReduced) {
            const w = warehouseCanvas.width / (window.devicePixelRatio || 1);

            warehouseCtx.save();
            warehouseCtx.setTransform(1, 0, 0, 1, 0, 0);

            const msg = selectedSolverResult.isExpanded
                ? (selectedSolverResult.isReduced ? "Layout Expanded & Levels Reduced" : "Layout Expanded to meet PD")
                : "Levels Reduced to Match Storage";

            warehouseCtx.font = 'bold 12px Inter, sans-serif';
            const textWidth = warehouseCtx.measureText(msg).width;
            const boxX = (w - textWidth - 30) / 2;
            const boxY = 20;
            const boxW = textWidth + 30;
            const boxH = 30;

            warehouseCtx.fillStyle = 'rgba(254, 242, 242, 0.9)';
            warehouseCtx.strokeStyle = '#fca5a5';
            warehouseCtx.lineWidth = 1;
            warehouseCtx.beginPath();
            warehouseCtx.roundRect(boxX, boxY, boxW, boxH, 15);
            warehouseCtx.fill();
            warehouseCtx.stroke();

            warehouseCtx.fillStyle = '#dc2626';
            warehouseCtx.textAlign = 'center';
            warehouseCtx.textBaseline = 'middle';
            warehouseCtx.fillText(msg, w / 2, boxY + boxH/2);

            warehouseCtx.restore();
        }

        if (maintainVisualScale && lastContentScaleWarehouse > 0 && newContentScale > 0) {
            const targetZoom = (lastContentScaleWarehouse * oldZoom) / newContentScale;
            if (Math.abs(targetZoom - oldZoom) > 0.0001) {
                state.scale = targetZoom;
                drawWarehouse(drawL, drawW, sysHeight, drawConfig, selectedSolverResult);

                // Re-draw alert if re-drawn
                if (selectedSolverResult.isExpanded || selectedSolverResult.isReduced) {
                    const w = warehouseCanvas.width / (window.devicePixelRatio || 1);
                    warehouseCtx.save();
                    warehouseCtx.setTransform(1, 0, 0, 1, 0, 0);
                    const msg = selectedSolverResult.isExpanded
                        ? (selectedSolverResult.isReduced ? "Layout Expanded & Levels Reduced" : "Layout Expanded to meet PD")
                        : "Levels Reduced to Match Storage";
                    const boxY = 20; const boxH = 30;
                    warehouseCtx.fillStyle = '#dc2626';
                    warehouseCtx.textAlign = 'center'; warehouseCtx.textBaseline = 'middle';
                    warehouseCtx.fillText(msg, w / 2, boxY + boxH/2);
                    warehouseCtx.restore();
                }
            }
        }
        lastContentScaleWarehouse = newContentScale;

        if (adjustedLocationsDisplay) {
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
            const levelOverride = selectedSolverResult ? selectedSolverResult.maxLevels : null;
            const currentMetrics = getMetrics(drawL, drawW, sysHeight, config, pathSettings, levelOverride, toteHeight);

            adjustedLocationsDisplay.textContent = formatNumber(currentMetrics.totalLocations);

            // --- Live Update of Metrics Panel ---
            if (selectedSolverResult) {
                 const locEl = document.getElementById('solverResultLocations');
                 const bayEl = document.getElementById('solverResultTotalBays');
                 const rowEl = document.getElementById('solverResultRowsAndBays');
                 const volEl = document.getElementById('solverResultGrossVolume');
                 const pdUtilEl = document.getElementById('solverResultPDUtil');

                 if (locEl) locEl.textContent = formatNumber(currentMetrics.totalLocations);
                 if (bayEl) bayEl.textContent = formatNumber(currentMetrics.totalBays);
                 if (rowEl) rowEl.textContent = `${formatNumber(currentMetrics.numRows)} x ${formatNumber(currentMetrics.baysPerRack)}`;
                 if (volEl) {
                     const vol = currentMetrics.toteVolume_m3 * currentMetrics.totalLocations;
                     volEl.textContent = vol.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                 }

                 // --- Live PD Utilization Color Coding ---
                 if (pdUtilEl && currentMetrics.maxPerfDensity > 0) {
                     // Get throughput from result (Manual) or Input (Solver)
                     const throughput = selectedSolverResult.throughputReq || (solverThroughputReqInput ? parseNumber(solverThroughputReqInput.value) : 0);
                     const footprint = currentMetrics.footprint;

                     let currentPD = 0;
                     if (footprint > 0) {
                         currentPD = throughput / footprint;
                     }
                     const pdUtil = (currentPD / currentMetrics.maxPerfDensity) * 100;
                     pdUtilEl.textContent = pdUtil.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';

                     // Color Logic
                     if (pdUtilCard) {
                        pdUtilCard.classList.remove('border-orange-400', 'bg-orange-50', 'border-red-500', 'bg-red-50');
                        pdUtilEl.classList.remove('text-orange-600', 'text-red-600');

                        if (pdUtil > 100) {
                            pdUtilCard.classList.add('border-red-500', 'bg-red-50');
                            pdUtilEl.classList.add('text-red-600');
                        } else if (pdUtil >= 95) {
                            pdUtilCard.classList.add('border-orange-400', 'bg-orange-50');
                            pdUtilEl.classList.add('text-orange-600');
                        }
                    }
                 }
            }
        }
        rafId = null;
    });
}

function debouncedReSolve() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        reSolveCurrent();
    }, 300);
}

function debouncedManualRun() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        runManualLayout();
    }, 100); // Fast debounce for sliders
}

function applyZoomPan(canvas, drawFunction) {
    if (!canvas) return;
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
        state.scale = Math.max(0.1, Math.min(newScale, 50));
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
    const mouseUpHandler = () => { state.isPanning = false; canvas.style.cursor = 'grab'; };
    const mouseLeaveHandler = () => { state.isPanning = false; canvas.style.cursor = 'default'; };

    canvas.addEventListener('wheel', wheelHandler);
    canvas.addEventListener('mousedown', mouseDownHandler);
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mouseup', mouseUpHandler);
    canvas.addEventListener('mouseleave', mouseLeaveHandler);
}

function handleConfigCardClick(e) {
    const card = e.target.closest('.comparison-card');
    if (!card) return;

    if (solverConfigResultsScroller) {
        const allCards = solverConfigResultsScroller.querySelectorAll('.comparison-card');
        allCards.forEach(c => c.classList.remove('active'));
    }
    card.classList.add('active');

    const key = card.dataset.configKey;
    const result = getSolverResultByKey(key);
    if (!result) return;

    setSelectedSolverResult(result);
    updateSolverResults(result);

    if (robotPathACRContainer) {
        robotPathACRContainer.style.display = key.includes('HPC') ? 'none' : 'flex';
    }

    requestRedraw(false);
}

export function initializeUI(redrawInputs, numberInputs, decimalInputs = []) {
    // Fine Adjustment Inputs -> Trigger Re-Solve
    const reSolveInputs = [
        robotPathTopLinesInput, robotPathBottomLinesInput,
        robotPathAddLeftACRCheckbox, robotPathAddRightACRCheckbox,
        userSetbackTopInput, userSetbackBottomInput,
        userSetbackLeftInput, userSetbackRightInput
    ];

    reSolveInputs.forEach(input => {
        if (input) {
            const eventType = input.type === 'checkbox' ? 'change' : 'input';
            input.addEventListener(eventType, debouncedReSolve);
        }
    });

    // --- MANUAL SLIDER LOGIC ---
    if (manualLengthSlider && manualLengthValue) {
        manualLengthSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            manualLengthValue.textContent = val.toLocaleString() + " mm";
            debouncedManualRun();
        });
    }

    if (manualWidthSlider && manualWidthValue) {
        manualWidthSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            manualWidthValue.textContent = val.toLocaleString() + " mm";
            debouncedManualRun();
        });
    }

    // Manual Inputs Auto-Run
    const manualInputs = [
        manualSystemConfigSelect, manualToteSizeSelect, manualToteHeightSelect,
        manualClearHeightInput, manualThroughputInput
    ];

    manualInputs.forEach(input => {
        if(input) input.addEventListener('change', debouncedManualRun);
    });

    // General inputs just redraw
    redrawInputs.forEach(input => {
        if (input && !reSolveInputs.includes(input)) {
            input.addEventListener('input', () => requestRedraw(false));
        }
    });

    numberInputs.forEach(input => {
        if (input && input.tagName.toLowerCase() !== 'select') {
            input.value = formatNumber(input.value);
            input.addEventListener('blur', () => { input.value = formatNumber(input.value); });
        }
    });

    decimalInputs.forEach(input => {
        if (input) {
            input.value = formatDecimalNumber(input.value, 2);
            input.addEventListener('blur', () => { input.value = formatDecimalNumber(input.value, 2); });
        }
    });

    const resizeObserver = new ResizeObserver(() => requestRedraw(false));
    if (warehouseCanvas && warehouseCanvas.parentElement) resizeObserver.observe(warehouseCanvas.parentElement);
    if (rackDetailCanvas && rackDetailCanvas.parentElement) resizeObserver.observe(rackDetailCanvas.parentElement);
    if (elevationCanvas && elevationCanvas.parentElement) resizeObserver.observe(elevationCanvas.parentElement);

    // Resize Observer for 3D container
    if (viewContainer3D) resizeObserver.observe(viewContainer3D);

    if (warehouseCanvas) applyZoomPan(warehouseCanvas, () => requestRedraw(true));
    if (rackDetailCanvas) applyZoomPan(rackDetailCanvas, () => requestRedraw(true));
    if (elevationCanvas) applyZoomPan(elevationCanvas, () => requestRedraw(true));

    if (mainViewTabs) {
        mainViewTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('main-tab-button') && !e.target.disabled) {
                mainViewTabs.querySelectorAll('.main-tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.main-tab-content').forEach(content => {
                    content.classList.remove('active');
                    content.style.display = 'none';
                });
                e.target.classList.add('active');
                const tabId = e.target.getAttribute('data-tab');
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                    tabContent.style.display = 'block';
                }

                if (solverFooter) {
                    if (tabId === 'configTabContent' || tabId === 'debugTabContent' || tabId === 'manualTabContent') {
                        solverFooter.style.display = 'none';
                    } else {
                        solverFooter.style.display = 'block';
                    }
                }

                if (leftPanel && rightPanel) {
                    if (tabId === 'configTabContent' || tabId === 'debugTabContent') {
                        leftPanel.classList.remove('w-[420px]'); leftPanel.classList.add('w-full'); rightPanel.style.display = 'none';
                    } else {
                        leftPanel.classList.remove('w-full'); leftPanel.classList.add('w-[420px]'); rightPanel.style.display = 'flex';
                    }
                }

                // If switching to Manual Tab, run initial default manual layout if none exists
                if (tabId === 'manualTabContent') {
                    // Slight delay to ensure visibility
                    setTimeout(() => runManualLayout(), 50);
                }

                requestRedraw(false);
            }
        });
    }

    // NEW: Listen to Detail View Toggle for 3D View updates
    if (detailViewToggle) {
        detailViewToggle.addEventListener('change', () => {
            requestRedraw(false);
        });
    }

    if (solverConfigResultsScroller) solverConfigResultsScroller.addEventListener('click', handleConfigCardClick);

    if (solverToteHeightSelect) solverToteHeightSelect.addEventListener('change', () => requestRedraw(false));

    initializeVisTabs();
}
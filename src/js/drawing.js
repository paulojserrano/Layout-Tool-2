import {
    warehouseCtx, rackDetailCtx, elevationCtx,
    warehouseCanvas, rackDetailCanvas, elevationCanvas,
    detailViewToggle, // NEW: Import toggle

    // --- ALL DOM INPUTS REMOVED ---
    
    // --- NEW: Metric Table Imports (MODIFIED) ---
    metricRowStdConfig, metricStdConfigLabel, metricStdConfigLocsLvl, metricStdConfigLevels, metricStdConfigBays, metricStdConfigLocsTotal,
    metricRowStdSingle, metricStdSingleLabel, metricStdSingleLocsLvl, metricStdSingleLevels, metricStdSingleBays, metricStdSingleLocsTotal,
    metricRowBpConfig, metricBpConfigLabel, metricBpConfigLocsLvl, metricBpConfigLevels, metricBpConfigBays, metricBpConfigLocsTotal,
    metricRowTunConfig, metricTunConfigLabel, metricTunConfigLocsLvl, metricTunConfigLevels, metricTunConfigBays, metricTunConfigLocsTotal,
    metricTotBays, metricTotLocsTotal

} from './dom.js';
import { parseNumber, formatNumber } from './utils.js';
import { calculateLayout, calculateElevationLayout } from './calculations.js';
import { getViewState } from './viewState.js'; // <-- ADDED IMPORT

// MODIFIED: drawRack helper function
function drawRack(x_world, rackDepth_world, rackType, params) {
    const {
        ctx, scale, offsetX, offsetY,
        bayDepth, // Note: bayDepth is calculated *config* rack depth
        singleBayDepth, // <<< NEWLY ADDED
        flueSpace,
        usableLength_world, setbackTop_world,
        isDetailView, detailParams, // NEW: Get detail params
        // --- NEW ---
        baysPerRack,
        clearOpening_world,
        totalRackLength_world, // NEW: for layout centering
        layoutOffsetY_world, // NEW: for layout centering
        // MODIFIED: Pass in the sets, not the flags
        tunnelPositions,
        backpackPositions
    } = params;

    // --- NEW ---
    const uprightLength_world = detailParams.uprightLength_world;
    const clearOpening_canvas = clearOpening_world * scale;
    const uprightLength_canvas = uprightLength_world * scale;

    // MODIFIED: Apply layout centering offsets
    const rackX_canvas = offsetX + (x_world * scale);
    const rackY_canvas_start = offsetY + (setbackTop_world * scale) + (layoutOffsetY_world * scale);
    const rackHeight_canvas = totalRackLength_world * scale; // Use total rack length

    if (rackHeight_canvas <= 0) return; // Don't draw if no height

    // --- Tunnel and Backpack Logic is now done in drawWarehouse ---
    // We just *use* the sets passed in params

    // --- NEW: Detail View Logic ---
    if (isDetailView) {
        if (baysPerRack === 0) return; // No bays to draw

        // --- FIX: Determine the correct 'totesDeep' for *this* rack ---
        // Use a small tolerance for floating point comparison
        const isSingleDeepRack = Math.abs(rackDepth_world - singleBayDepth) < 0.01;
        // Use 1 if it's a single-deep rack, otherwise use the config's totesDeep
        const currentTotesDeep = isSingleDeepRack ? 1 : detailParams.totesDeep;

        const bayDetailHelpersParams = {
            ...detailParams, // totesDeep, toteQtyPerBay, etc. (world values)
            totesDeep: currentTotesDeep, // <<< OVERRIDE totesDeep with the correct value
            upLength_c: detailParams.uprightLength_world * scale,
            upWidth_c: detailParams.uprightWidth_world * scale,
            toteWidth_c: detailParams.toteWidth * scale,
            toteLength_c: detailParams.toteLength * scale,
            toteToTote_c: detailParams.toteToToteDist * scale,
            toteToUpright_c: detailParams.toteToUprightDist * scale,
            toteBackToBack_c: detailParams.toteBackToBackDist * scale
        };
        // --- END FIX ---
        
        let currentY_canvas = rackY_canvas_start;

        // Loop `baysPerRack` times
        for (let i = 0; i < baysPerRack; i++) {
            const isFirstBay = (i === 0);
            const isTunnel = tunnelPositions.has(i);
            const isBackpack = !isTunnel && backpackPositions.has(i);
            
            let bayY_canvas, bayDrawWidth_canvas;
            
            if (isFirstBay) {
                // Draw Starter Upright
                bayY_canvas = currentY_canvas;
                bayDrawWidth_canvas = uprightLength_canvas; // The width of the upright
                
                if (rackType === 'single') {
                    // MODIFIED: A single rack's width is rackDepth_world
                    const bay_w_canvas = rackDepth_world * scale; // Horizontal dimension
                    const centerX = rackX_canvas + bay_w_canvas / 2;
                    const centerY = bayY_canvas + bayDrawWidth_canvas / 2;
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate(Math.PI / 2); // 90 degrees
                    ctx.fillStyle = '#64748b';
                    drawStructure(ctx, -bayDrawWidth_canvas / 2, -bay_w_canvas / 2, bayDrawWidth_canvas, bay_w_canvas, scale, bayDetailHelpersParams, 'starter');
                    ctx.restore();
                } else if (rackType === 'double') {
                    // MODIFIED: A double rack's components are bayDepth (config)
                    const rack1_w_canvas = bayDepth * scale;
                    const flue_w_canvas = flueSpace * scale;
                    const rack2_x_canvas = rackX_canvas + rack1_w_canvas + flue_w_canvas;
                    const rack2_w_canvas = bayDepth * scale;

                    // Rack 1 Starter
                    const centerX1 = rackX_canvas + rack1_w_canvas / 2;
                    const centerY1 = bayY_canvas + bayDrawWidth_canvas / 2;
                    ctx.save();
                    ctx.translate(centerX1, centerY1); ctx.rotate(Math.PI / 2);
                    ctx.fillStyle = '#64748b';
                    drawStructure(ctx, -bayDrawWidth_canvas / 2, -rack1_w_canvas / 2, bayDrawWidth_canvas, rack1_w_canvas, scale, bayDetailHelpersParams, 'starter');
                    ctx.restore();
                    // Rack 2 Starter
                    const centerX2 = rack2_x_canvas + rack2_w_canvas / 2;
                    const centerY2 = bayY_canvas + bayDrawWidth_canvas / 2;
                    ctx.save();
                    ctx.translate(centerX2, centerY2); ctx.rotate(Math.PI / 2);
                    ctx.fillStyle = '#64748b';
                    drawStructure(ctx, -bayDrawWidth_canvas / 2, -rack2_w_canvas / 2, bayDrawWidth_canvas, rack2_w_canvas, scale, bayDetailHelpersParams, 'starter');
                    ctx.restore();
                }
                currentY_canvas += bayDrawWidth_canvas; // Move Y past the starter upright
            }
            
            // Now draw the Clear Opening + Right Upright
            bayY_canvas = currentY_canvas;
            bayDrawWidth_canvas = clearOpening_canvas + uprightLength_canvas;
            
            if (rackType === 'single') {
                // MODIFIED: A single rack's width is rackDepth_world
                const bay_w_canvas = rackDepth_world * scale; // Horizontal dimension
                const centerX = rackX_canvas + bay_w_canvas / 2;
                const centerY = bayY_canvas + bayDrawWidth_canvas / 2;

                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(Math.PI / 2); // 90 degrees
                
                ctx.fillStyle = '#64748b';
                drawStructure(ctx, -bayDrawWidth_canvas / 2, -bay_w_canvas / 2, bayDrawWidth_canvas, bay_w_canvas, scale, bayDetailHelpersParams, 'repeater');
                // MODIFIED: Pass tunnel/backpack flags
                drawTotes(ctx, -bayDrawWidth_canvas / 2, -bay_w_canvas / 2, scale, bayDetailHelpersParams, 'repeater', isTunnel, isBackpack);
                
                ctx.restore();

            } else if (rackType === 'double') {
                // MODIFIED: A double rack's components are bayDepth (config)
                const rack1_w_canvas = bayDepth * scale; // bayDepth is single rack depth
                const flue_w_canvas = flueSpace * scale;
                const rack2_x_canvas = rackX_canvas + rack1_w_canvas + flue_w_canvas;
                const rack2_w_canvas = bayDepth * scale;

                // --- Rack 1 (Repeater) ---
                const centerX1 = rackX_canvas + rack1_w_canvas / 2;
                const centerY1 = bayY_canvas + bayDrawWidth_canvas / 2;
                ctx.save();
                ctx.translate(centerX1, centerY1);
                ctx.rotate(Math.PI / 2);
                ctx.fillStyle = '#64748b';
                drawStructure(ctx, -bayDrawWidth_canvas / 2, -rack1_w_canvas / 2, bayDrawWidth_canvas, rack1_w_canvas, scale, bayDetailHelpersParams, 'repeater');
                // MODIFIED: Pass tunnel/backpack flags
                drawTotes(ctx, -bayDrawWidth_canvas / 2, -rack1_w_canvas / 2, scale, bayDetailHelpersParams, 'repeater', isTunnel, isBackpack);
                ctx.restore();

                // --- Rack 2 (Repeater) ---
                const centerX2 = rack2_x_canvas + rack2_w_canvas / 2;
                const centerY2 = bayY_canvas + bayDrawWidth_canvas / 2;
                ctx.save();
                ctx.translate(centerX2, centerY2);
                ctx.rotate(Math.PI / 2);
                ctx.fillStyle = '#64748b';
                drawStructure(ctx, -bayDrawWidth_canvas / 2, -rack2_w_canvas / 2, bayDrawWidth_canvas, rack2_w_canvas, scale, bayDetailHelpersParams, 'repeater');
                // MODIFIED: Pass tunnel/backpack flags
                drawTotes(ctx, -bayDrawWidth_canvas / 2, -rack2_w_canvas / 2, scale, bayDetailHelpersParams, 'repeater', isTunnel, isBackpack);
                ctx.restore();
            }
            
            currentY_canvas += bayDrawWidth_canvas; // Move Y past the bay
        }
    }
    // --- ELSE: Original Simple View ---
    else {
        if (rackType === 'single') {
            const rackWidth_canvas = rackDepth_world * scale;
            
            if (baysPerRack > 0) {
                let currentY_canvas = rackY_canvas_start;
                // Draw first upright
                ctx.fillStyle = '#64748b'; // slate-500
                ctx.fillRect(rackX_canvas, currentY_canvas, rackWidth_canvas, uprightLength_canvas);
                currentY_canvas += uprightLength_canvas;
                
                // Draw repeating bays
                for(let i=0; i < baysPerRack; i++) {
                    const isTunnel = tunnelPositions.has(i);
                    const isBackpack = !isTunnel && backpackPositions.has(i);
                    
                    // MODIFIED: Set fillStyle based on type
                    ctx.fillStyle = isTunnel ? '#fde047' : (isBackpack ? '#a855f7' : '#cbd5e1'); // yellow, purple, or grey
                    ctx.strokeStyle = '#64748b'; // slate-500
                    ctx.lineWidth = 0.5;
                    
                    const bayHeight_canvas = (clearOpening_canvas + uprightLength_canvas);
                    ctx.fillRect(rackX_canvas, currentY_canvas, rackWidth_canvas, bayHeight_canvas);
                    ctx.strokeRect(rackX_canvas, currentY_canvas, rackWidth_canvas, bayHeight_canvas);
                    
                    // Draw line for clear opening
                    ctx.strokeStyle = '#94a3b8'; // slate-400
                    ctx.beginPath();
                    ctx.moveTo(rackX_canvas, currentY_canvas + clearOpening_canvas);
                    ctx.lineTo(rackX_canvas + rackWidth_canvas, currentY_canvas + clearOpening_canvas);
                    ctx.stroke();

                    currentY_canvas += bayHeight_canvas;
                }
            }
            
            // Draw main rack outline
            ctx.strokeStyle = '#64748b'; // slate-500
            ctx.lineWidth = 1;
            ctx.strokeRect(rackX_canvas, rackY_canvas_start, rackWidth_canvas, rackHeight_canvas);

        } else if (rackType === 'double') {
            // MODIFIED: A double rack's components are bayDepth (config)
            const rack1_width_canvas = bayDepth * scale;
            const flue_width_canvas = flueSpace * scale;
            const rack2_width_canvas = bayDepth * scale;
            const rack2_x_canvas = rackX_canvas + rack1_width_canvas + flue_width_canvas;
            
            const repeatingBayUnitWidth_world = clearOpening_world + uprightLength_world;

            // --- Draw Rack 1 ---
            if (baysPerRack > 0) {
                let currentY_canvas = rackY_canvas_start;
                ctx.fillStyle = '#64748b'; // slate-500
                ctx.fillRect(rackX_canvas, currentY_canvas, rack1_width_canvas, uprightLength_canvas);
                currentY_canvas += uprightLength_canvas;

                for(let i=0; i < baysPerRack; i++) {
                    const isTunnel = tunnelPositions.has(i);
                    const isBackpack = !isTunnel && backpackPositions.has(i);
                    
                    ctx.fillStyle = isTunnel ? '#fde047' : (isBackpack ? '#a855f7' : '#cbd5e1'); // yellow, purple, or grey
                    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.5;

                    const bayHeight_canvas = (clearOpening_canvas + uprightLength_canvas);
                    ctx.fillRect(rackX_canvas, currentY_canvas, rack1_width_canvas, bayHeight_canvas);
                    ctx.strokeRect(rackX_canvas, currentY_canvas, rack1_width_canvas, bayHeight_canvas);
                    
                    ctx.strokeStyle = '#94a3b8'; ctx.beginPath();
                    ctx.moveTo(rackX_canvas, currentY_canvas + clearOpening_canvas);
                    ctx.lineTo(rackX_canvas + rack1_width_canvas, currentY_canvas + clearOpening_canvas);
                    ctx.stroke();

                    currentY_canvas += bayHeight_canvas;
                }
            }
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1;
            ctx.strokeRect(rackX_canvas, rackY_canvas_start, rack1_width_canvas, rackHeight_canvas);

            // --- Draw Rack 2 ---
            if (baysPerRack > 0) {
                 let currentY_canvas = rackY_canvas_start;
                ctx.fillStyle = '#64748b'; // slate-500
                ctx.fillRect(rack2_x_canvas, currentY_canvas, rack2_width_canvas, uprightLength_canvas);
                currentY_canvas += uprightLength_canvas;
                
                for(let i=0; i < baysPerRack; i++) {
                    const isTunnel = tunnelPositions.has(i);
                    const isBackpack = !isTunnel && backpackPositions.has(i);

                    ctx.fillStyle = isTunnel ? '#fde047' : (isBackpack ? '#a855f7' : '#cbd5e1'); // yellow, purple, or grey
                    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.5;

                    const bayHeight_canvas = (clearOpening_canvas + uprightLength_canvas);
                    ctx.fillRect(rack2_x_canvas, currentY_canvas, rack2_width_canvas, bayHeight_canvas);
                    ctx.strokeRect(rack2_x_canvas, currentY_canvas, rack2_width_canvas, bayHeight_canvas);

                    ctx.strokeStyle = '#94a3b8'; ctx.beginPath();
                    ctx.moveTo(rack2_x_canvas, currentY_canvas + clearOpening_canvas);
                    ctx.lineTo(rack2_x_canvas + rack2_width_canvas, currentY_canvas + clearOpening_canvas);
                    ctx.stroke();

                    currentY_canvas += bayHeight_canvas;
                }
            }
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1;
            ctx.strokeRect(rack2_x_canvas, rackY_canvas_start, rack2_width_canvas, rackHeight_canvas);
        }
    }
}

// ... (drawDimensions helper - no changes) ...
function drawDimensions(ctx, x1, y1, drawWidth, drawHeight, sysWidth_label, sysLength_label, zoomScale = 1) {
    const extensionLength = 20 / zoomScale;
    const textPadding = 10 / zoomScale;

    ctx.strokeStyle = '#64748b'; // slate-500
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.lineWidth = 1 / zoomScale; // Adjust line width for zoom
    ctx.font = `${12 / zoomScale}px Inter, sans-serif`; // Adjust font size for zoom
    ctx.textBaseline = 'middle';

    // --- Horizontal (System Width) ---
    const y = y1 - extensionLength - textPadding;
    ctx.beginPath();
    ctx.moveTo(x1, y); ctx.lineTo(x1 + drawWidth, y); // Main line
    ctx.moveTo(x1, y - 5); ctx.lineTo(x1, y + 5); // Left tick
    ctx.moveTo(x1 + drawWidth, y - 5); ctx.lineTo(x1 + drawWidth, y + 5); // Right tick
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(sysWidth_label).toLocaleString('en-US')} mm`, x1 + drawWidth / 2, y - textPadding);

    // --- Vertical (System Length) ---
    const x = x1 - extensionLength - textPadding;
    ctx.beginPath();
    ctx.moveTo(x, y1); ctx.lineTo(x, y1 + drawHeight); // Main line
    ctx.moveTo(x - 5, y1); ctx.lineTo(x + 5, y1); // Top tick
    ctx.moveTo(x - 5, y1 + drawHeight); ctx.lineTo(x + 5, y1 + drawHeight); // Bottom tick
    ctx.stroke();

    // Rotated text
    ctx.save();
    ctx.translate(x - textPadding, y1 + drawHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(sysLength_label).toLocaleString('en-US')} mm`, 0, 0);
    ctx.restore();
}

// --- NEW: Helper for Elevation Dimensions ---
function drawVerticalDimension(ctx, x, y1_c, y2_c, label, zoomScale = 1) {
    const textPadding = 10 / zoomScale;
    const tickSize = 5 / zoomScale;

    ctx.strokeStyle = '#64748b'; // slate-500
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.lineWidth = 1 / zoomScale;
    ctx.font = `${10 / zoomScale}px Inter, sans-serif`;
    ctx.textBaseline = 'middle';

    // Draw main vertical line
    ctx.beginPath();
    ctx.moveTo(x, y1_c);
    ctx.lineTo(x, y2_c);
    // Top tick
    ctx.moveTo(x - tickSize, y1_c);
    ctx.lineTo(x + tickSize, y1_c);
    // Bottom tick
    ctx.moveTo(x - tickSize, y2_c);
    ctx.lineTo(x + tickSize, y2_c);
    ctx.stroke();

    // Draw rotated text
    ctx.save();
    ctx.translate(x - textPadding, (y1_c + y2_c) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
}


// --- MODIFIED: Main Drawing Function (Top-Down) ---
// REQ 3: This function now receives the global inputs and config object
export function drawWarehouse(sysLength, sysWidth, sysHeight, config) {
    // ... (canvas setup - no changes) ...
    const dpr = window.devicePixelRatio || 1;

    // --- FIX: Read client dimensions ONCE ---
    const canvasWidth = warehouseCanvas.clientWidth;
    const canvasHeight = warehouseCanvas.clientHeight;

    // Prevent drawing if canvas is not visible
    if (canvasWidth === 0 || canvasHeight === 0) {
        return;
    }

    warehouseCanvas.width = canvasWidth * dpr;
    warehouseCanvas.height = canvasHeight * dpr;

    // Reset the transformation matrix to identity
    warehouseCtx.setTransform(1, 0, 0, 1, 0, 0);

    // Now apply the clean scale for HiDPI
    warehouseCtx.scale(dpr, dpr);

    warehouseCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Get the current zoom/pan state
    const state = getViewState(warehouseCanvas); // <-- THIS WILL NOW WORK

    // Apply zoom and pan transformations
    warehouseCtx.translate(state.offsetX, state.offsetY);
    warehouseCtx.scale(state.scale, state.scale);

    // --- REQ 3: Get Values & Calculate Bay Dimensions (Using NEW Logic) ---
    // Get values from the passed-in config object
    // Return early if no config is provided (e.g., on init)
    if (!config) {
        console.warn("drawWarehouse called with no config.");
        // NEW: Clear table if no config
        metricStdConfigLocsLvl.textContent = '0';
        metricStdConfigLevels.textContent = '0';
        metricStdConfigBays.textContent = '0';
        metricStdConfigLocsTotal.textContent = '0';
        metricStdSingleLocsLvl.textContent = '0';
        metricStdSingleLevels.textContent = '0';
        metricStdSingleBays.textContent = '0';
        metricStdSingleLocsTotal.textContent = '0';
        metricBpConfigLocsLvl.textContent = '0';
        metricBpConfigLevels.textContent = '0';
        metricBpConfigBays.textContent = '0';
        metricBpConfigLocsTotal.textContent = '0';
        metricTunConfigLocsLvl.textContent = '0';
        metricTunConfigLevels.textContent = '0';
        metricTunConfigBays.textContent = '0';
        metricTunConfigLocsTotal.textContent = '0';
        metricTotBays.textContent = '0';
        metricTotLocsTotal.textContent = '0';
        
        // Hide all rows
        metricRowStdConfig.style.display = 'none';
        metricRowStdSingle.style.display = 'none';
        metricRowBpConfig.style.display = 'none';
        metricRowTunConfig.style.display = 'none';
        return;
    }
    
    const toteWidth = config['tote-width'] || 0;
    const toteLength = config['tote-length'] || 0;
    const toteQtyPerBay = config['tote-qty-per-bay'] || 1;
    const totesDeep = config['totes-deep'] || 1; // This is config totes-deep
    const toteToToteDist = config['tote-to-tote-dist'] || 0;
    const toteToUprightDist = config['tote-to-upright-dist'] || 0;
    const toteBackToBackDist = config['tote-back-to-back-dist'] || 0;
    const uprightLength = config['upright-length'] || 0;
    const uprightWidth = config['upright-width'] || 0;
    const hookAllowance = config['hook-allowance'] || 0;
    const aisleWidth = config['aisle-width'] || 0;
    const flueSpace = config['rack-flue-space'] || 0; // MODIFIED: Get from config

    // MODIFIED: Get layout values from CONFIG, not global DOM
    const setbackTop = config['top-setback'] || 0;
    const setbackBottom = config['bottom-setback'] || 0;
    // NEW: Get left/right setbacks
    const setbackLeft = config['setback-left'] || 0;
    const setbackRight = config['setback-right'] || 0;
    const layoutMode = config['layout-mode'] || 's-d-s';
    // NEW: Get tunnel/backpack flags
    const considerTunnels = config['considerTunnels'] || false;
    const considerBackpacks = config['considerBackpacks'] || false;
    
    // Get global values (not part of config)
    const isDetailView = detailViewToggle.checked;

    // --- MODIFIED: Bay Width (horizontal) ---
    // This is now the clear opening.
    const clearOpening = (toteQtyPerBay * toteLength) +
        (2 * toteToUprightDist) +
        (Math.max(0, toteQtyPerBay - 1) * toteToToteDist);

    // --- Bay Depth (vertical) for a SINGLE rack ---
    // MODIFIED: Calculate both depths
    const configBayDepth = (totesDeep * toteWidth) +
        (Math.max(0, totesDeep - 1) * toteBackToBackDist) +
        hookAllowance;
        
    const singleBayDepth = (1 * toteWidth) +
        (Math.max(0, 1 - 1) * toteBackToBackDist) +
        hookAllowance;

    // --- Run Layout Calculation ---
    // MODIFIED: Call calculateLayout with new params
    const layout = calculateLayout(configBayDepth, singleBayDepth, aisleWidth, sysLength, sysWidth, layoutMode, flueSpace, setbackTop, setbackBottom, setbackLeft, setbackRight, uprightLength, clearOpening, considerTunnels);

    // --- Calculate Scaling and Centering for the content itself (independent of zoom/pan) ---
    const contentPadding = 80; // Generous padding for dimensions
    
    const contentScaleX = (canvasWidth - contentPadding * 2) / sysWidth;
    const contentScaleY = (canvasHeight - contentPadding * 2) / sysLength;
    const contentScale = Math.min(contentScaleX, contentScaleY);

    if (contentScale <= 0 || !isFinite(contentScale)) return;

    const drawWidth = sysWidth * contentScale;
    const drawHeight = sysLength * contentScale;

    const drawOffsetX = (canvasWidth - drawWidth) / 2;
    const drawOffsetY = (canvasHeight - drawHeight) / 2;

    // --- NEW: Calculate Centering for the *Layout* ---
    const usableWidth_world = sysWidth - setbackLeft - setbackRight;
    const layoutOffsetX_world = (usableWidth_world - layout.totalLayoutWidth) / 2;
    // NEW: Vertical centering for layout
    const layoutOffsetY_world = (layout.usableLength - layout.totalRackLength_world) / 2;

    // Final offset for drawing elements (relative to the transformed canvas)
    // MODIFIED: offsetX now accounts for left setback and centering
    const offsetX = drawOffsetX + (setbackLeft * contentScale) + (layoutOffsetX_world * contentScale);
    const offsetY = drawOffsetY;
    
    // --- NEW: Create detail params object (world values) ---
    const detailParams = {
        toteWidth, toteLength, toteToToteDist, toteToUprightDist, toteBackToBackDist,
        toteQtyPerBay, totesDeep,
        uprightLength_world: uprightLength,
        uprightWidth_world: uprightWidth, // Used by rack detail
        hookAllowance_world: hookAllowance // Used by rack detail
    };

    // --- NEW: Generate Tunnel/Backpack Sets ---
    // This logic is moved from drawRack to here
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
        const boundaries = [0, ...tunnelIndices, layout.baysPerRack]; // Use baysPerRack as the end
        
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
    // --- End Generate Sets ---


    // MODIFIED: Pass new params to drawParams
    const drawParams = {
        ctx: warehouseCtx, scale: contentScale, offsetX, offsetY, // Use contentScale here
        bayDepth: configBayDepth, // Pass calculated *config* rack depth
        singleBayDepth: singleBayDepth, // <<< ADD THIS
        flueSpace, sysLength,
        usableLength_world: layout.usableLength,
        totalRackLength_world: layout.totalRackLength_world, // NEW
        layoutOffsetY_world: layoutOffsetY_world, // NEW
        setbackTop_world: setbackTop,
        isDetailView: isDetailView, // NEW
        detailParams: detailParams, // NEW
        baysPerRack: layout.baysPerRack, // NEW
        clearOpening_world: layout.clearOpening, // NEW
        tunnelPositions: tunnelPositions, // NEW
        backpackPositions: backpackPositions // NEW
    };
    
    // ... (Drawing logic - no changes) ...
    warehouseCtx.fillStyle = '#f8fafc'; // slate-50
    warehouseCtx.strokeStyle = '#64748b'; // slate-500
    warehouseCtx.lineWidth = 2 / state.scale; // Adjust line width for zoom
    warehouseCtx.fillRect(drawOffsetX, drawOffsetY, drawWidth, drawHeight);
    warehouseCtx.strokeRect(drawOffsetX, drawOffsetY, drawWidth, drawHeight);

    // Draw layout items (racks and aisles)
    layout.layoutItems.forEach(item => {
        if (item.type === 'rack') {
            // drawRack 'rackDepth_world' param is item.width
            drawRack(item.x, item.width, item.rackType, drawParams);
        }
        // We don't visually draw aisles, they are the empty space
    });

    // Draw Top and Bottom Setbacks
    if (setbackTop > 0) {
        warehouseCtx.fillStyle = 'rgba(239, 68, 68, 0.1)'; // red-500 with 10% opacity
        warehouseCtx.fillRect(drawOffsetX, drawOffsetY, drawWidth, setbackTop * contentScale);
        warehouseCtx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        warehouseCtx.setLineDash([5 / state.scale, 5 / state.scale]); // Adjust line dash for zoom
        warehouseCtx.strokeRect(drawOffsetX, drawOffsetY, drawWidth, setbackTop * contentScale);
        warehouseCtx.setLineDash([]);
    }
    if (setbackBottom > 0) {
        const setbackY_canvas = drawOffsetY + (sysLength - setbackBottom) * contentScale;
        warehouseCtx.fillStyle = 'rgba(239, 68, 68, 0.1)'; // red-500 with 10% opacity
        warehouseCtx.fillRect(drawOffsetX, setbackY_canvas, drawWidth, setbackBottom * contentScale);
        warehouseCtx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        warehouseCtx.setLineDash([5 / state.scale, 5 / state.scale]); // Adjust line dash for zoom
        warehouseCtx.strokeRect(drawOffsetX, setbackY_canvas, drawWidth, setbackBottom * contentScale);
        warehouseCtx.setLineDash([]);
    }
    
    // NEW: Draw Left/Right Setbacks
    if (setbackLeft > 0) {
        warehouseCtx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        warehouseCtx.fillRect(drawOffsetX, drawOffsetY, setbackLeft * contentScale, drawHeight);
        warehouseCtx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        warehouseCtx.setLineDash([5 / state.scale, 5 / state.scale]);
        warehouseCtx.strokeRect(drawOffsetX, drawOffsetY, setbackLeft * contentScale, drawHeight);
        warehouseCtx.setLineDash([]);
    }
    if (setbackRight > 0) {
        const setbackX_canvas = drawOffsetX + (sysWidth - setbackRight) * contentScale;
        warehouseCtx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        warehouseCtx.fillRect(setbackX_canvas, drawOffsetY, setbackRight * contentScale, drawHeight);
        warehouseCtx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        warehouseCtx.setLineDash([5 / state.scale, 5 / state.scale]);
        warehouseCtx.strokeRect(setbackX_canvas, drawOffsetY, setbackRight * contentScale, drawHeight);
        warehouseCtx.setLineDash([]);
    }


    // --- NEW: Helper functions for Setback/Usable Dimensions ---
    const drawHorizontalDimLine = (ctx, x, y, width, label, zoomScale) => {
        const tickSize = 5 / zoomScale;
        const textPadding = 8 / zoomScale;
        ctx.strokeStyle = '#059669'; // emerald-600
        ctx.fillStyle = '#059669';
        ctx.lineWidth = 1 / zoomScale;
        ctx.font = `${10 / zoomScale}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + width, y); // Main line
        ctx.moveTo(x, y - tickSize); ctx.lineTo(x, y + tickSize); // Left tick
        ctx.moveTo(x + width, y - tickSize); ctx.lineTo(x + width, y + tickSize); // Right tick
        ctx.stroke();
        ctx.fillText(label, x + width / 2, y - textPadding);
    };
    
    const drawVerticalDimLine = (ctx, x, y, height, label, zoomScale) => {
        const tickSize = 5 / zoomScale;
        const textPadding = 8 / zoomScale;
        ctx.strokeStyle = '#059669'; // emerald-600
        ctx.fillStyle = '#059669';
        ctx.lineWidth = 1 / zoomScale;
        ctx.font = `${10 / zoomScale}px Inter, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x, y + height); // Main line
        ctx.moveTo(x - tickSize, y); ctx.lineTo(x + tickSize, y); // Top tick
        ctx.moveTo(x - tickSize, y + height); ctx.lineTo(x + tickSize, y + height); // Bottom tick
        ctx.stroke();
        
        ctx.save();
        ctx.translate(x + textPadding, y + height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(label, 0, 0);
        ctx.restore();
    };

    // --- Draw Setback & Usable Dims ---
    const dimLineX = drawOffsetX + drawWidth + (20 / state.scale); // Right side
    
    if (setbackTop > 0) {
        drawVerticalDimLine(warehouseCtx, dimLineX, drawOffsetY, setbackTop * contentScale, `Top Setback: ${formatNumber(setbackTop)}`, state.scale);
    }
    
    drawVerticalDimLine(warehouseCtx, dimLineX, drawOffsetY + (setbackTop * contentScale), layout.usableLength * contentScale, `Usable Length: ${formatNumber(layout.usableLength)}`, state.scale);

    if (setbackBottom > 0) {
        drawVerticalDimLine(warehouseCtx, dimLineX, drawOffsetY + (setbackTop * contentScale) + (layout.usableLength * contentScale), setbackBottom * contentScale, `Bottom Setback: ${formatNumber(setbackBottom)}`, state.scale);
    }
    // --- END: Setback Dims ---


    // Draw (original) dimension lines
    drawDimensions(warehouseCtx, drawOffsetX, drawOffsetY, drawWidth, drawHeight, sysWidth, sysLength, state.scale); // Pass state.scale
    
    // --- NEW: Update Metrics Table ---
    try {
        // 1. Get Vertical Levels (using existing elevation calc)
        const coreElevationInputs = {
            WH: sysHeight,
            BaseHeight: config['base-beam-height'] || 0,
            BW: config['beam-width'] || 0,
            TH: config['tote-height'] || 0,
            MC: config['min-clearance'] || 0,
            OC: config['overhead-clearance'] || 0,
            SC: config['sprinkler-clearance'] || 0,
            ST: config['sprinkler-threshold'] || 0,
            // Dummy values
            UW_front: 0, NT_front: 0, TW_front: 0, TTD_front: 0, TUD_front: 0,
            UW_side: 0, TotesDeep: 0, ToteDepth: 0, ToteDepthGap: 0, HookAllowance: 0,
        };
        const verticalLayout = calculateElevationLayout(coreElevationInputs, false); // false = max capacity
        const verticalLevels = verticalLayout ? verticalLayout.N : 0;
        
        // 2. Calculate locations per level
        const configTotesDeep = config['totes-deep'] || 1;
        const singleTotesDeep = 1;
        const locationsPerConfigLevel = toteQtyPerBay * configTotesDeep;
        const locationsPerSingleLevel = toteQtyPerBay * singleTotesDeep;

        // 3. Define levels per bay type
        const standardLevels = verticalLevels;
        const backpackLevels = verticalLevels;
        const tunnelLevels = 5; // Hardcoded

        // 4. Calculate total number of bays for each type
        const numTunnelBaysPerRow = tunnelPositions.size;
        const numBackpackBaysPerRow = backpackPositions.size;
        // Storage bays per row
        const numStorageBaysPerRow = layout.baysPerRack - numTunnelBaysPerRow;
        // Standard bays = storage bays - backpack bays
        const numStandardBaysPerRow = numStorageBaysPerRow - numBackpackBaysPerRow;

        let totalStandardBays_Config = 0;
        let totalStandardBays_Single = 0;
        let totalBackpackBays_Config = 0;
        let totalBackpackBays_Single = 0; // Likely 0
        let totalTunnelBays_Config = 0;
        let totalTunnelBays_Single = 0; // Likely 0

        if (layoutMode === 'all-singles') {
            // We need to check the width of each rack row
            for (const item of layout.layoutItems) {
                if (item.type !== 'rack') continue;
                
                // Use a tolerance for float comparison
                const isSingleDeep = Math.abs(item.width - singleBayDepth) < 0.01;
                
                if (isSingleDeep) {
                    totalStandardBays_Single += numStandardBaysPerRow;
                    totalBackpackBays_Single += numBackpackBaysPerRow; // (unlikely)
                    totalTunnelBays_Single += numTunnelBaysPerRow;     // (unlikely)
                } else {
                    // It's config-deep
                    totalStandardBays_Config += numStandardBaysPerRow;
                    totalBackpackBays_Config += numBackpackBaysPerRow;
                    totalTunnelBays_Config += numTunnelBaysPerRow;
                }
            }
        } else { // s-d-s mode
            // All rows are config-deep (or double-config-deep)
            const numRows = layout.layoutItems.reduce((acc, item) => {
                if (item.type !== 'rack') return acc;
                return acc + (item.rackType === 'double' ? 2 : 1);
            }, 0);
            
            totalStandardBays_Config = numStandardBaysPerRow * numRows;
            totalBackpackBays_Config = numBackpackBaysPerRow * numRows;
            totalTunnelBays_Config = numTunnelBaysPerRow * numRows;
        }
        
        // 5. Calculate total locations for each type
        const totalLocationsStd_Config = locationsPerConfigLevel * standardLevels * totalStandardBays_Config;
        const totalLocationsStd_Single = locationsPerSingleLevel * standardLevels * totalStandardBays_Single;
        
        const totalLocationsBp_Config = locationsPerConfigLevel * backpackLevels * totalBackpackBays_Config;
        const totalLocationsBp_Single = locationsPerSingleLevel * backpackLevels * totalBackpackBays_Single;
        
        const totalLocationsTun_Config = locationsPerConfigLevel * tunnelLevels * totalTunnelBays_Config;
        const totalLocationsTun_Single = locationsPerSingleLevel * tunnelLevels * totalTunnelBays_Single;
        
        // 6. Calculate grand totals
        const grandTotalBays = totalStandardBays_Config + totalStandardBays_Single + totalBackpackBays_Config + totalBackpackBays_Single + totalTunnelBays_Config + totalTunnelBays_Single;
        const grandTotalLocations = totalLocationsStd_Config + totalLocationsStd_Single + totalLocationsBp_Config + totalLocationsBp_Single + totalLocationsTun_Config + totalLocationsTun_Single;
        
        // 7. Update table
        
        // --- Row Labels ---
        const stdConfigLabelText = `Standard ${toteQtyPerBay}x${configTotesDeep}x${standardLevels}`;
        const stdSingleLabelText = `Standard ${toteQtyPerBay}x1x${standardLevels}`;
        const bpConfigLabelText = `Backpack ${toteQtyPerBay}x${configTotesDeep}x${backpackLevels}`;
        const tunConfigLabelText = `Tunnel ${toteQtyPerBay}x${configTotesDeep}x${tunnelLevels}`;
        
        // --- Update Table Content ---
        
        // Standard (Config) Row
        if (totalStandardBays_Config > 0) {
            metricRowStdConfig.style.display = ''; // Show row
            metricStdConfigLabel.textContent = stdConfigLabelText;
            metricStdConfigLocsLvl.textContent = formatNumber(locationsPerConfigLevel);
            metricStdConfigLevels.textContent = formatNumber(standardLevels);
            metricStdConfigBays.textContent = formatNumber(totalStandardBays_Config);
            metricStdConfigLocsTotal.textContent = formatNumber(totalLocationsStd_Config);
        } else {
            metricRowStdConfig.style.display = 'none'; // Hide row
        }
        
        // Standard (Single) Row
        if (totalStandardBays_Single > 0) {
            metricRowStdSingle.style.display = ''; // Show row
            metricStdSingleLabel.textContent = stdSingleLabelText;
            metricStdSingleLocsLvl.textContent = formatNumber(locationsPerSingleLevel);
            metricStdSingleLevels.textContent = formatNumber(standardLevels);
            metricStdSingleBays.textContent = formatNumber(totalStandardBays_Single);
            metricStdSingleLocsTotal.textContent = formatNumber(totalLocationsStd_Single);
        } else {
            metricRowStdSingle.style.display = 'none'; // Hide row
        }

        // Backpack Row (only config-deep is supported for now)
        if (totalBackpackBays_Config > 0) {
            metricRowBpConfig.style.display = ''; // Show row
            metricBpConfigLabel.textContent = bpConfigLabelText;
            metricBpConfigLocsLvl.textContent = formatNumber(locationsPerConfigLevel);
            metricBpConfigLevels.textContent = formatNumber(backpackLevels);
            metricBpConfigBays.textContent = formatNumber(totalBackpackBays_Config);
            metricBpConfigLocsTotal.textContent = formatNumber(totalLocationsBp_Config);
        } else {
            metricRowBpConfig.style.display = 'none'; // Hide row
        }
        
        // Tunnel Row (only config-deep is supported for now)
        if (totalTunnelBays_Config > 0) {
            metricRowTunConfig.style.display = ''; // Show row
            metricTunConfigLabel.textContent = tunConfigLabelText;
            metricTunConfigLocsLvl.textContent = formatNumber(locationsPerConfigLevel);
            metricTunConfigLevels.textContent = formatNumber(tunnelLevels);
            metricTunConfigBays.textContent = formatNumber(totalTunnelBays_Config);
            metricTunConfigLocsTotal.textContent = formatNumber(totalLocationsTun_Config);
        } else {
            metricRowTunConfig.style.display = 'none'; // Hide row
        }

        // Total Row (always visible)
        metricTotBays.textContent = formatNumber(grandTotalBays);
        metricTotLocsTotal.textContent = formatNumber(grandTotalLocations);

    } catch (e) {
        console.error("Error updating metrics table:", e);
        // Clear table on error
        metricStdConfigLocsLvl.textContent = 'Err';
        metricStdConfigLevels.textContent = 'Err';
        metricStdConfigBays.textContent = 'Err';
        metricStdConfigLocsTotal.textContent = 'Err';
        metricStdSingleLocsLvl.textContent = 'Err';
        metricStdSingleLevels.textContent = 'Err';
        metricStdSingleBays.textContent = 'Err';
        metricStdSingleLocsTotal.textContent = 'Err';
        metricBpConfigLocsLvl.textContent = 'Err';
        metricBpConfigLevels.textContent = 'Err';
        metricBpConfigBays.textContent = 'Err';
        metricBpConfigLocsTotal.textContent = 'Err';
        metricTunConfigLocsLvl.textContent = 'Err';
        metricTunConfigLevels.textContent = 'Err';
        metricTunConfigBays.textContent = 'Err';
        metricTunConfigLocsTotal.textContent = 'Err';
        metricTotBays.textContent = 'Err';
        metricTotLocsTotal.textContent = 'Err';
        
        // Hide all rows
        metricRowStdConfig.style.display = 'none';
        metricRowStdSingle.style.display = 'none';
        metricRowBpConfig.style.display = 'none';
        metricRowTunConfig.style.display = 'none';
    }
}

// ... (drawStructure helper - no changes) ...
// MODIFIED: drawStructure helper
// Takes a bayType: 'full' (2 uprights), 'starter' (left upright), 'repeater' (right upright)
function drawStructure(ctx, offsetX, offsetY, drawWidth, drawHeight, scale, params, bayType = 'full') {
    const { upLength_c, upWidth_c, uprightLength_world } = params;

    ctx.fillStyle = '#64748b'; // slate-500

    // --- Draw Uprights (conditionally) ---
    
    // Draw LEFT upright if 'full' or 'starter'
    if (bayType === 'full' || bayType === 'starter') {
        // Top-left
        ctx.fillRect(offsetX, offsetY, upLength_c, upWidth_c);
        // Bottom-left
        ctx.fillRect(offsetX, offsetY + drawHeight - upWidth_c, upLength_c, upWidth_c);
    }
    
    // Draw RIGHT upright if 'full' or 'repeater'
    if (bayType === 'full' || bayType === 'repeater') {
         // Top-right
        ctx.fillRect(offsetX + drawWidth - upLength_c, offsetY, upLength_c, upWidth_c);
        // Bottom-right
        ctx.fillRect(offsetX + drawWidth - upLength_c, offsetY + drawHeight - upWidth_c, upLength_c, upWidth_c);
    }


    // --- Draw Upright C-Channels (lines on top of filled uprights) ---
    // Only draw if scale is large enough to see
    if (upLength_c > 10) {
        ctx.strokeStyle = '#64748b'; // slate-500
        ctx.lineWidth = 2;

        // Calculate offsets for two lines, centered in the upright
        const lineGap_world = 65;
        const margin_world = (uprightLength_world - lineGap_world) / 2;

        const line1_offset_c = margin_world * scale;
        const line2_offset_c = (margin_world + lineGap_world) * scale;

        // --- Left upright C-Channel ---
        if (bayType === 'full' || bayType === 'starter') {
            const leftLine1_x = offsetX + line1_offset_c;
            const leftLine2_x = offsetX + line2_offset_c;

            ctx.beginPath();
            // Top cap
            ctx.moveTo(leftLine1_x, offsetY);
            ctx.lineTo(leftLine2_x, offsetY);
            // Bottom cap
            ctx.moveTo(leftLine1_x, offsetY + drawHeight);
            ctx.lineTo(leftLine2_x, offsetY + drawHeight);
            // Vertical web 1
            ctx.moveTo(leftLine1_x, offsetY);
            ctx.lineTo(leftLine1_x, offsetY + drawHeight);
            // Vertical web 2
            ctx.moveTo(leftLine2_x, offsetY);
            ctx.lineTo(leftLine2_x, offsetY + drawHeight);
            ctx.stroke();
        }


        // --- Right upright C-Channel ---
        if (bayType === 'full' || bayType === 'repeater') {
            const rightUprightX_c = offsetX + drawWidth - upLength_c;
            const rightLine1_x = rightUprightX_c + line1_offset_c;
            const rightLine2_x = rightUprightX_c + line2_offset_c;

            ctx.beginPath();
            // Top cap
            ctx.moveTo(rightLine1_x, offsetY);
            ctx.lineTo(rightLine2_x, offsetY);
            // Bottom cap
            ctx.moveTo(rightLine1_x, offsetY + drawHeight);
            ctx.lineTo(rightLine2_x, offsetY + drawHeight);
            // Vertical web 1
            ctx.moveTo(rightLine1_x, offsetY);
            ctx.lineTo(rightLine1_x, offsetY + drawHeight);
            // Vertical web 2
            ctx.moveTo(rightLine2_x, offsetY);
            ctx.lineTo(rightLine2_x, offsetY + drawHeight);
            ctx.stroke();
        }
    }

    // --- Draw Horizontal Beams ---
    const beamGap_world = 40;
    const beamGap_c = beamGap_world * scale;
    
    // MODIFIED: beam_x1 depends on bayType
    const beam_x1 = (bayType === 'full' || bayType === 'starter') ? (offsetX + upLength_c) : offsetX; // Inner edge of left upright (or edge)
    const beam_x2 = (bayType === 'full' || bayType === 'repeater') ? (offsetX + drawWidth - upLength_c) : (offsetX + drawWidth); // Inner edge of right upright (or edge)


    if (beamGap_c > 1) { // Only draw if visible
        // *** FIX: Explicitly set stroke style and width before drawing beams ***
        ctx.strokeStyle = '#64748b'; // slate-500
        ctx.lineWidth = 1;
        // *** END FIX ***

        ctx.beginPath();
        // Top beam (flush to top edge)
        const top_y1 = offsetY;
        const top_y2 = offsetY + beamGap_c;
        ctx.moveTo(beam_x1, top_y1);
        ctx.lineTo(beam_x2, top_y1);
        ctx.moveTo(beam_x1, top_y2);
        ctx.lineTo(beam_x2, top_y2);

        // Bottom beam (flush to bottom edge)
        const bottom_y1 = offsetY + drawHeight - beamGap_c;
        const bottom_y2 = offsetY + drawHeight;
        ctx.moveTo(beam_x1, bottom_y1);
        ctx.lineTo(beam_x2, bottom_y1);
        ctx.moveTo(beam_x1, bottom_y2);
        ctx.lineTo(beam_x2, bottom_y2);

        ctx.stroke();
    }
}

// ... (drawTotes helper - no changes) ...
// MODIFIED: drawTotes helper
// Takes a bayType: 'full' (2 uprights), 'repeater' (no left upright)
// NEW: Takes isTunnel and isBackpack flags
function drawTotes(ctx, offsetX, offsetY, scale, params, bayType = 'full', isTunnel = false, isBackpack = false) {
    const {
        totesDeep, toteQtyPerBay,
        toteWidth_c, toteLength_c,
        toteToTote_c, toteToUpright_c, toteBackToBack_c,
        upLength_c
    } = params;

    // MODIFIED: Set colors based on flags
    ctx.fillStyle = isTunnel ? '#fde047' : (isBackpack ? '#d8b4fe' : '#adcce2'); // yellow-300, purple-200, or blue
    ctx.strokeStyle = isTunnel ? '#ca8a04' : (isBackpack ? '#9333ea' : '#6495ed'); // yellow-600, purple-600, or blue
    ctx.lineWidth = 1;

    let current_y_canvas = offsetY; // Start from very top edge
    for (let j = 0; j < totesDeep; j++) {
        // REQ 3: FIX: Add toteBackToBack_c to vertical (Y) offset
        if (j > 0) {
            current_y_canvas += toteBackToBack_c;
        }
        
        // MODIFIED: current_x_canvas depends on bayType
        let current_x_canvas = (bayType === 'full') 
            ? (offsetX + upLength_c + toteToUpright_c) // Offset by upright + toteToUpright
            : (offsetX + toteToUpright_c); // Offset by just toteToUpright
            
        for (let i = 0; i < toteQtyPerBay; i++) {
            // Draw with (width = toteLength_c, height = toteWidth_c)
            ctx.fillRect(current_x_canvas, current_y_canvas, toteLength_c, toteWidth_c);
            ctx.strokeRect(current_x_canvas, current_y_canvas, toteLength_c, toteWidth_c);
            // Increment x by horizontal tote dimension (toteLength_c)
            current_x_canvas += toteLength_c + toteToTote_c;
        }
        // Increment y by vertical tote dimension (toteWidth_c)
        current_y_canvas += toteWidth_c;
    }
}

// ... (drawDetailDimensions helper - no changes) ...
function drawDetailDimensions(ctx, offsetX, offsetY, scale, params) {
    const {
        toteWidth, toteLength, toteToToteDist, toteToUprightDist,
        toteQtyPerBay, totesDeep,
        toteWidth_c, toteLength_c, toteToTote_c, toteToUpright_c,
        upLength_c
    } = params;

    // --- FIX: Declare vars at function scope ---
    let x1, x2, x1_tote, x2_tote, x1_gap, x2_gap;

    ctx.strokeStyle = '#ec4899'; // pink-500
    ctx.fillStyle = '#ec4899';
    ctx.lineWidth = 1;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';

    // --- Draw Horizontal Detail Dims (Tote-Upright, Tote, Tote-Tote) ---
    if (toteQtyPerBay > 0) {
        const y = offsetY + (toteWidth_c / 2); // Y-level for horizontal dims
        let current_x = offsetX + upLength_c;

        // 1. Tote-to-Upright
        if (toteToUprightDist > 0) {
            x1 = current_x; // Use assignment
            x2 = current_x + toteToUpright_c; // Use assignment
            ctx.beginPath();
            ctx.moveTo(x1, y - 5); ctx.lineTo(x1, y + 5); // tick 1
            ctx.moveTo(x2, y - 5); ctx.lineTo(x2, y + 5); // tick 2
            ctx.moveTo(x1, y); ctx.lineTo(x2, y); // line
            ctx.stroke();
            ctx.fillText(`${toteToUprightDist}`, (x1 + x2) / 2, y - 10);
            current_x = x2;
        }

        // 2. Tote Length (First Tote)
        x1_tote = current_x; // Use assignment
        x2_tote = current_x + toteLength_c; // Use assignment
        ctx.beginPath();
        ctx.moveTo(x1_tote, y - 5); ctx.lineTo(x1_tote, y + 5); // tick 1
        ctx.moveTo(x2_tote, y - 5); ctx.lineTo(x2_tote, y + 5); // tick 2
        ctx.moveTo(x1_tote, y); ctx.lineTo(x2_tote, y); // line
        ctx.stroke();
        ctx.fillText(`${toteLength}`, (x1_tote + x2_tote) / 2, y - 10);
        current_x = x2_tote;

        // 3. Tote-to-Tote (First Gap)
        if (toteQtyPerBay > 1 && toteToToteDist > 0) {
            x1_gap = current_x; // Use assignment
            x2_gap = current_x + toteToTote_c; // Use assignment
            ctx.beginPath();
            ctx.moveTo(x1_gap, y - 5); ctx.lineTo(x1_gap, y + 5); // tick 1
            ctx.moveTo(x2_gap, y - 5); ctx.lineTo(x2_gap, y + 5); // tick 2
            ctx.moveTo(x1_gap, y); ctx.lineTo(x2_gap, y); // line
            ctx.stroke();
            ctx.fillText(`${toteToToteDist}`, (x1_gap + x2_gap) / 2, y - 10);
        }
    }

    // --- Draw Vertical Detail Dim (Tote Width) ---
    if (totesDeep > 0) {
        // x position is just to the right of the first tote
        const x = offsetX + upLength_c + toteToUpright_c + toteLength_c + 15; // Offset from right edge of tote
        const y1 = offsetY; // y1 is the top edge of the first tote
        const y2 = y1 + toteWidth_c; // y2 is y1 + vertical tote dimension

        ctx.textBaseline = 'middle';

        ctx.beginPath();
        ctx.moveTo(x - 5, y1); ctx.lineTo(x + 5, y1); // tick 1
        ctx.moveTo(x - 5, y2); ctx.lineTo(x + 5, y2); // tick 2
        ctx.moveTo(x, y1); ctx.lineTo(x, y2); // line
        ctx.stroke();

        ctx.save();
        ctx.translate(x + 10, (y1 + y2) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(`${toteWidth} mm`, 0, 0);
        ctx.restore();
    }
}

// --- MODIFIED: Main Drawing Function (Rack Detail) ---
// REQ 3: This function now receives the global inputs and config object
export function drawRackDetail(sysLength, sysWidth, sysHeight, config) {
    // ... (canvas setup - no changes) ...
    const dpr = window.devicePixelRatio || 1;

    // --- FIX: Read client dimensions ONCE ---
    const canvasWidth = rackDetailCanvas.clientWidth;
    const canvasHeight = rackDetailCanvas.clientHeight;

    if (canvasWidth === 0 || canvasHeight === 0) return;

    rackDetailCanvas.width = canvasWidth * dpr;
    rackDetailCanvas.height = canvasHeight * dpr;
    rackDetailCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    rackDetailCtx.scale(dpr, dpr);

    const ctx = rackDetailCtx;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Get the current zoom/pan state
    const state = getViewState(rackDetailCanvas); // <-- THIS WILL NOW WORK

    // Apply zoom and pan transformations
    ctx.translate(state.offsetX, state.offsetY);
    ctx.scale(state.scale, state.scale);
    
    // --- REQ 3: Get Values from config ---
    if (!config) {
        console.warn("drawRackDetail called with no config.");
        return;
    }
    const toteWidth = config['tote-width'] || 0;
    const toteLength = config['tote-length'] || 0;
    const toteQtyPerBay = config['tote-qty-per-bay'] || 1;
    const totesDeep = config['totes-deep'] || 1;
    const toteToToteDist = config['tote-to-tote-dist'] || 0;
    const toteToUprightDist = config['tote-to-upright-dist'] || 0;
    const toteBackToBackDist = config['tote-back-to-back-dist'] || 0;
    const uprightLength = config['upright-length'] || 0;
    const uprightWidth = config['upright-width'] || 0;
    const hookAllowance = config['hook-allowance'] || 0;

    // ... (Calculate Bay Dimensions - no changes) ...
    // MODIFIED: This view shows a SINGLE bay, which ALWAYS has 2 uprights.
    // The shared logic is for the layout, not this detail view.
    const bayWidth = (toteQtyPerBay * toteLength) + (2 * toteToUprightDist) + (Math.max(0, toteQtyPerBay - 1) * toteToToteDist) + (uprightLength * 2);
    const bayDepth_total = (totesDeep * toteWidth) + (Math.max(0, totesDeep - 1) * toteBackToBackDist) + hookAllowance;

    if (bayWidth === 0 || bayDepth_total === 0) return;
    // ... (Calculate Scaling - no changes) ...
    const contentPadding = 100; // Generous padding for detail dimensions
    // Adjust scale calculation
    const contentScaleX = (canvasWidth - contentPadding * 2) / bayWidth;
    const contentScaleY = (canvasHeight - contentPadding * 2) / bayDepth_total;
    const contentScale = Math.min(contentScaleX, contentScaleY);
    if (contentScale <= 0 || !isFinite(contentScale)) return;

    const drawWidth = bayWidth * contentScale;
    const drawHeight = bayDepth_total * contentScale;
    // Adjust offset calculation
    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = (canvasHeight - drawHeight) / 2;
    // ... (Create Parameters Object - no changes) ...
    const params = {
        // World values
        toteWidth, toteLength, toteToToteDist, toteToUprightDist, toteBackToBackDist,
        toteQtyPerBay, totesDeep,
        uprightLength_world: uprightLength,
        uprightWidth_world: uprightWidth, // ADDED

        // Canvas-scaled values
        upLength_c: uprightLength * contentScale,
        upWidth_c: uprightWidth * contentScale,
        toteWidth_c: toteWidth * contentScale,
        toteLength_c: toteLength * contentScale,
        toteToTote_c: toteToToteDist * contentScale,
        toteToUpright_c: toteToUprightDist * contentScale,
        toteBackToBack_c: toteBackToBackDist * contentScale
    };
    // ... (Execute Drawing Functions - no changes) ...
    // MODIFIED: Pass 'full' as bayType
    drawStructure(ctx, offsetX, offsetY, drawWidth, drawHeight, contentScale, params, 'full');

    // Draw totes on top of structure
    // MODIFIED: Pass 'full' as bayType. Flags default to false, which is correct for this view.
    drawTotes(ctx, offsetX, offsetY, contentScale, params, 'full');

    // Draw overall dimensions
    drawDimensions(ctx, offsetX, offsetY, drawWidth, drawHeight, bayWidth, bayDepth_total, state.scale); // Pass state.scale

    // Draw detail (pink) dimensions on top of everything
    drawDetailDimensions(ctx, offsetX, offsetY, contentScale, params);
}

// --- MODIFIED: Main Drawing Function (Elevation View) ---
// REQ 3: This function now receives the global inputs and config object
export function drawElevationView(sysLength, sysWidth, sysHeight, config) {
    // ... (canvas setup - no changes) ...
    const dpr = window.devicePixelRatio || 1;

    // --- FIX: Read client dimensions ONCE ---
    const canvasWidth = elevationCanvas.clientWidth;
    const canvasHeight = elevationCanvas.clientHeight;

    if (canvasWidth === 0 || canvasHeight === 0) return;

    elevationCanvas.width = canvasWidth * dpr;
    elevationCanvas.height = canvasHeight * dpr;
    elevationCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    elevationCtx.scale(dpr, dpr);

    const ctx = elevationCtx;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Get the current zoom/pan state
    const state = getViewState(elevationCanvas); // <-- THIS WILL NOW WORK

    // Apply zoom and pan transformations
    ctx.translate(state.offsetX, state.offsetY);
    ctx.scale(state.scale, state.scale);
    // ... (Define Viewports - no changes) ...
    // Adjust viewports for zoom
    const frontViewWidth = canvasWidth / 2;
    const sideViewWidth = canvasWidth / 2;
    const viewHeight = canvasHeight;
    const frontViewOffsetX = 0;
    const sideViewOffsetX = canvasWidth / 2;
    const padding = 40; // Use fixed padding, zoom will scale it
    
    // --- REQ 3: Get All Input Values (from config) ---
    if (!config) {
        console.warn("drawElevationView called with no config.");
        return;
    }
    const inputs = {
        WH: sysHeight, // Use passed-in value
        BaseHeight: config['base-beam-height'] || 0,
        BW: config['beam-width'] || 0,
        TH: config['tote-height'] || 0,
        MC: config['min-clearance'] || 0,
        OC: config['overhead-clearance'] || 0,
        // Front View
        UW_front: config['upright-length'] || 0,
        NT_front: config['tote-qty-per-bay'] || 1,
        TW_front: config['tote-length'] || 0,
        TTD_front: config['tote-to-tote-dist'] || 0,
        TUD_front: config['tote-to-upright-dist'] || 0,
        // Side View
        UW_side: config['upright-width'] || 0,
        TotesDeep: config['totes-deep'] || 1,
        ToteDepth: config['tote-width'] || 0,
        ToteDepthGap: config['tote-back-to-back-dist'] || 0,
        HookAllowance: config['hook-allowance'] || 0,
        // Sprinkler
        SC: config['sprinkler-clearance'] || 0,
        ST: config['sprinkler-threshold'] || 0
    };

    // ... (Validate Inputs - no changes) ...
    // Check for NaN or negative values in the core inputs
    const coreElevationInputs = {
        WH: inputs.WH, BaseHeight: inputs.BaseHeight, BW: inputs.BW, TH: inputs.TH,
        MC: inputs.MC, OC: inputs.OC, SC: inputs.SC, ST: inputs.ST
    };
    if (Object.values(coreElevationInputs).some(v => isNaN(v) || v < 0)) {
        showErrorOnCanvas(ctx, "Please enter valid positive numbers.", canvasWidth, canvasHeight);
        return;
    }

    const { WH, BaseHeight, BW, TH, MC, OC } = inputs;

    if (WH <= (BaseHeight + BW + TH + OC)) {
        showErrorOnCanvas(ctx, "Height is too small for first level + overhead.", canvasWidth, canvasHeight);
        return;
    }

    // --- 3. Calculate SHARED Vertical Layout ---
    const layoutResult = calculateElevationLayout(inputs, true); // True for even distribution

    // ... (Error checking - no changes) ...
    if (!layoutResult || layoutResult.N === 0) {
        showErrorOnCanvas(ctx, "Could not calculate layout based on inputs.", canvasWidth, canvasHeight);
        return;
    }
    const { levels, N, topToteHeight } = layoutResult;

    // ... (Drawing logic - no changes) ...
    ctx.strokeStyle = '#cbd5e1'; // slate-300
    ctx.lineWidth = 1 / state.scale; // Adjust line width for zoom
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2, 0); // Adjust coordinates for zoom
    ctx.lineTo(canvasWidth / 2, viewHeight); // Adjust coordinates for zoom
    ctx.stroke();

    // --- 6. Draw Labels ---
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.font = `bold ${14 / state.scale}px Inter, sans-serif`; // Adjust font size for zoom
    ctx.textAlign = 'center';
    ctx.fillText("Front View", frontViewWidth / 2, padding - (10 / state.scale)); // Adjust text position for zoom
    ctx.fillText("Side View", sideViewOffsetX + sideViewWidth / 2, padding - (10 / state.scale)); // Adjust text position for zoom

    // --- 7.A. DRAW FRONT ELEVATION (LEFT) ---
    // MODIFIED: This view shows ONE bay, so it uses the 'full' (2 upright) logic
    {
        const { UW_front, NT_front, TW_front, TTD_front, TUD_front } = inputs;
        const NB = 1; // 1 bay
        // This is the Clear Opening
        const BCO = (NT_front * TW_front) + (Math.max(0, NT_front - 1) * TTD_front) + (2 * TUD_front);
        // Total width for one bay is C + 2U
        const totalRackWidthMM = BCO + (2 * UW_front);

        const contentScaleX = (frontViewWidth - padding * 2) / totalRackWidthMM;
        const contentScaleY = (viewHeight - 2 * padding) / WH;
        const contentScale = Math.min(contentScaleX, contentScaleY);

        if (contentScale > 0 && isFinite(contentScale)) {
            const uprightWidthPx = UW_front * contentScale;
            const bayClearOpeningPx = BCO * contentScale;
            const toteWidthPx = TW_front * contentScale;
            const toteToToteDistPx = TTD_front * contentScale;
            const totalRackWidthPx = totalRackWidthMM * contentScale;

            let rackStartX = frontViewOffsetX + (frontViewWidth - totalRackWidthPx) / 2;
            const y_coord = (mm) => (viewHeight - padding) - (mm * contentScale);

            const groundY = y_coord(0);
            const ceilingY = y_coord(WH);

            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2 / state.scale; // Adjust line width for zoom
            ctx.beginPath(); ctx.moveTo(frontViewOffsetX, groundY); ctx.lineTo(frontViewOffsetX + frontViewWidth, groundY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(frontViewOffsetX, ceilingY); ctx.lineTo(frontViewOffsetX + frontViewWidth, ceilingY); ctx.stroke();

            ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
            ctx.fillRect(rackStartX, ceilingY, totalRackWidthPx, OC * contentScale);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.setLineDash([5 / state.scale, 5 / state.scale]); // Adjust line dash for zoom
            ctx.strokeRect(rackStartX, ceilingY, totalRackWidthPx, OC * contentScale);
            ctx.setLineDash([]);

            let currentX = rackStartX;
            const bayStartX = currentX; // This is the start of the left upright
            // const bayWidthPx = bayClearOpeningPx + uprightWidthPx; // This is C + U
            const totalBayWidthPx = bayClearOpeningPx + 2 * uprightWidthPx; // This is C + 2U
            const toteAreaStartX = currentX + uprightWidthPx + TUD_front * contentScale;

            ctx.fillStyle = '#94a3b8'; // Left Upright
            ctx.fillRect(currentX, ceilingY, uprightWidthPx, WH * contentScale);

            // MODIFIED: Add index to forEach
            levels.forEach((level, index) => {
                const levelIndex = index + 1; // Level number (1-based)
                
                const beamY = y_coord(level.beamTop);
                const beamHeightPx = BW * contentScale;
                const toteY = y_coord(level.toteTop);
                const toteHeightPx = TH * contentScale;

                ctx.fillStyle = '#64748b'; // Beam
                ctx.strokeStyle = '#334155'; ctx.lineWidth = 0.5 / state.scale; // Adjust line width for zoom
                // Draw beam from inner-left-upright to inner-right-upright
                ctx.fillRect(bayStartX + uprightWidthPx, beamY, bayClearOpeningPx, beamHeightPx);
                ctx.strokeRect(bayStartX + uprightWidthPx, beamY, bayClearOpeningPx, beamHeightPx);

                ctx.fillStyle = '#60a5fa'; // Totes
                ctx.strokeStyle = '#2563eb';
                let currentToteX = toteAreaStartX;
                for (let k = 0; k < NT_front; k++) {
                    ctx.fillRect(currentToteX, toteY, toteWidthPx, toteHeightPx);
                    ctx.strokeRect(currentToteX, toteY, toteWidthPx, toteHeightPx);
                    currentToteX += (toteWidthPx + toteToToteDistPx);
                }

                // --- ADDED: Draw level number ---
                ctx.fillStyle = '#1e293b'; // slate-800
                ctx.font = `bold ${10 / state.scale}px Inter, sans-serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                // currentToteX is now *after* the last tote + gap.
                // Go back one gap to find the right edge of the last tote.
                const lastToteRightEdge = currentToteX - toteToToteDistPx;
                ctx.fillText(levelIndex, lastToteRightEdge + (5 / state.scale), toteY + (toteHeightPx / 2));
                // --- END: Draw level number ---


                if (level.sprinklerAdded > 0) {
                    const sprinklerBoxY = y_coord(level.toteTop + MC + inputs.SC);
                    const sprinklerBoxHeight = inputs.SC * contentScale;
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
                    ctx.setLineDash([4 / state.scale, 4 / state.scale]); // Adjust line dash for zoom
                    ctx.fillRect(bayStartX + uprightWidthPx, sprinklerBoxY, bayClearOpeningPx, sprinklerBoxHeight);
                    ctx.strokeRect(bayStartX + uprightWidthPx, sprinklerBoxY, bayClearOpeningPx, sprinklerBoxHeight);
                    ctx.setLineDash([]);
                }
            });

            currentX += (uprightWidthPx + bayClearOpeningPx);
            ctx.fillStyle = '#94a3b8'; // Right Upright
            ctx.fillRect(currentX, ceilingY, uprightWidthPx, WH * contentScale);
            
            // --- NEW: Draw Elevation Dimensions ---
            if (levels.length > 0) {
                const firstLevelY = y_coord(levels[0].beamTop);
                const lastToteY = y_coord(levels[levels.length - 1].toteTop);
                const dimLineX = rackStartX - (20 / state.scale);
                
                // 1. First Level
                drawVerticalDimension(ctx, dimLineX, groundY, firstLevelY, `${Math.round(levels[0].beamTop)} mm`, state.scale);
                // 2. Last Level
                drawVerticalDimension(ctx, dimLineX - (20 / state.scale), groundY, lastToteY, `${Math.round(levels[levels.length - 1].toteTop)} mm`, state.scale);
                // 3. Clear Height
                drawVerticalDimension(ctx, dimLineX - (40 / state.scale), groundY, ceilingY, `${Math.round(WH)} mm`, state.scale);
            }
        }
    }

    // --- 7.B. DRAW SIDE ELEVATION (RIGHT) ---
    {
        const { UW_side, TotesDeep, ToteDepth, ToteDepthGap, HookAllowance, SC } = inputs;

        const bayDepth_internal = (TotesDeep * ToteDepth) + (Math.max(0, TotesDeep - 1) * ToteDepthGap) + HookAllowance;
        const totalRackWidthMM = bayDepth_internal + (2 * UW_side); // Add front and back uprights

        const contentScaleX = (sideViewWidth - padding * 2) / totalRackWidthMM;
        const contentScaleY = (viewHeight - 2 * padding) / WH;
        const contentScale = Math.min(contentScaleX, contentScaleY);

        if (contentScale > 0 && isFinite(contentScale)) {
            const uprightWidthPx = UW_side * contentScale;
            const totalRackWidthPx = totalRackWidthMM * contentScale;
            const toteDepthPx = ToteDepth * contentScale;
            const toteDepthGapPx = ToteDepthGap * contentScale;

            let rackStartX = sideViewOffsetX + (sideViewWidth - totalRackWidthPx) / 2;
            const y_coord = (mm) => (viewHeight - padding) - (mm * contentScale);

            const groundY = y_coord(0);
            const ceilingY = y_coord(WH);

            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2 / state.scale; // Adjust line width for zoom
            ctx.beginPath(); ctx.moveTo(sideViewOffsetX, groundY); ctx.lineTo(sideViewOffsetX + sideViewWidth, groundY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(sideViewOffsetX, ceilingY); ctx.lineTo(sideViewOffsetX + sideViewWidth, ceilingY); ctx.stroke();

            ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
            ctx.fillRect(rackStartX, ceilingY, totalRackWidthPx, OC * contentScale);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.setLineDash([5 / state.scale, 5 / state.scale]); // Adjust line dash for zoom
            ctx.strokeRect(rackStartX, ceilingY, totalRackWidthPx, OC * contentScale);
            ctx.setLineDash([]);

            const toteAreaStartX = rackStartX + uprightWidthPx;

            ctx.fillStyle = '#94a3b8'; // Left Upright (Front)
            ctx.fillRect(rackStartX, ceilingY, uprightWidthPx, WH * contentScale);

            // MODIFIED: Add index to forEach
            levels.forEach((level, index) => {
                const levelIndex = index + 1; // Level number (1-based)

                const toteY = y_coord(level.toteTop);
                const toteHeightPx = TH * contentScale;

                ctx.fillStyle = '#60a5fa'; // Totes
                ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 0.5 / state.scale; // Adjust line width for zoom
                let currentToteX = toteAreaStartX;
                for (let k = 0; k < TotesDeep; k++) {
                    ctx.fillRect(currentToteX, toteY, toteDepthPx, toteHeightPx);
                    ctx.strokeRect(currentToteX, toteY, toteDepthPx, toteHeightPx);
                    // REQ 3: FIX: Add toteDepthGapPx to horizontal (X) offset
                    if (k < TotesDeep - 1) { // Only add gap if not the last tote
                        currentToteX += toteDepthGapPx;
                    }
                    currentToteX += toteDepthPx;
                }
                
                // --- ADDED: Draw level number ---
                ctx.fillStyle = '#1e293b'; // slate-800
                ctx.font = `bold ${10 / state.scale}px Inter, sans-serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                // currentToteX is now at the right edge of the last tote.
                ctx.fillText(levelIndex, currentToteX + (5 / state.scale), toteY + (toteHeightPx / 2));
                // --- END: Draw level number ---

                if (level.sprinklerAdded > 0) {
                    const sprinklerBoxY = y_coord(level.toteTop + MC + SC);
                    const sprinklerBoxHeight = SC * contentScale;
                    const internalWidthPx = totalRackWidthPx - (2 * uprightWidthPx);

                    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
                    ctx.setLineDash([4 / state.scale, 4 / state.scale]); // Adjust line dash for zoom
                    ctx.fillRect(rackStartX + uprightWidthPx, sprinklerBoxY, internalWidthPx, sprinklerBoxHeight);
                    ctx.strokeRect(rackStartX + uprightWidthPx, sprinklerBoxY, internalWidthPx, sprinklerBoxHeight);
                    ctx.setLineDash([]);
                }
            });

            const rightUprightX = rackStartX + totalRackWidthPx - uprightWidthPx;
            ctx.fillStyle = '#94a3b8'; // Right Upright (Back)
            ctx.fillRect(rightUprightX, ceilingY, uprightWidthPx, WH * contentScale);
        }
    }
}
// ... (showErrorOnCanvas - no changes) ...
function showErrorOnCanvas(ctx, message, canvasWidth, canvasHeight) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();
    // Reset transform to draw error message correctly, independent of zoom
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#dc2626'; // red-600
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate center based on the *client* dimensions, not scaled dimensions
    const clientWidth = ctx.canvas.clientWidth;
    const clientHeight = ctx.canvas.clientHeight;
    
    ctx.fillText(message, clientWidth / 2, clientHeight / 2);
    ctx.restore();
}

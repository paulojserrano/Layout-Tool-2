import {
    warehouseCtx,
    warehouseCanvas,
    detailViewToggle,
    metricRowStdConfig, metricStdConfigLabel, metricStdConfigLocsLvl, metricStdConfigLevels, metricStdConfigBays, metricStdConfigLocsTotal,
    metricRowStdSingle, metricStdSingleLabel, metricStdSingleLocsLvl, metricStdSingleLevels, metricStdSingleBays, metricStdSingleLocsTotal,
    metricRowBpConfig, metricBpConfigLabel, metricBpConfigLocsLvl, metricBpConfigLevels, metricBpConfigBays, metricBpConfigLocsTotal,
    metricRowTunConfig, metricTunConfigLabel, metricTunConfigLocsLvl, metricTunConfigLevels, metricTunConfigBays, metricTunConfigLocsTotal,
    metricTotBays, metricTotLocsTotal,
    debugBayListBody,
    robotPathTopLinesInput,
    robotPathBottomLinesInput,
    robotPathAddLeftACRCheckbox,
    robotPathAddRightACRCheckbox,
    userSetbackTopInput,
    userSetbackBottomInput,
    userSetbackLeftInput,
    userSetbackRightInput
} from '../dom.js';
import { formatNumber, parseNumber } from '../../../core/utils/utils.js';
import { calculateLayout, calculateElevationLayout } from '../calculations.js';
import { getViewState } from '../viewState.js';
import {
    drawStructure,
    drawTotes,
    drawDimensions,
    drawVerticalDimension, 
    showErrorOnCanvas
} from './drawingUtils.js';

// --- Warehouse View Helper ---
function drawRack(x_world, rackDepth_world, rackType, params) {
    const {
        ctx, scale, offsetX, offsetY,
        bayDepth, 
        singleBayDepth, 
        flueSpace,
        setbackTop_world,
        isDetailView, detailParams, 
        verticalBayTemplate, 
        totalRackLength_world, 
        layoutOffsetY_world, 
        numTunnelLevels,
        colIndexStart,
        isFirstRack,
        viewScale = 1
    } = params;

    const uprightLength_world = detailParams.uprightLength_world;

    const rackX_canvas = offsetX + (x_world * scale);
    const rackY_canvas_start = offsetY + (setbackTop_world * scale) + (layoutOffsetY_world * scale);
    const rackHeight_canvas = totalRackLength_world * scale; 

    if (rackHeight_canvas <= 0 || verticalBayTemplate.length === 0) return; 

    const drawLabel = (text, x, y, w, h) => {
        ctx.save();
        ctx.fillStyle = '#334155';
        const fontSize = Math.min(w, h) * 0.5;
        ctx.font = `bold ${fontSize}px "Space Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (fontSize * viewScale >= 4) {
            ctx.fillText(text, x, y);
        }
        ctx.restore();
    };

    if (isDetailView) {
        const isSingleDeepRack = Math.abs(rackDepth_world - singleBayDepth) < 0.01;
        const currentTotesDeep = isSingleDeepRack ? 1 : detailParams.totesDeep;

        const bayDetailHelpersParams = {
            ...detailParams, 
            totesDeep: currentTotesDeep, 
            upLength_c: detailParams.uprightLength_world * scale,
            upWidth_c: detailParams.uprightWidth_world * scale,
            toteWidth_c: detailParams.toteWidth * scale,
            toteLength_c: detailParams.toteLength * scale,
            toteToTote_c: detailParams.toteToToteDist * scale,
            toteToUpright_c: detailParams.toteToUprightDist * scale,
            toteBackToBack_c: detailParams.toteBackToBackDist * scale
        };
        
        let currentY_canvas = rackY_canvas_start;
        const uprightLength_canvas = uprightLength_world * scale;

        for (let i = 0; i < verticalBayTemplate.length; i++) {
            const bayTpl = verticalBayTemplate[i];
            const isFirstBay = (i === 0);
            const isTunnel = bayTpl.bayType === 'tunnel';
            const isBackpack = bayTpl.bayType === 'backpack';
            
            const clearOpening_world = (i < verticalBayTemplate.length - 1) 
                ? (verticalBayTemplate[i+1].y_center - bayTpl.y_center) - uprightLength_world
                : params.clearOpening; 
                
            const clearOpening_canvas = clearOpening_world * scale;

            if (isTunnel && numTunnelLevels === 0) {
                if (isFirstBay) {
                    currentY_canvas += uprightLength_canvas;
                }
                currentY_canvas += (clearOpening_canvas + uprightLength_canvas);
                continue; 
            }

            let bayY_canvas, bayDrawWidth_canvas;
            
            if (isFirstBay) {
                bayY_canvas = currentY_canvas;
                bayDrawWidth_canvas = uprightLength_canvas; 
                
                if (rackType === 'single') {
                    const bay_w_canvas = rackDepth_world * scale; 
                    const centerX = rackX_canvas + bay_w_canvas / 2;
                    const centerY = bayY_canvas + bayDrawWidth_canvas / 2;
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate(Math.PI / 2); 
                    ctx.fillStyle = '#64748b';
                    drawStructure(ctx, -bayDrawWidth_canvas / 2, -bay_w_canvas / 2, bayDrawWidth_canvas, bay_w_canvas, scale, bayDetailHelpersParams, 'starter');
                    ctx.restore();

                    if (isFirstBay && colIndexStart !== undefined) drawLabel(colIndexStart, centerX, centerY, bay_w_canvas, bayDrawWidth_canvas);
                    if (isFirstRack) drawLabel(i + 1, centerX, centerY, bay_w_canvas, bayDrawWidth_canvas);

                } else if (rackType === 'double') {
                    const rack1_w_canvas = bayDepth * scale;
                    const flue_w_canvas = flueSpace * scale;
                    const rack2_x_canvas = rackX_canvas + rack1_w_canvas + flue_w_canvas;
                    const rack2_w_canvas = bayDepth * scale;

                    const centerX1 = rackX_canvas + rack1_w_canvas / 2;
                    const centerY1 = bayY_canvas + bayDrawWidth_canvas / 2;
                    ctx.save();
                    ctx.translate(centerX1, centerY1); ctx.rotate(Math.PI / 2);
                    ctx.fillStyle = '#64748b';
                    drawStructure(ctx, -bayDrawWidth_canvas / 2, -rack1_w_canvas / 2, bayDrawWidth_canvas, rack1_w_canvas, scale, bayDetailHelpersParams, 'starter');
                    ctx.restore();

                    if (isFirstBay && colIndexStart !== undefined) drawLabel(colIndexStart, centerX1, centerY1, rack1_w_canvas, bayDrawWidth_canvas);
                    if (isFirstRack) drawLabel(i + 1, centerX1, centerY1, rack1_w_canvas, bayDrawWidth_canvas);

                    const centerX2 = rack2_x_canvas + rack2_w_canvas / 2;
                    const centerY2 = bayY_canvas + bayDrawWidth_canvas / 2;
                    ctx.save();
                    ctx.translate(centerX2, centerY2); ctx.rotate(Math.PI / 2);
                    ctx.fillStyle = '#64748b';
                    drawStructure(ctx, -bayDrawWidth_canvas / 2, -rack2_w_canvas / 2, bayDrawWidth_canvas, rack2_w_canvas, scale, bayDetailHelpersParams, 'starter');
                    ctx.restore();

                    if (isFirstBay && colIndexStart !== undefined) drawLabel(colIndexStart + 1, centerX2, centerY2, rack2_w_canvas, bayDrawWidth_canvas);
                }
                currentY_canvas += bayDrawWidth_canvas; 
            }
            
            bayY_canvas = currentY_canvas;
            bayDrawWidth_canvas = clearOpening_canvas + uprightLength_canvas;
            
            if (rackType === 'single') {
                const bay_w_canvas = rackDepth_world * scale; 
                const centerX = rackX_canvas + bay_w_canvas / 2;
                const centerY = bayY_canvas + bayDrawWidth_canvas / 2;

                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(Math.PI / 2); 
                
                ctx.fillStyle = '#64748b';
                drawStructure(ctx, -bayDrawWidth_canvas / 2, -bay_w_canvas / 2, bayDrawWidth_canvas, bay_w_canvas, scale, bayDetailHelpersParams, 'repeater');
                drawTotes(ctx, -bayDrawWidth_canvas / 2, -bay_w_canvas / 2, scale, bayDetailHelpersParams, 'repeater', isTunnel, isBackpack);
                
                ctx.restore();

                if (isFirstBay && colIndexStart !== undefined) drawLabel(colIndexStart, centerX, centerY, bay_w_canvas, bayDrawWidth_canvas);
                if (isFirstRack) drawLabel(i + 1, centerX, centerY, bay_w_canvas, bayDrawWidth_canvas);

            } else if (rackType === 'double') {
                const rack1_w_canvas = bayDepth * scale; 
                const flue_w_canvas = flueSpace * scale;
                const rack2_x_canvas = rackX_canvas + rack1_w_canvas + flue_w_canvas;
                const rack2_w_canvas = bayDepth * scale;

                const centerX1 = rackX_canvas + rack1_w_canvas / 2;
                const centerY1 = bayY_canvas + bayDrawWidth_canvas / 2;
                ctx.save();
                ctx.translate(centerX1, centerY1);
                ctx.rotate(Math.PI / 2);
                ctx.fillStyle = '#64748b';
                drawStructure(ctx, -bayDrawWidth_canvas / 2, -rack1_w_canvas / 2, bayDrawWidth_canvas, rack1_w_canvas, scale, bayDetailHelpersParams, 'repeater');
                drawTotes(ctx, -bayDrawWidth_canvas / 2, -rack1_w_canvas / 2, scale, bayDetailHelpersParams, 'repeater', isTunnel, isBackpack);
                ctx.restore();

                if (isFirstBay && colIndexStart !== undefined) drawLabel(colIndexStart, centerX1, centerY1, rack1_w_canvas, bayDrawWidth_canvas);
                if (isFirstRack) drawLabel(i + 1, centerX1, centerY1, rack1_w_canvas, bayDrawWidth_canvas);

                const centerX2 = rack2_x_canvas + rack2_w_canvas / 2;
                const centerY2 = bayY_canvas + bayDrawWidth_canvas / 2;
                ctx.save();
                ctx.translate(centerX2, centerY2);
                ctx.rotate(Math.PI / 2);
                ctx.fillStyle = '#64748b';
                drawStructure(ctx, -bayDrawWidth_canvas / 2, -rack2_w_canvas / 2, bayDrawWidth_canvas, rack2_w_canvas, scale, bayDetailHelpersParams, 'repeater');
                drawTotes(ctx, -bayDrawWidth_canvas / 2, -rack2_w_canvas / 2, scale, bayDetailHelpersParams, 'repeater', isTunnel, isBackpack);
                ctx.restore();

                if (isFirstBay && colIndexStart !== undefined) drawLabel(colIndexStart + 1, centerX2, centerY2, rack2_w_canvas, bayDrawWidth_canvas);
            }
            
            currentY_canvas += bayDrawWidth_canvas; 
        }
    }
    else {
        const uprightLength_canvas = uprightLength_world * scale;
        const clearOpening_canvas = params.clearOpening * scale;

        if (rackType === 'single') {
            const rackWidth_canvas = rackDepth_world * scale;
            
            if (verticalBayTemplate.length > 0) {
                let currentY_canvas = rackY_canvas_start;
                ctx.fillStyle = '#64748b'; 
                ctx.fillRect(rackX_canvas, currentY_canvas, rackWidth_canvas, uprightLength_canvas);
                currentY_canvas += uprightLength_canvas;
                
                for(let i=0; i < verticalBayTemplate.length; i++) {
                    const bayTpl = verticalBayTemplate[i];
                    const isTunnel = bayTpl.bayType === 'tunnel';
                    const isBackpack = bayTpl.bayType === 'backpack';
                    
                    if (isTunnel && numTunnelLevels === 0) {
                        currentY_canvas += (clearOpening_canvas + uprightLength_canvas);
                        continue; 
                    }

                    ctx.fillStyle = isTunnel ? '#fde047' : (isBackpack ? '#a855f7' : '#cbd5e1'); 
                    ctx.strokeStyle = '#64748b'; 
                    ctx.lineWidth = 0.5;
                    
                    const bayHeight_canvas = (clearOpening_canvas + uprightLength_canvas);

                    ctx.fillRect(rackX_canvas, currentY_canvas, rackWidth_canvas, bayHeight_canvas);
                    ctx.strokeRect(rackX_canvas, currentY_canvas, rackWidth_canvas, bayHeight_canvas);
                    
                    ctx.strokeStyle = '#94a3b8'; 
                    ctx.beginPath();
                    ctx.moveTo(rackX_canvas, currentY_canvas + clearOpening_canvas);
                    ctx.lineTo(rackX_canvas + rackWidth_canvas, currentY_canvas + clearOpening_canvas);
                    ctx.stroke();

                    const centerX = rackX_canvas + rackWidth_canvas / 2;
                    const centerY = currentY_canvas + bayHeight_canvas / 2;
                    if (i === 0 && colIndexStart !== undefined) drawLabel(colIndexStart, centerX, centerY, rackWidth_canvas, bayHeight_canvas);
                    if (isFirstRack) drawLabel(i + 1, centerX, centerY, rackWidth_canvas, bayHeight_canvas);

                    currentY_canvas += bayHeight_canvas;
                }
            }
            
            ctx.strokeStyle = '#64748b'; 
            ctx.lineWidth = 1;
            ctx.strokeRect(rackX_canvas, rackY_canvas_start, rackWidth_canvas, rackHeight_canvas);

        } else if (rackType === 'double') {
            const rack1_width_canvas = bayDepth * scale;
            const flue_width_canvas = flueSpace * scale;
            const rack2_width_canvas = bayDepth * scale;
            const rack2_x_canvas = rackX_canvas + rack1_width_canvas + flue_width_canvas;
            
            if (verticalBayTemplate.length > 0) {
                let currentY_canvas = rackY_canvas_start;
                ctx.fillStyle = '#64748b'; 
                ctx.fillRect(rackX_canvas, currentY_canvas, rack1_width_canvas, uprightLength_canvas);
                currentY_canvas += uprightLength_canvas;

                for(let i=0; i < verticalBayTemplate.length; i++) {
                    const bayTpl = verticalBayTemplate[i];
                    const isTunnel = bayTpl.bayType === 'tunnel';
                    const isBackpack = bayTpl.bayType === 'backpack';
                    
                    if (isTunnel && numTunnelLevels === 0) {
                        currentY_canvas += (clearOpening_canvas + uprightLength_canvas);
                        continue; 
                    }
                    
                    ctx.fillStyle = isTunnel ? '#fde047' : (isBackpack ? '#a855f7' : '#cbd5e1'); 
                    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.5;

                    const bayHeight_canvas = (clearOpening_canvas + uprightLength_canvas);

                    ctx.fillRect(rackX_canvas, currentY_canvas, rack1_width_canvas, bayHeight_canvas);
                    ctx.strokeRect(rackX_canvas, currentY_canvas, rack1_width_canvas, bayHeight_canvas);
                    
                    ctx.strokeStyle = '#94a3b8'; ctx.beginPath();
                    ctx.moveTo(rackX_canvas, currentY_canvas + clearOpening_canvas);
                    ctx.lineTo(rackX_canvas + rack1_width_canvas, currentY_canvas + clearOpening_canvas);
                    ctx.stroke();

                    const centerX1 = rackX_canvas + rack1_width_canvas / 2;
                    const centerY1 = currentY_canvas + bayHeight_canvas / 2;
                    if (i === 0 && colIndexStart !== undefined) drawLabel(colIndexStart, centerX1, centerY1, rack1_width_canvas, bayHeight_canvas);
                    if (isFirstRack) drawLabel(i + 1, centerX1, centerY1, rack1_width_canvas, bayHeight_canvas);

                    currentY_canvas += bayHeight_canvas;
                }
            }
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1;
            ctx.strokeRect(rackX_canvas, rackY_canvas_start, rack1_width_canvas, rackHeight_canvas);

            if (verticalBayTemplate.length > 0) {
                 let currentY_canvas = rackY_canvas_start;
                ctx.fillStyle = '#64748b'; 
                ctx.fillRect(rack2_x_canvas, currentY_canvas, rack2_width_canvas, uprightLength_canvas);
                currentY_canvas += uprightLength_canvas;
                
                for(let i=0; i < verticalBayTemplate.length; i++) {
                    const bayTpl = verticalBayTemplate[i];
                    const isTunnel = bayTpl.bayType === 'tunnel';
                    const isBackpack = bayTpl.bayType === 'backpack';

                    if (isTunnel && numTunnelLevels === 0) {
                        currentY_canvas += (clearOpening_canvas + uprightLength_canvas);
                        continue; 
                    }

                    ctx.fillStyle = isTunnel ? '#fde047' : (isBackpack ? '#a855f7' : '#cbd5e1'); 
                    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.5;

                    const bayHeight_canvas = (clearOpening_canvas + uprightLength_canvas);
                    ctx.fillRect(rack2_x_canvas, currentY_canvas, rack2_width_canvas, bayHeight_canvas);
                    ctx.strokeRect(rack2_x_canvas, currentY_canvas, rack2_width_canvas, bayHeight_canvas);

                    ctx.strokeStyle = '#94a3b8'; ctx.beginPath();
                    ctx.moveTo(rack2_x_canvas, currentY_canvas + clearOpening_canvas);
                    ctx.lineTo(rack2_x_canvas + rack2_width_canvas, currentY_canvas + clearOpening_canvas);
                    ctx.stroke();

                    const centerX2 = rack2_x_canvas + rack2_width_canvas / 2;
                    const centerY2 = currentY_canvas + bayHeight_canvas / 2;
                    if (i === 0 && colIndexStart !== undefined) drawLabel(colIndexStart + 1, centerX2, centerY2, rack2_width_canvas, bayHeight_canvas);

                    currentY_canvas += bayHeight_canvas;
                }
            }
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1;
            ctx.strokeRect(rack2_x_canvas, rackY_canvas_start, rack2_width_canvas, rackHeight_canvas);
        }
    }
}

// --- Main Drawing Function (Top-Down) ---
export function drawWarehouse(warehouseLength, warehouseWidth, sysHeight, config, solverResults = null, targetCanvas = null) {
    if (!config) return 1;

    // --- 1. DATA PREPARATION & LAYOUT CALCULATION (CRITICAL: Runs before canvas check) ---
    const boundaryL_world = warehouseLength;
    const boundaryW_world = warehouseWidth;
    const layoutL_world = solverResults ? solverResults.L : warehouseLength;
    const layoutW_world = solverResults ? solverResults.W : warehouseWidth;
    
    // Path Settings
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

    // Run Layout Calculation (Independent of Canvas)
    const layout = calculateLayout(layoutL_world, layoutW_world, config, pathSettings);

    // Configuration Variables used for Logic
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
    const flueSpace = config['rack-flue-space'] || 0;
    
    const configBayDepth = (totesDeep * toteWidth) + (Math.max(0, totesDeep - 1) * toteBackToBackDist) + hookAllowance;
    const singleBayDepth = (1 * toteWidth) + (Math.max(0, 1 - 1) * toteBackToBackDist) + hookAllowance;

    let numTunnelLevels;
    if (solverResults && solverResults.maxLevels > 0) {
        numTunnelLevels = solverResults.numTunnelLevels;
    } else {
        const coreElevationInputs = {
            WH: sysHeight,
            BaseHeight: config['base-beam-height'] || 0,
            BW: config['beam-width'] || 0,
            TH: config['tote-height'] || 0,
            MC: config['min-clearance'] || 0,
            OC: config['overhead-clearance'] || 0,
            SC: config['sprinkler-clearance'] || 0,
            ST: config['sprinkler-threshold'] || 0,
            UW_front: 0, NT_front: 0, TW_front: 0, TTD_front: 0, TUD_front: 0,
            UW_side: 0, TotesDeep: 0, ToteDepth: 0, ToteDepthGap: 0, HookAllowance: 0,
        };
        const hasBufferLayer = config['hasBufferLayer'] || false;
        const verticalLayout = calculateElevationLayout(coreElevationInputs, false, hasBufferLayer);
        const allLevels = verticalLayout ? verticalLayout.levels : [];
        const tunnelThreshold = 6500;
        numTunnelLevels = allLevels.filter(level => level.beamBottom >= tunnelThreshold).length;
    }

    // --- 2. UPDATE DOM METRICS (Breakdown Table) ---
    // This block MUST run even if canvasWidth is 0
    try {
        let verticalLevels;
        if (solverResults && solverResults.maxLevels > 0) {
            verticalLevels = solverResults.maxLevels;
        } else {
            const coreElevationInputs = {
                WH: sysHeight,
                BaseHeight: config['base-beam-height'] || 0,
                BW: config['beam-width'] || 0,
                TH: config['tote-height'] || 0,
                MC: config['min-clearance'] || 0,
                OC: config['overhead-clearance'] || 0,
                SC: config['sprinkler-clearance'] || 0,
                ST: config['sprinkler-threshold'] || 0,
                UW_front: 0, NT_front: 0, TW_front: 0, TTD_front: 0, TUD_front: 0,
                UW_side: 0, TotesDeep: 0, ToteDepth: 0, ToteDepthGap: 0, HookAllowance: 0,
            };
            const hasBufferLayer = config['hasBufferLayer'] || false;
            const verticalLayout = calculateElevationLayout(coreElevationInputs, false, hasBufferLayer);
            verticalLevels = verticalLayout ? verticalLayout.N : 0;
        }
        
        const hasBufferLayer = config['hasBufferLayer'] || false;
        let storageLevels = verticalLevels;
        if (hasBufferLayer && verticalLevels > 0) {
            storageLevels = verticalLevels - 1;
        }
        if (storageLevels < 0) storageLevels = 0;
        
        const configTotesDeep = config['totes-deep'] || 1;
        const singleTotesDeep = 1;
        const locationsPerConfigLevel = toteQtyPerBay * configTotesDeep;
        const locationsPerSingleLevel = toteQtyPerBay * singleTotesDeep;

        const standardLevels = storageLevels;
        const backpackLevels = storageLevels;
        const tunnelLevels = numTunnelLevels;

        let totalStandardBays_Config = 0;
        let totalStandardBays_Single = 0;
        let totalBackpackBays_Config = 0;
        let totalBackpackBays_Single = 0;
        let totalTunnelBays_Config = 0;
        let totalTunnelBays_Single = 0;

        const layoutMode = config['layout-mode'] || 's-d-s';

        if (layoutMode === 'all-singles') {
            for (const item of layout.layoutItems) {
                if (item.type !== 'rack') continue;
                
                const isSingleDeep = Math.abs(item.width - singleBayDepth) < 0.01;
                const baysInRow = layout.allBays.filter(b => b.row === item.row);
                
                const numStandard = baysInRow.filter(b => b.bayType === 'standard').length;
                const numBackpack = baysInRow.filter(b => b.bayType === 'backpack').length;
                const numTunnel = baysInRow.filter(b => b.bayType === 'tunnel').length;
                
                if (isSingleDeep) {
                    totalStandardBays_Single += numStandard;
                    totalBackpackBays_Single += numBackpack;
                    totalTunnelBays_Single += numTunnel;
                } else {
                    totalStandardBays_Config += numStandard;
                    totalBackpackBays_Config += numBackpack;
                    totalTunnelBays_Config += numTunnel;
                }
            }
        } else {
            totalStandardBays_Config = layout.numStandardBays;
            totalBackpackBays_Config = layout.numBackpackBays;
            totalTunnelBays_Config = layout.numTunnelBays;
        }
        
        const totalLocationsStd_Config = locationsPerConfigLevel * standardLevels * totalStandardBays_Config;
        const totalLocationsStd_Single = locationsPerSingleLevel * standardLevels * totalStandardBays_Single;
        const totalLocationsBp_Config = locationsPerConfigLevel * backpackLevels * totalBackpackBays_Config;
        const totalLocationsBp_Single = locationsPerSingleLevel * backpackLevels * totalBackpackBays_Single;
        const totalLocationsTun_Config = locationsPerConfigLevel * tunnelLevels * totalTunnelBays_Config;
        const totalLocationsTun_Single = locationsPerSingleLevel * tunnelLevels * totalTunnelBays_Single;
        
        const grandTotalBays = totalStandardBays_Config + totalStandardBays_Single + totalBackpackBays_Config + totalBackpackBays_Single + totalTunnelBays_Config + totalTunnelBays_Single;
        const grandTotalLocations = totalLocationsStd_Config + totalLocationsStd_Single + totalLocationsBp_Config + totalLocationsBp_Single + totalLocationsTun_Config + totalLocationsTun_Single;
        
        const stdConfigLabelText = `Standard ${toteQtyPerBay}x${configTotesDeep}x${storageLevels}`;
        const stdSingleLabelText = `Standard ${toteQtyPerBay}x1x${storageLevels}`;
        const bpConfigLabelText = `Backpack ${toteQtyPerBay}x${configTotesDeep}x${storageLevels}`;
        const tunConfigLabelText = `Tunnel ${toteQtyPerBay}x${configTotesDeep}x${tunnelLevels}`;
        
        if (totalStandardBays_Config > 0) {
            metricRowStdConfig.style.display = '';
            metricStdConfigLabel.textContent = stdConfigLabelText;
            metricStdConfigLocsLvl.textContent = formatNumber(locationsPerConfigLevel);
            metricStdConfigLevels.textContent = formatNumber(storageLevels);
            metricStdConfigBays.textContent = formatNumber(totalStandardBays_Config);
            metricStdConfigLocsTotal.textContent = formatNumber(totalLocationsStd_Config);
        } else {
            metricRowStdConfig.style.display = 'none';
        }
        
        if (totalStandardBays_Single > 0) {
            metricRowStdSingle.style.display = '';
            metricStdSingleLabel.textContent = stdSingleLabelText;
            metricStdSingleLocsLvl.textContent = formatNumber(locationsPerSingleLevel);
            metricStdSingleLevels.textContent = formatNumber(storageLevels);
            metricStdSingleBays.textContent = formatNumber(totalStandardBays_Single);
            metricStdSingleLocsTotal.textContent = formatNumber(totalLocationsStd_Single);
        } else {
            metricRowStdSingle.style.display = 'none';
        }

        if (totalBackpackBays_Config > 0) {
            metricRowBpConfig.style.display = '';
            metricBpConfigLabel.textContent = bpConfigLabelText;
            metricBpConfigLocsLvl.textContent = formatNumber(locationsPerConfigLevel);
            metricBpConfigLevels.textContent = formatNumber(storageLevels);
            metricBpConfigBays.textContent = formatNumber(totalBackpackBays_Config);
            metricBpConfigLocsTotal.textContent = formatNumber(totalLocationsBp_Config);
        } else {
            metricRowBpConfig.style.display = 'none';
        }
        
        if (totalTunnelBays_Config > 0 && tunnelLevels > 0) {
            metricRowTunConfig.style.display = '';
            metricTunConfigLabel.textContent = tunConfigLabelText;
            metricTunConfigLocsLvl.textContent = formatNumber(locationsPerConfigLevel);
            metricTunConfigLevels.textContent = formatNumber(tunnelLevels);
            metricTunConfigBays.textContent = formatNumber(totalTunnelBays_Config);
            metricTunConfigLocsTotal.textContent = formatNumber(totalLocationsTun_Config);
        } else {
            metricRowTunConfig.style.display = 'none';
        }

        metricTotBays.textContent = formatNumber(grandTotalBays);
        metricTotLocsTotal.textContent = formatNumber(grandTotalLocations);

    } catch (e) {
        console.error("Error updating metrics table:", e);
    }

    try {
        if (debugBayListBody) {
            let bayHtml = '';
            if (layout.allBays.length > 0) {
                // Limit display to 50 for performance
                const displayBays = layout.allBays.slice(0, 50);
                for (const bay of displayBays) {
                    bayHtml += `
                        <tr>
                            <td>${bay.id}</td>
                            <td>${bay.x.toFixed(0)}</td>
                            <td>${bay.y.toFixed(0)}</td>
                            <td>${bay.bayType}</td>
                        </tr>
                    `;
                }
                if (layout.allBays.length > 50) {
                    bayHtml += `<tr><td colspan="4">... ${layout.allBays.length - 50} more bays ...</td></tr>`;
                }
            } else {
                bayHtml = '<tr><td colspan="4">No bays generated.</td></tr>';
            }
            debugBayListBody.innerHTML = bayHtml;
        }
    } catch (e) {
        console.error("Error updating debug bay list:", e);
        if (debugBayListBody) {
            debugBayListBody.innerHTML = '<tr><td colspan="4">Error loading bay data.</td></tr>';
        }
    }

    // --- 3. CANVAS DRAWING (Conditional) ---
    const dpr = window.devicePixelRatio || 1;

    // Select canvas and context
    const canvas = targetCanvas || warehouseCanvas;
    const ctx = targetCanvas ? targetCanvas.getContext('2d') : warehouseCtx;

    let canvasWidth, canvasHeight;
    if (targetCanvas) {
         // Assuming targetCanvas is sized in physical pixels
         canvasWidth = targetCanvas.width / dpr;
         canvasHeight = targetCanvas.height / dpr;
    } else {
        canvasWidth = warehouseCanvas.clientWidth;
        canvasHeight = warehouseCanvas.clientHeight;
        if (canvasWidth === 0 || canvasHeight === 0) return 1;
        warehouseCanvas.width = canvasWidth * dpr;
        warehouseCanvas.height = canvasHeight * dpr;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    let state;
    if (targetCanvas) {
        state = { scale: 1, offsetX: 0, offsetY: 0 };
    } else {
        state = getViewState(warehouseCanvas);
    }

    ctx.translate(state.offsetX, state.offsetY);
    ctx.scale(state.scale, state.scale);

    const displayL_world = Math.max(boundaryL_world, layoutL_world);
    const displayW_world = Math.max(boundaryW_world, layoutW_world);

    if (displayL_world <= 0 || displayW_world <= 0) {
        showErrorOnCanvas(ctx, "Invalid dimensions.", canvasWidth, canvasHeight);
        return 1;
    }

    const setbackTop = layout.setbackTop;
    const setbackBottom = layout.setbackBottom;
    const setbackLeft = layout.setbackLeft;
    const setbackRight = layout.setbackRight;
    
    const isDetailView = detailViewToggle.checked;
    
    const contentPadding = 80;
    const contentScaleX = (canvasWidth - contentPadding * 2) / displayW_world;
    const contentScaleY = (canvasHeight - contentPadding * 2) / displayL_world;
    const contentScale = Math.min(contentScaleX, contentScaleY);

    if (contentScale <= 0 || !isFinite(contentScale)) return 1;

    const drawWidth = displayW_world * contentScale;
    const drawHeight = displayL_world * contentScale;
    const drawOffsetX = (canvasWidth - drawWidth) / 2;
    const drawOffsetY = (canvasHeight - drawHeight) / 2;

    const layoutDrawWidth = layoutW_world * contentScale;
    const layoutDrawHeight = layoutL_world * contentScale;
    const layoutDrawX = drawOffsetX + (drawWidth - layoutDrawWidth) / 2;
    const layoutDrawY = drawOffsetY + (drawHeight - layoutDrawHeight) / 2;

    const { layoutOffsetX_world, layoutOffsetY_world } = layout;

    const offsetX = layoutDrawX + (setbackLeft * contentScale) + (layoutOffsetX_world * contentScale);
    const offsetY = layoutDrawY;
    
    const detailParams = {
        toteWidth, toteLength, toteToToteDist, toteToUprightDist, toteBackToBackDist,
        toteQtyPerBay, totesDeep,
        uprightLength_world: uprightLength,
        uprightWidth_world: uprightWidth,
        hookAllowance_world: hookAllowance
    };

    const drawParams = {
        ctx: ctx, scale: contentScale, offsetX, offsetY,
        bayDepth: configBayDepth,
        singleBayDepth: singleBayDepth,
        flueSpace, 
        setbackTop_world: setbackTop,
        isDetailView: isDetailView,
        detailParams: detailParams,
        verticalBayTemplate: layout.verticalBayTemplate,
        totalRackLength_world: layout.totalRackLength_world,
        layoutOffsetY_world: layoutOffsetY_world,
        numTunnelLevels: numTunnelLevels,
        clearOpening: layout.clearOpening,
        viewScale: state.scale
    };
    
    let rackColumnCounter = 1;
    let firstRackFound = false;

    layout.layoutItems.forEach(item => {
        if (item.type === 'rack') {
            const currentDrawParams = {
                ...drawParams,
                colIndexStart: rackColumnCounter,
                isFirstRack: !firstRackFound
            };

            drawRack(item.x, item.width, item.rackType, currentDrawParams);

            if (!firstRackFound) firstRackFound = true;
            rackColumnCounter += (item.rackType === 'double') ? 2 : 1;
        }
    });

    if (isDetailView && layout.paths && layout.paths.length > 0) { 
        ctx.save();
        ctx.setLineDash([]);

        layout.paths.forEach(path => {
            ctx.beginPath();
            
            if (path.type === 'aisle' || path.type === 'acr') {
                ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
            } else {
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
            }

            if (path.type === 'cross-aisle') {
                 ctx.lineWidth = 1 / state.scale;
            } else {
                 ctx.lineWidth = 2 / state.scale;
            }
            
            const x1 = layoutDrawX + (path.x1 * contentScale);
            const y1 = layoutDrawY + (path.y1 * contentScale);
            const x2 = layoutDrawX + (path.x2 * contentScale);
            const y2 = layoutDrawY + (path.y2 * contentScale);

            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        });
        ctx.restore();
    }

    if (setbackTop > 0) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.fillRect(layoutDrawX, layoutDrawY, layoutDrawWidth, setbackTop * contentScale);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.setLineDash([5 / state.scale, 5 / state.scale]);
        ctx.strokeRect(layoutDrawX, layoutDrawY, layoutDrawWidth, setbackTop * contentScale);
        ctx.setLineDash([]);
    }
    if (setbackBottom > 0) {
        const setbackY_canvas = layoutDrawY + (layoutL_world - setbackBottom) * contentScale;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.fillRect(layoutDrawX, setbackY_canvas, layoutDrawWidth, setbackBottom * contentScale);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.setLineDash([5 / state.scale, 5 / state.scale]);
        ctx.strokeRect(layoutDrawX, setbackY_canvas, layoutDrawWidth, setbackBottom * contentScale);
        ctx.setLineDash([]);
    }
    
    if (setbackLeft > 0) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.fillRect(layoutDrawX, layoutDrawY, setbackLeft * contentScale, layoutDrawHeight);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.setLineDash([5 / state.scale, 5 / state.scale]);
        ctx.strokeRect(layoutDrawX, layoutDrawY, setbackLeft * contentScale, layoutDrawHeight);
        ctx.setLineDash([]);
    }
    if (setbackRight > 0) {
        const setbackX_canvas = layoutDrawX + (layoutW_world - setbackRight) * contentScale;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.fillRect(setbackX_canvas, layoutDrawY, setbackRight * contentScale, layoutDrawHeight);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.setLineDash([5 / state.scale, 5 / state.scale]);
        ctx.strokeRect(setbackX_canvas, layoutDrawY, setbackRight * contentScale, layoutDrawHeight);
        ctx.setLineDash([]);
    }

    drawDimensions(ctx, layoutDrawX, layoutDrawY, layoutDrawWidth, layoutDrawHeight, layoutW_world, layoutL_world, state.scale);
    
    return contentScale;
}

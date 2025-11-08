import {
    warehouseCtx, rackDetailCtx, elevationCtx,
    toteWidthInput, toteLengthInput, toteQtyPerBayInput, totesDeepSelect,
    toteToToteDistInput, toteToUprightDistInput, toteBackToBackDistInput,
    uprightLengthInput, uprightWidthInput, hookAllowanceInput,
    aisleWidthInput, systemLengthInput, systemWidthInput,
    setbackTopInput, setbackBottomInput, layoutModeSelect, flueSpaceInput,
    inboundPPHInput, outboundPPHInput, inboundWSRateInput, outboundWSRateInput,
    summaryTotalBays, summaryFootprint, summaryPerfDensity,
    summaryInboundWS, summaryOutboundWS, clearHeightInput,
    baseBeamHeightInput, beamWidthInput, toteHeightInput, minClearanceInput,
    overheadClearanceInput, sprinklerClearanceInput, sprinklerThresholdInput,
    summaryMaxLevels, warehouseCanvas, rackDetailCanvas, elevationCanvas
} from './dom.js';
import { parseNumber } from './utils.js';
import { calculateLayout, calculateElevationLayout } from './calculations.js';
import { calculationResults } from './ui.js';

// --- Helper Function to Draw a Rack (Top-Down View) ---
function drawRack(x_world, rackDepth_world, rackType, params) {
    const {
        ctx, scale, offsetX, offsetY,
        bayWidth, bayDepth, // Note: bayDepth is calculated rack depth
        flueSpace,
        usableLength_world, setbackTop_world
    } = params;

    const rackX_canvas = offsetX + (x_world * scale);
    // Calculate Y start and height based on setbacks
    const rackY_canvas = offsetY + (setbackTop_world * scale);
    const rackHeight_canvas = usableLength_world * scale;

    if (rackHeight_canvas <= 0) return; // Don't draw if no height

    if (rackType === 'single') {
        const rackWidth_canvas = rackDepth_world * scale;

        ctx.fillStyle = '#cbd5e1'; // slate-300
        ctx.fillRect(rackX_canvas, rackY_canvas, rackWidth_canvas, rackHeight_canvas);

        if (bayWidth > 0) {
            ctx.strokeStyle = '#94a3b8'; // slate-400
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            let currentBayY_world_relative = bayWidth;
            while (currentBayY_world_relative < usableLength_world) {
                const bayY_canvas = rackY_canvas + (currentBayY_world_relative * scale);
                ctx.moveTo(rackX_canvas, bayY_canvas);
                ctx.lineTo(rackX_canvas + rackWidth_canvas, bayY_canvas);
                currentBayY_world_relative += bayWidth;
            }
            ctx.stroke();
        }

        ctx.strokeStyle = '#64748b'; // slate-500
        ctx.lineWidth = 1;
        ctx.strokeRect(rackX_canvas, rackY_canvas, rackWidth_canvas, rackHeight_canvas);

    } else if (rackType === 'double') {
        // This 'bayDepth' is the single rack depth from the new calculation
        const rack1_width_canvas = bayDepth * scale;
        const flue_width_canvas = flueSpace * scale;
        const rack2_width_canvas = bayDepth * scale;
        const rack2_x_canvas = rackX_canvas + rack1_width_canvas + flue_width_canvas;

        // --- Draw Rack 1 ---
        ctx.fillStyle = '#cbd5e1'; // slate-300
        ctx.fillRect(rackX_canvas, rackY_canvas, rack1_width_canvas, rackHeight_canvas);
        if (bayWidth > 0) {
            ctx.strokeStyle = '#94a3b8'; // slate-400
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            let currentBayY_world_relative = bayWidth;
            while (currentBayY_world_relative < usableLength_world) {
                const bayY_canvas = rackY_canvas + (currentBayY_world_relative * scale);
                ctx.moveTo(rackX_canvas, bayY_canvas);
                ctx.lineTo(rackX_canvas + rack1_width_canvas, bayY_canvas);
                currentBayY_world_relative += bayWidth;
            }
            ctx.stroke();
        }
        ctx.strokeStyle = '#64748b'; // slate-500
        ctx.lineWidth = 1;
        ctx.strokeRect(rackX_canvas, rackY_canvas, rack1_width_canvas, rackHeight_canvas);

        // --- Draw Rack 2 ---
        ctx.fillStyle = '#cbd5e1'; // slate-300
        ctx.fillRect(rack2_x_canvas, rackY_canvas, rack2_width_canvas, rackHeight_canvas);
        if (bayWidth > 0) {
            ctx.strokeStyle = '#94a3b8'; // slate-400
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            let currentBayY_world_relative = bayWidth;
            while (currentBayY_world_relative < usableLength_world) {
                const bayY_canvas = rackY_canvas + (currentBayY_world_relative * scale);
                ctx.moveTo(rack2_x_canvas, bayY_canvas);
                ctx.lineTo(rack2_x_canvas + rack2_width_canvas, bayY_canvas);
                currentBayY_world_relative += bayWidth;
            }
            ctx.stroke();
        }
        ctx.strokeStyle = '#64748b'; // slate-500
        ctx.lineWidth = 1;
        ctx.strokeRect(rack2_x_canvas, rackY_canvas, rack2_width_canvas, rackHeight_canvas);
    }
}

// --- Helper Function to Draw Dimensions (General) ---
function drawDimensions(ctx, x1, y1, drawWidth, drawHeight, sysWidth_label, sysLength_label) {
    const extensionLength = 20;
    const textPadding = 10;

    ctx.strokeStyle = '#64748b'; // slate-500
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.lineWidth = 1;
    ctx.font = '12px Inter, sans-serif';
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

// --- Main Drawing Function (Top-Down) ---
export function drawWarehouse() {
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

    // const canvasWidth = warehouseCanvas.clientWidth; // REMOVED
    // const canvasHeight = warehouseCanvas.clientHeight; // REMOVED

    warehouseCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    // --- Get Values & Calculate Bay Dimensions (Using NEW Logic) ---
    const toteWidth = parseNumber(toteWidthInput.value) || 0; // Along bay depth
    const toteLength = parseNumber(toteLengthInput.value) || 0; // Along bay width
    const toteQtyPerBay = parseNumber(toteQtyPerBayInput.value) || 1;
    const totesDeep = parseNumber(totesDeepSelect.value) || 1;
    const toteToToteDist = parseNumber(toteToToteDistInput.value) || 0;
    const toteToUprightDist = parseNumber(toteToUprightDistInput.value) || 0;
    const toteBackToBackDist = parseNumber(toteBackToBackDistInput.value) || 0;
    const uprightLength = parseNumber(uprightLengthInput.value) || 0;
    const uprightWidth = parseNumber(uprightWidthInput.value) || 0;
    const hookAllowance = parseNumber(hookAllowanceInput.value) || 0;

    // Bay Width (horizontal)
    const bayWidth = (toteQtyPerBay * toteLength) +
        (2 * toteToUprightDist) +
        (Math.max(0, toteQtyPerBay - 1) * toteToToteDist) +
        (uprightLength * 2);

    // Bay Depth (vertical) for a SINGLE rack
    const bayDepth = (totesDeep * toteWidth) +
        (Math.max(0, totesDeep - 1) * toteBackToBackDist) +
        hookAllowance; // Use hook allowance

    // Get other values
    const aisleWidth = parseNumber(aisleWidthInput.value) || 0;
    const sysLength = parseNumber(systemLengthInput.value) || 0;
    const sysWidth = parseNumber(systemWidthInput.value) || 0;
    const setbackTop = parseNumber(setbackTopInput.value) || 0;
    const setbackBottom = parseNumber(setbackBottomInput.value) || 0;
    const layoutMode = layoutModeSelect.value;
    const flueSpace = parseNumber(flueSpaceInput.value) || 0;

    // --- Run Layout Calculation ---
    // Pass the *calculated* bayWidth and bayDepth
    const layout = calculateLayout(bayWidth, bayDepth, aisleWidth, sysLength, sysWidth, layoutMode, flueSpace, setbackTop, setbackBottom);

    // --- Update Results Panel ---
    calculationResults.totalBays = layout.totalBays; // Update global state
    summaryTotalBays.textContent = layout.totalBays.toLocaleString('en-US');

    // Get performance values
    const inboundPPH = parseNumber(inboundPPHInput.value) || 0;
    const outboundPPH = parseNumber(outboundPPHInput.value) || 0;
    // Get WS Rates
    const inboundWSRate = parseNumber(inboundWSRateInput.value) || 0;
    const outboundWSRate = parseNumber(outboundWSRateInput.value) || 0;

    // Calculate Footprint
    const footprintM2 = (sysLength / 1000) * (sysWidth / 1000);
    summaryFootprint.textContent = footprintM2.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    // Calculate Performance Density
    const totalPPH = inboundPPH + outboundPPH;
    const perfDensity = (footprintM2 > 0) ? totalPPH / footprintM2 : 0;
    summaryPerfDensity.textContent = perfDensity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // --- Solver Calculation ---
    const reqInboundWS = (inboundWSRate > 0) ? Math.ceil(inboundPPH / inboundWSRate) : 0;
    const reqOutboundWS = (outboundWSRate > 0) ? Math.ceil(outboundPPH / outboundWSRate) : 0;
    summaryInboundWS.textContent = reqInboundWS.toLocaleString('en-US');
    summaryOutboundWS.textContent = reqOutboundWS.toLocaleString('en-US');

    // --- Calculate Scaling and Centering ---
    const padding = 80; // Generous padding for dimensions

    // Calculate scale to fit both width and height
    const scaleX = (canvasWidth - padding * 2) / sysWidth;
    const scaleY = (canvasHeight - padding * 2) / sysLength;
    const scale = Math.min(scaleX, scaleY);

    if (scale <= 0 || !isFinite(scale)) return; // Don't draw if no space or invalid scale

    // Calculate dimensions of the *drawing* (not canvas)
    const drawWidth = sysWidth * scale;
    const drawHeight = sysLength * scale;

    // Calculate offsets to center the *drawing*
    const drawOffsetX = (canvasWidth - drawWidth) / 2;
    const drawOffsetY = (canvasHeight - drawHeight) / 2;

    // --- Calculate Centering for the *Layout* ---
    // This centers the actual racks/aisles within the system footprint
    const layoutOffsetX_world = (sysWidth - layout.totalLayoutWidth) / 2;

    // Final offset = drawing offset + layout offset
    const offsetX = drawOffsetX + (layoutOffsetX_world * scale);
    const offsetY = drawOffsetY;

    // Create params object for the helper function
    const drawParams = {
        ctx: warehouseCtx, scale, offsetX, offsetY,
        bayWidth, bayDepth, // Pass calculated values
        flueSpace, sysLength,
        usableLength_world: layout.usableLength,
        setbackTop_world: setbackTop
    };

    // --- Start Drawing ---

    // Draw background footprint
    warehouseCtx.fillStyle = '#f8fafc'; // slate-50
    warehouseCtx.strokeStyle = '#64748b'; // slate-500
    warehouseCtx.lineWidth = 2;
    warehouseCtx.fillRect(drawOffsetX, drawOffsetY, drawWidth, drawHeight);
    warehouseCtx.strokeRect(drawOffsetX, drawOffsetY, drawWidth, drawHeight);

    // Draw layout items (racks and aisles)
    layout.layoutItems.forEach(item => {
        if (item.type === 'rack') {
            // drawRack 'bayDepth' param is rackDepth_world
            drawRack(item.x, item.width, item.rackType, drawParams);
        }
        // We don't visually draw aisles, they are the empty space
    });

    // Draw Top and Bottom Setbacks
    if (setbackTop > 0) {
        warehouseCtx.fillStyle = 'rgba(239, 68, 68, 0.1)'; // red-500 with 10% opacity
        warehouseCtx.fillRect(drawOffsetX, drawOffsetY, drawWidth, setbackTop * scale);
        warehouseCtx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        warehouseCtx.setLineDash([5, 5]);
        warehouseCtx.strokeRect(drawOffsetX, drawOffsetY, drawWidth, setbackTop * scale);
        warehouseCtx.setLineDash([]);
    }
    if (setbackBottom > 0) {
        const setbackY_canvas = drawOffsetY + (sysLength - setbackBottom) * scale;
        warehouseCtx.fillStyle = 'rgba(239, 68, 68, 0.1)'; // red-500 with 10% opacity
        warehouseCtx.fillRect(drawOffsetX, setbackY_canvas, drawWidth, setbackBottom * scale);
        warehouseCtx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        warehouseCtx.setLineDash([5, 5]);
        warehouseCtx.strokeRect(drawOffsetX, setbackY_canvas, drawWidth, setbackBottom * scale);
        warehouseCtx.setLineDash([]);
    }


    // Draw dimension lines
    drawDimensions(warehouseCtx, drawOffsetX, drawOffsetY, drawWidth, drawHeight, sysWidth, sysLength);
}

// --- Rack Detail Drawing Code ---

// --- Refactored Drawing Helper: Structure ---
function drawStructure(ctx, offsetX, offsetY, drawWidth, drawHeight, scale, params) {
    const { upLength_c, upWidth_c, uprightLength_world } = params;

    // --- Draw Uprights (4 corners, filled rectangles) ---
    ctx.fillStyle = '#64748b'; // slate-500
    // Top-left
    ctx.fillRect(offsetX, offsetY, upLength_c, upWidth_c);
    // Top-right
    ctx.fillRect(offsetX + drawWidth - upLength_c, offsetY, upLength_c, upWidth_c);
    // Bottom-left
    ctx.fillRect(offsetX, offsetY + drawHeight - upWidth_c, upLength_c, upWidth_c);
    // Bottom-right
    ctx.fillRect(offsetX + drawWidth - upLength_c, offsetY + drawHeight - upWidth_c, upLength_c, upWidth_c);

    // --- Draw Upright C-Channels (lines on top of filled uprights) ---
    ctx.strokeStyle = '#64748b'; // slate-500
    ctx.lineWidth = 2;

    // Calculate offsets for two lines, centered in the upright
    const lineGap_world = 65;
    const margin_world = (uprightLength_world - lineGap_world) / 2;

    const line1_offset_c = margin_world * scale;
    const line2_offset_c = (margin_world + lineGap_world) * scale;

    // --- Left upright C-Channel ---
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


    // --- Right upright C-Channel ---
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

    // --- Draw Horizontal Beams ---
    const beamGap_world = 40;
    const beamGap_c = beamGap_world * scale;
    const beam_x1 = offsetX + upLength_c; // Inner edge of left upright
    const beam_x2 = offsetX + drawWidth - upLength_c; // Inner edge of right upright

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

// --- Refactored Drawing Helper: Totes ---
function drawTotes(ctx, offsetX, offsetY, scale, params) {
    const {
        totesDeep, toteQtyPerBay,
        toteWidth_c, toteLength_c,
        toteToTote_c, toteToUpright_c, toteBackToBack_c,
        upLength_c
    } = params;

    ctx.fillStyle = '#adcce2'; // A lighter blue for totes to stand out
    ctx.strokeStyle = '#6495ed'; // A darker blue for tote outlines
    ctx.lineWidth = 1;

    let current_y_canvas = offsetY; // Start from very top edge
    for (let j = 0; j < totesDeep; j++) {
        let current_x_canvas = offsetX + upLength_c + toteToUpright_c; // Offset by upright + toteToUpright
        for (let i = 0; i < toteQtyPerBay; i++) {
            // Draw with (width = toteLength_c, height = toteWidth_c)
            ctx.fillRect(current_x_canvas, current_y_canvas, toteLength_c, toteWidth_c);
            ctx.strokeRect(current_x_canvas, current_y_canvas, toteLength_c, toteWidth_c);
            // Increment x by horizontal tote dimension (toteLength_c)
            current_x_canvas += toteLength_c + toteToTote_c;
        }
        // Increment y by vertical tote dimension (toteWidth_c)
        current_y_canvas += toteWidth_c + toteBackToBack_c;
    }
}

// --- Refactored Drawing Helper: Detail Dimensions ---
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


// --- Main Drawing Function (Rack Detail) ---
export function drawRackDetail() {
    const dpr = window.devicePixelRatio || 1;

    // --- FIX: Read client dimensions ONCE ---
    const canvasWidth = rackDetailCanvas.clientWidth;
    const canvasHeight = rackDetailCanvas.clientHeight;

    if (canvasWidth === 0 || canvasHeight === 0) return;

    rackDetailCanvas.width = canvasWidth * dpr;
    rackDetailCanvas.height = canvasHeight * dpr;
    rackDetailCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    rackDetailCtx.scale(dpr, dpr);

    // const canvasWidth = rackDetailCanvas.clientWidth; // REMOVED
    // const canvasHeight = rackDetailCanvas.clientHeight; // REMOVED
    const ctx = rackDetailCtx;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);


    // --- 1. Get Values ---
    const toteWidth = parseNumber(toteWidthInput.value) || 0;
    const toteLength = parseNumber(toteLengthInput.value) || 0;
    const toteQtyPerBay = parseNumber(toteQtyPerBayInput.value) || 1;
    const totesDeep = parseNumber(totesDeepSelect.value) || 1;
    const toteToToteDist = parseNumber(toteToToteDistInput.value) || 0;
    const toteToUprightDist = parseNumber(toteToUprightDistInput.value) || 0;
    const toteBackToBackDist = parseNumber(toteBackToBackDistInput.value) || 0;
    const uprightLength = parseNumber(uprightLengthInput.value) || 0;
    const uprightWidth = parseNumber(uprightWidthInput.value) || 0;
    const hookAllowance = parseNumber(hookAllowanceInput.value) || 0;

    // --- 2. Calculate Bay Dimensions ---
    const bayWidth = (toteQtyPerBay * toteLength) + (2 * toteToUprightDist) + (Math.max(0, toteQtyPerBay - 1) * toteToToteDist) + (uprightLength * 2);
    const bayDepth_total = (totesDeep * toteWidth) + (Math.max(0, totesDeep - 1) * toteBackToBackDist) + hookAllowance;

    if (bayWidth === 0 || bayDepth_total === 0) return;

    // --- 3. Calculate Scaling and Centering ---
    const padding = 100; // Generous padding for detail dimensions
    const scaleX = (canvasWidth - padding * 2) / bayWidth;
    const scaleY = (canvasHeight - padding * 2) / bayDepth_total;
    const scale = Math.min(scaleX, scaleY);
    if (scale <= 0 || !isFinite(scale)) return;

    const drawWidth = bayWidth * scale;
    const drawHeight = bayDepth_total * scale;
    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = (canvasHeight - drawHeight) / 2;

    // --- 4. Create Parameters Object for Helpers ---
    const params = {
        // World values
        toteWidth, toteLength, toteToToteDist, toteToUprightDist, toteBackToBackDist,
        toteQtyPerBay, totesDeep,
        uprightLength_world: uprightLength,

        // Canvas-scaled values
        upLength_c: uprightLength * scale,
        upWidth_c: uprightWidth * scale,
        toteWidth_c: toteWidth * scale,
        toteLength_c: toteLength * scale,
        toteToTote_c: toteToToteDist * scale,
        toteToUpright_c: toteToUprightDist * scale,
        toteBackToBack_c: toteBackToBackDist * scale
    };

    // --- 5. Execute Drawing Functions in Order ---

    // Draw structure first
    drawStructure(ctx, offsetX, offsetY, drawWidth, drawHeight, scale, params);

    // Draw totes on top of structure
    drawTotes(ctx, offsetX, offsetY, scale, params);

    // Draw overall dimensions
    drawDimensions(ctx, offsetX, offsetY, drawWidth, drawHeight, bayWidth, bayDepth_total);

    // Draw detail (pink) dimensions on top of everything
    drawDetailDimensions(ctx, offsetX, offsetY, scale, params);
}

// --- NEW: Elevation View Logic ---

// --- Main Drawing Function (Elevation View) ---
export function drawElevationView() {
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

    // --- Define Viewports ---
    const frontViewWidth = canvasWidth / 2;
    const sideViewWidth = canvasWidth / 2;
    const viewHeight = canvasHeight;
    const frontViewOffsetX = 0;
    const sideViewOffsetX = canvasWidth / 2;
    const padding = 40; // Base padding for both

    // --- 1. Get All Input Values (as numbers) ---
    const inputs = {
        WH: parseNumber(clearHeightInput.value),
        BaseHeight: parseNumber(baseBeamHeightInput.value),
        BW: parseNumber(beamWidthInput.value),
        TH: parseNumber(toteHeightInput.value),
        MC: parseNumber(minClearanceInput.value),
        OC: parseNumber(overheadClearanceInput.value),
        // Front View
        UW_front: parseNumber(uprightLengthInput.value), // Map uprightLength to UW
        NT_front: parseNumber(toteQtyPerBayInput.value), // Map toteQtyPerBay to NT
        TW_front: parseNumber(toteLengthInput.value),   // Map toteLength to TW (width along beam)
        TTD_front: parseNumber(toteToToteDistInput.value),
        TUD_front: parseNumber(toteToUprightDistInput.value),
        // Side View
        UW_side: parseNumber(uprightWidthInput.value), // Upright width is the depth
        TotesDeep: parseNumber(totesDeepSelect.value),
        ToteDepth: parseNumber(toteWidthInput.value), // Tote width is the depth
        ToteDepthGap: parseNumber(toteBackToBackDistInput.value),
        HookAllowance: parseNumber(hookAllowanceInput.value),
        // Sprinkler
        SC: parseNumber(sprinklerClearanceInput.value),
        ST: parseNumber(sprinklerThresholdInput.value)
    };

    // --- 2. Validate Inputs ---
    const elevationInputs = { ...inputs, UW: 0, NT: 0, TW: 0, TTD: 0, TUD: 0 }; // Pass dummy values
    if (Object.values(elevationInputs).some(v => isNaN(v) || v < 0)) {
        showErrorOnCanvas(ctx, "Please enter valid positive numbers.", canvasWidth, canvasHeight);
        calculationResults.maxLevels = 0; // Update global state
        summaryMaxLevels.textContent = '0';
        return;
    }

    const { WH, BaseHeight, BW, TH, MC, OC } = inputs;

    if (WH <= (BaseHeight + BW + TH + OC)) {
        showErrorOnCanvas(ctx, "Height is too small for first level + overhead.", canvasWidth, canvasHeight);
        calculationResults.maxLevels = 0; // Update global state
        summaryMaxLevels.textContent = '0';
        return;
    }

    // --- 3. Calculate SHARED Vertical Layout ---
    const layoutResult = calculateElevationLayout(elevationInputs, true); // True for even distribution

    if (!layoutResult || layoutResult.N === 0) {
        showErrorOnCanvas(ctx, "Could not calculate layout based on inputs.", canvasWidth, canvasHeight);
        calculationResults.maxLevels = 0; // Update global state
        summaryMaxLevels.textContent = '0';
        return;
    }

    const { levels, N, topToteHeight } = layoutResult;

    // --- 4. Update Results Display ---
    calculationResults.maxLevels = N; // Update global state
    summaryMaxLevels.textContent = N.toLocaleString('en-US');

    // --- 5. Draw Separator ---
    ctx.strokeStyle = '#cbd5e1'; // slate-300
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2, 0);
    ctx.lineTo(canvasWidth / 2, canvasHeight);
    ctx.stroke();

    // --- 6. Draw Labels ---
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Front View", frontViewWidth / 2, padding - 10);
    ctx.fillText("Side View", sideViewOffsetX + sideViewWidth / 2, padding - 10);

    // --- 7.A. DRAW FRONT ELEVATION (LEFT) ---
    {
        const { UW_front, NT_front, TW_front, TTD_front, TUD_front } = inputs;
        const NB = 1; // 1 bay
        const BCO = (NT_front * TW_front) + (Math.max(0, NT_front - 1) * TTD_front) + (2 * TUD_front);
        const totalRackWidthMM = (NB * BCO) + ((NB + 1) * UW_front);

        const scaleX = (frontViewWidth - padding * 2) / totalRackWidthMM;
        const scaleY = (viewHeight - 2 * padding) / WH;
        const scale = Math.min(scaleX, scaleY);

        if (scale > 0 && isFinite(scale)) {
            const uprightWidthPx = UW_front * scale;
            const bayClearOpeningPx = BCO * scale;
            const toteWidthPx = TW_front * scale;
            const toteToToteDistPx = TTD_front * scale;
            const totalRackWidthPx = totalRackWidthMM * scale;

            let rackStartX = frontViewOffsetX + (frontViewWidth - totalRackWidthPx) / 2;
            const y_coord = (mm) => (viewHeight - padding) - (mm * scale);

            const groundY = y_coord(0);
            const ceilingY = y_coord(WH);

            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(frontViewOffsetX, groundY); ctx.lineTo(frontViewOffsetX + frontViewWidth, groundY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(frontViewOffsetX, ceilingY); ctx.lineTo(frontViewOffsetX + frontViewWidth, ceilingY); ctx.stroke();

            ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
            ctx.fillRect(rackStartX, ceilingY, totalRackWidthPx, OC * scale);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(rackStartX, ceilingY, totalRackWidthPx, OC * scale);
            ctx.setLineDash([]);

            let currentX = rackStartX;
            const bayStartX = currentX;
            const bayWidthPx = bayClearOpeningPx + uprightWidthPx;
            const toteAreaStartX = currentX + uprightWidthPx + TUD_front * scale;

            ctx.fillStyle = '#94a3b8'; // Left Upright
            ctx.fillRect(currentX, ceilingY, uprightWidthPx, WH * scale);

            levels.forEach(level => {
                const beamY = y_coord(level.beamTop);
                const beamHeightPx = BW * scale;
                const toteY = y_coord(level.toteTop);
                const toteHeightPx = TH * scale;

                ctx.fillStyle = '#64748b'; // Beam
                ctx.strokeStyle = '#334155'; ctx.lineWidth = 0.5;
                ctx.fillRect(bayStartX, beamY, bayWidthPx, beamHeightPx);
                ctx.strokeRect(bayStartX, beamY, bayWidthPx, beamHeightPx);

                ctx.fillStyle = '#60a5fa'; // Totes
                ctx.strokeStyle = '#2563eb';
                let currentToteX = toteAreaStartX;
                for (let k = 0; k < NT_front; k++) {
                    ctx.fillRect(currentToteX, toteY, toteWidthPx, toteHeightPx);
                    ctx.strokeRect(currentToteX, toteY, toteWidthPx, toteHeightPx);
                    currentToteX += (toteWidthPx + toteToToteDistPx);
                }

                if (level.sprinklerAdded > 0) {
                    const sprinklerBoxY = y_coord(level.toteTop + MC + inputs.SC);
                    const sprinklerBoxHeight = inputs.SC * scale;
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
                    ctx.setLineDash([4, 4]);
                    ctx.fillRect(bayStartX + uprightWidthPx, sprinklerBoxY, bayClearOpeningPx, sprinklerBoxHeight);
                    ctx.strokeRect(bayStartX + uprightWidthPx, sprinklerBoxY, bayClearOpeningPx, sprinklerBoxHeight);
                    ctx.setLineDash([]);
                }
            });

            currentX += (uprightWidthPx + bayClearOpeningPx);
            ctx.fillStyle = '#94a3b8'; // Right Upright
            ctx.fillRect(currentX, ceilingY, uprightWidthPx, WH * scale);
        }
    }

    // --- 7.B. DRAW SIDE ELEVATION (RIGHT) ---
    {
        const { UW_side, TotesDeep, ToteDepth, ToteDepthGap, HookAllowance, SC } = inputs;

        const bayDepth_internal = (TotesDeep * ToteDepth) + (Math.max(0, TotesDeep - 1) * ToteDepthGap) + HookAllowance;
        const totalRackWidthMM = bayDepth_internal + (2 * UW_side); // Add front and back uprights

        const scaleX = (sideViewWidth - padding * 2) / totalRackWidthMM;
        const scaleY = (viewHeight - 2 * padding) / WH;
        const scale = Math.min(scaleX, scaleY);

        if (scale > 0 && isFinite(scale)) {
            const uprightWidthPx = UW_side * scale;
            const totalRackWidthPx = totalRackWidthMM * scale;
            const toteDepthPx = ToteDepth * scale;
            const toteDepthGapPx = ToteDepthGap * scale;

            let rackStartX = sideViewOffsetX + (sideViewWidth - totalRackWidthPx) / 2;
            const y_coord = (mm) => (viewHeight - padding) - (mm * scale);

            const groundY = y_coord(0);
            const ceilingY = y_coord(WH);

            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(sideViewOffsetX, groundY); ctx.lineTo(sideViewOffsetX + sideViewWidth, groundY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(sideViewOffsetX, ceilingY); ctx.lineTo(sideViewOffsetX + sideViewWidth, ceilingY); ctx.stroke();

            ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
            ctx.fillRect(rackStartX, ceilingY, totalRackWidthPx, OC * scale);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(rackStartX, ceilingY, totalRackWidthPx, OC * scale);
            ctx.setLineDash([]);

            const toteAreaStartX = rackStartX + uprightWidthPx;

            ctx.fillStyle = '#94a3b8'; // Left Upright (Front)
            ctx.fillRect(rackStartX, ceilingY, uprightWidthPx, WH * scale);

            levels.forEach(level => {
                const toteY = y_coord(level.toteTop);
                const toteHeightPx = TH * scale;

                ctx.fillStyle = '#60a5fa'; // Totes
                ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 0.5;
                let currentToteX = toteAreaStartX;
                for (let k = 0; k < TotesDeep; k++) {
                    ctx.fillRect(currentToteX, toteY, toteDepthPx, toteHeightPx);
                    ctx.strokeRect(currentToteX, toteY, toteDepthPx, toteHeightPx);
                    currentToteX += (toteDepthPx + toteDepthGapPx);
                }

                if (level.sprinklerAdded > 0) {
                    const sprinklerBoxY = y_coord(level.toteTop + MC + SC);
                    const sprinklerBoxHeight = SC * scale;
                    const internalWidthPx = totalRackWidthPx - (2 * uprightWidthPx);

                    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
                    ctx.setLineDash([4, 4]);
                    ctx.fillRect(rackStartX + uprightWidthPx, sprinklerBoxY, internalWidthPx, sprinklerBoxHeight);
                    ctx.strokeRect(rackStartX + uprightWidthPx, sprinklerBoxY, internalWidthPx, sprinklerBoxHeight);
                    ctx.setLineDash([]);
                }
            });

            const rightUprightX = rackStartX + totalRackWidthPx - uprightWidthPx;
            ctx.fillStyle = '#94a3b8'; // Right Upright (Back)
            ctx.fillRect(rightUprightX, ceilingY, uprightWidthPx, WH * scale);
        }
    }
}

function showErrorOnCanvas(ctx, message, canvasWidth, canvasHeight) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();
    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#dc2626'; // red-600
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, canvasWidth / 2, canvasHeight / 2);
    ctx.restore();
}

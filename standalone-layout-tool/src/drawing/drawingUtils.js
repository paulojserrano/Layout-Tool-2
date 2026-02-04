// --- Helper: Imperial Conversion ---
function getImperialText(mm) {
    const totalInches = mm / 25.4;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);

    // Handle rounding edge case (e.g. 11.9 inches -> 12 inches -> 0 inches + 1 foot)
    const displayFeet = (inches === 12) ? feet + 1 : feet;
    const displayInches = (inches === 12) ? 0 : inches;

    return `[${displayFeet}' ${displayInches}"]`;
}

// --- Shared Dimension Helper (AutoCAD Style) ---
export function drawDimensions(ctx, x1, y1, drawWidth, drawHeight, sysWidth_label, sysLength_label, zoomScale = 1) {
    // Coordinates (x1, y1, drawWidth, drawHeight) are in "Base Screen Pixels" (Fit-to-screen scale).
    // We define sizes in Pixels so they look correct at Zoom 1.0, and scale naturally with the canvas transform.

    // Reduced sizes for a tighter, cleaner look
    const textHeight = 14;
    const subTextHeight = 11; // Secondary dimension size
    const tickSize = 6;
    const extOffset = 8;   // Gap from object
    const extPast = 8;     // Extension past dim line
    const textOffset = 4;  // Gap text to line

    ctx.strokeStyle = '#475569'; // slate-600
    ctx.fillStyle = '#475569';

    // Line weight: 1.5px at zoom 1.0 (thinner/cleaner)
    ctx.lineWidth = 1.5;

    // --- Horizontal Dimension (System Width) ---
    // Drawn ABOVE the object
    const dimY = y1 - extOffset - extPast - 25; // Increased spacing for double text

    // 1. Extension Lines
    ctx.lineWidth = 0.5; // Very thin extensions
    ctx.beginPath();
    ctx.moveTo(x1, y1 - extOffset);
    ctx.lineTo(x1, dimY - extPast);
    ctx.moveTo(x1 + drawWidth, y1 - extOffset);
    ctx.lineTo(x1 + drawWidth, dimY - extPast);
    ctx.stroke();

    // 2. Main Dimension Line
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1 - 5, dimY); // Slight overshoot
    ctx.lineTo(x1 + drawWidth + 5, dimY);
    ctx.stroke();

    // 3. Ticks (Straight Vertical)
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Left Tick
    ctx.moveTo(x1, dimY - tickSize);
    ctx.lineTo(x1, dimY + tickSize);
    // Right Tick
    ctx.moveTo(x1 + drawWidth, dimY - tickSize);
    ctx.lineTo(x1 + drawWidth, dimY + tickSize);
    ctx.stroke();

    // 4. Text
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'center';

    const widthMM = `${Math.round(sysWidth_label).toLocaleString('en-US')} mm`;
    const widthImp = getImperialText(sysWidth_label);

    // Draw Metric (Bold)
    ctx.font = `bold ${textHeight}px 'Space Mono', monospace`;
    ctx.fillText(widthMM, x1 + drawWidth / 2, dimY - textOffset - subTextHeight - 2);

    // Draw Imperial (Normal, below metric)
    ctx.font = `normal ${subTextHeight}px 'Space Mono', monospace`;
    ctx.fillText(widthImp, x1 + drawWidth / 2, dimY - textOffset);


    // --- Vertical Dimension (System Length) ---
    // Drawn LEFT of the object
    const dimX = x1 - extOffset - extPast - 45; // Wider spacing for double text lines

    // 1. Extension Lines
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x1 - extOffset, y1);
    ctx.lineTo(dimX - extPast, y1);
    ctx.moveTo(x1 - extOffset, y1 + drawHeight);
    ctx.lineTo(dimX - extPast, y1 + drawHeight);
    ctx.stroke();

    // 2. Main Dimension Line
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dimX, y1 - 5);
    ctx.lineTo(dimX, y1 + drawHeight + 5);
    ctx.stroke();

    // 3. Ticks (Straight Horizontal)
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Top Tick
    ctx.moveTo(dimX - tickSize, y1);
    ctx.lineTo(dimX + tickSize, y1);
    // Bottom Tick
    ctx.moveTo(dimX - tickSize, y1 + drawHeight);
    ctx.lineTo(dimX + tickSize, y1 + drawHeight);
    ctx.stroke();

    // 4. Text (Rotated)
    const lengthMM = `${Math.round(sysLength_label).toLocaleString('en-US')} mm`;
    const lengthImp = getImperialText(sysLength_label);

    ctx.save();
    ctx.translate(dimX - textOffset, y1 + drawHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Draw Metric (Bold)
    ctx.font = `bold ${textHeight}px 'Space Mono', monospace`;
    ctx.fillText(lengthMM, 0, -subTextHeight - 2); // Shift up to make room for imperial

    // Draw Imperial (Normal)
    ctx.font = `normal ${subTextHeight}px 'Space Mono', monospace`;
    ctx.fillText(lengthImp, 0, 0);

    ctx.restore();
}

// --- Shared Vertical Dimension Helper (for Elevation View) ---
export function drawVerticalDimension(ctx, x, y1_c, y2_c, label, zoomScale = 1) {
    const tickSize = 3;
    const textHeight = 10;
    const subTextHeight = 9; // Slightly smaller for dense elevation

    ctx.strokeStyle = '#475569';
    ctx.fillStyle = '#475569';
    ctx.lineWidth = 1;

    // Main line
    ctx.beginPath();
    ctx.moveTo(x, y1_c);
    ctx.lineTo(x, y2_c);
    ctx.stroke();

    // Ticks
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - tickSize, y1_c); ctx.lineTo(x + tickSize, y1_c);
    ctx.moveTo(x - tickSize, y2_c); ctx.lineTo(x + tickSize, y2_c);
    ctx.stroke();

    // Text Calculation
    let mmText = label;
    let impText = "";

    if (!isNaN(parseFloat(label))) {
         const val = parseFloat(label);
         mmText = Math.round(val).toLocaleString('en-US');
         impText = getImperialText(val);
    }

    // Text Drawing
    ctx.save();
    ctx.translate(x - 10, (y1_c + y2_c) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Draw Metric (Bold)
    ctx.font = `bold ${textHeight}px 'Space Mono', monospace`;
    ctx.fillText(mmText, 0, -subTextHeight/2 - 1);

    // Draw Imperial (Normal) - Only if we have a valid conversion
    if (impText) {
        ctx.font = `normal ${subTextHeight}px 'Space Mono', monospace`;
        ctx.fillText(impText, 0, subTextHeight/2 + 2);
    }

    ctx.restore();
}

// --- Shared Structure Drawing Helper ---
export function drawStructure(ctx, offsetX, offsetY, drawWidth, drawHeight, scale, params, bayType = 'full') {
    const { upLength_c, upWidth_c, uprightLength_world } = params;

    ctx.fillStyle = '#64748b'; // slate-500

    // --- Draw Uprights ---
    // Left
    if (bayType === 'full' || bayType === 'starter') {
        ctx.fillRect(offsetX, offsetY, upLength_c, upWidth_c); // Top-left
        ctx.fillRect(offsetX, offsetY + drawHeight - upWidth_c, upLength_c, upWidth_c); // Bottom-left
    }

    // Right
    if (bayType === 'full' || bayType === 'repeater') {
        ctx.fillRect(offsetX + drawWidth - upLength_c, offsetY, upLength_c, upWidth_c); // Top-right
        ctx.fillRect(offsetX + drawWidth - upLength_c, offsetY + drawHeight - upWidth_c, upLength_c, upWidth_c); // Bottom-right
    }

    // --- C-Channels (Detail) ---
    // Draw if visible (upLength_c > 3px)
    if (upLength_c > 3) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = Math.max(0.5, 1); // Keep fine lines

        const lineGap_world = 65;
        const margin_world = (uprightLength_world - lineGap_world) / 2;
        const line1_offset_c = margin_world * scale;
        const line2_offset_c = (margin_world + lineGap_world) * scale;

        // Left C-Channel
        if (bayType === 'full' || bayType === 'starter') {
            const l1 = offsetX + line1_offset_c;
            const l2 = offsetX + line2_offset_c;
            ctx.beginPath();
            ctx.moveTo(l1, offsetY); ctx.lineTo(l2, offsetY);
            ctx.moveTo(l1, offsetY + drawHeight); ctx.lineTo(l2, offsetY + drawHeight);
            ctx.moveTo(l1, offsetY); ctx.lineTo(l1, offsetY + drawHeight);
            ctx.moveTo(l2, offsetY); ctx.lineTo(l2, offsetY + drawHeight);
            ctx.stroke();
        }

        // Right C-Channel
        if (bayType === 'full' || bayType === 'repeater') {
            const rx = offsetX + drawWidth - upLength_c;
            const r1 = rx + line1_offset_c;
            const r2 = rx + line2_offset_c;
            ctx.beginPath();
            ctx.moveTo(r1, offsetY); ctx.lineTo(r2, offsetY);
            ctx.moveTo(r1, offsetY + drawHeight); ctx.lineTo(r2, offsetY + drawHeight);
            ctx.moveTo(r1, offsetY); ctx.lineTo(r1, offsetY + drawHeight);
            ctx.moveTo(r2, offsetY); ctx.lineTo(r2, offsetY + drawHeight);
            ctx.stroke();
        }
    }

    // --- Beams ---
    const beamGap_world = 40;
    const beamGap_c = beamGap_world * scale;

    const bx1 = (bayType === 'full' || bayType === 'starter') ? (offsetX + upLength_c) : offsetX;
    const bx2 = (bayType === 'full' || bayType === 'repeater') ? (offsetX + drawWidth - upLength_c) : (offsetX + drawWidth);

    if (beamGap_c > 0.5) {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;

        ctx.beginPath();
        // Top
        ctx.moveTo(bx1, offsetY); ctx.lineTo(bx2, offsetY);
        ctx.moveTo(bx1, offsetY + beamGap_c); ctx.lineTo(bx2, offsetY + beamGap_c);
        // Bottom
        ctx.moveTo(bx1, offsetY + drawHeight - beamGap_c); ctx.lineTo(bx2, offsetY + drawHeight - beamGap_c);
        ctx.moveTo(bx1, offsetY + drawHeight); ctx.lineTo(bx2, offsetY + drawHeight);
        ctx.stroke();
    }
}

// --- Shared Tote Drawing Helper ---
export function drawTotes(ctx, offsetX, offsetY, scale, params, bayType = 'full', isTunnel = false, isBackpack = false) {
    const {
        totesDeep, toteQtyPerBay,
        toteWidth_c, toteLength_c,
        toteToTote_c, toteToUpright_c, toteBackToBack_c,
        upLength_c
    } = params;

    ctx.fillStyle = isTunnel ? '#fde047' : (isBackpack ? '#d8b4fe' : '#adcce2');
    ctx.strokeStyle = isTunnel ? '#ca8a04' : (isBackpack ? '#9333ea' : '#6495ed');
    ctx.lineWidth = 1;

    let cy = offsetY;
    for (let j = 0; j < totesDeep; j++) {
        if (j > 0) cy += toteBackToBack_c;

        let cx = (bayType === 'full') ? (offsetX + upLength_c + toteToUpright_c) : (offsetX + toteToUpright_c);

        for (let i = 0; i < toteQtyPerBay; i++) {
            ctx.fillRect(cx, cy, toteLength_c, toteWidth_c);
            ctx.strokeRect(cx, cy, toteLength_c, toteWidth_c);
            cx += toteLength_c + toteToTote_c;
        }
        cy += toteWidth_c;
    }
}

// --- Shared Detail Dimension Helper ---
export function drawDetailDimensions(ctx, offsetX, offsetY, scale, params) {
    const {
        toteWidth, toteLength, toteToToteDist, toteToUprightDist,
        toteQtyPerBay, totesDeep,
        toteWidth_c, toteLength_c, toteToTote_c, toteToUpright_c,
        upLength_c
    } = params;

    const textHeight = 12;
    const subTextHeight = 10;
    const tickSize = 4;

    ctx.strokeStyle = '#ec4899'; // pink-500
    ctx.fillStyle = '#ec4899';
    ctx.lineWidth = 1;
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'center';

    let x1, x2;

    // Helper for vertical ticks on horizontal lines
    const drawVertTick = (tx, ty) => {
        ctx.beginPath();
        ctx.moveTo(tx, ty - tickSize);
        ctx.lineTo(tx, ty + tickSize);
        ctx.stroke();
    };

    // Helper for horizontal ticks on vertical lines
    const drawHorizTick = (tx, ty) => {
        ctx.beginPath();
        ctx.moveTo(tx - tickSize, ty);
        ctx.lineTo(tx + tickSize, ty);
        ctx.stroke();
    };

    // Helper to draw dual text
    const drawText = (val, tx, ty, isRotated = false) => {
        const impStr = getImperialText(val);
        const mmStr = `${val}`; // Detail view: just number, bold

        if (isRotated) {
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(-Math.PI / 2);
            ctx.textBaseline = 'bottom';
            ctx.font = `bold ${textHeight}px 'Space Mono', monospace`;
            ctx.fillText(mmStr, 0, -subTextHeight/2 - 1);
            ctx.font = `normal ${subTextHeight}px 'Space Mono', monospace`;
            ctx.fillText(impStr, 0, subTextHeight/2 + 2);
            ctx.restore();
        } else {
            ctx.font = `bold ${textHeight}px 'Space Mono', monospace`;
            ctx.fillText(mmStr, tx, ty - subTextHeight - 2);
            ctx.font = `normal ${subTextHeight}px 'Space Mono', monospace`;
            ctx.fillText(impStr, tx, ty);
        }
    };

    // Horizontal Detail Dims
    if (toteQtyPerBay > 0) {
        const y = offsetY;
        const dimY = y - 25; // More space for dual stack

        let cx = offsetX + upLength_c;

        // Tote-to-Upright
        if (toteToUprightDist > 0) {
            x1 = cx; x2 = cx + toteToUpright_c;

            ctx.beginPath();
            ctx.moveTo(x1, y); ctx.lineTo(x1, dimY); // Ext
            ctx.moveTo(x2, y); ctx.lineTo(x2, dimY); // Ext
            ctx.moveTo(x1, dimY); ctx.lineTo(x2, dimY); // Line
            ctx.stroke();

            drawVertTick(x1, dimY);
            drawVertTick(x2, dimY);

            drawText(toteToUprightDist, (x1 + x2) / 2, dimY - 2);

            cx = x2;
        }

        // Tote Length
        x1 = cx; x2 = cx + toteLength_c;
        ctx.beginPath();
        ctx.moveTo(x1, y); ctx.lineTo(x1, dimY);
        ctx.moveTo(x2, y); ctx.lineTo(x2, dimY);
        ctx.moveTo(x1, dimY); ctx.lineTo(x2, dimY);
        ctx.stroke();

        drawVertTick(x1, dimY);
        drawVertTick(x2, dimY);

        drawText(toteLength, (x1 + x2) / 2, dimY - 2);

        cx = x2;

        // Tote-to-Tote (if applicable)
        if (toteQtyPerBay > 1 && toteToToteDist > 0) {
            x1 = cx; x2 = cx + toteToTote_c;
            ctx.beginPath();
            ctx.moveTo(x1, y); ctx.lineTo(x1, dimY);
            ctx.moveTo(x2, y); ctx.lineTo(x2, dimY);
            ctx.moveTo(x1, dimY); ctx.lineTo(x2, dimY);
            ctx.stroke();

            drawVertTick(x1, dimY);
            drawVertTick(x2, dimY);

            drawText(toteToToteDist, (x1 + x2) / 2, dimY - 2);
        }
    }

    // Vertical Detail Dim (Tote Width / Dimension 650)
    // Moved to Left side as requested (outside rack, between rack and system dim)
    if (totesDeep > 0) {
        // Feature X (Tote Right Edge)
        const featureRightX = offsetX + upLength_c + toteToUpright_c + toteLength_c;
        const featureLeftX = offsetX + upLength_c + toteToUpright_c; // Tote Left Edge

        // Target dimension line X position (Left of Rack)
        // Rack starts at offsetX. System Dim is at offsetX - 60ish.
        // We place this at offsetX - 25.
        const dimX = offsetX - 25;

        const y1 = offsetY;
        const y2 = y1 + toteWidth_c;

        // Draw Dimension Line
        ctx.beginPath();
        ctx.moveTo(dimX, y1); ctx.lineTo(dimX, y2); // Line
        ctx.stroke();

        // Draw Ticks
        drawHorizTick(dimX, y1);
        drawHorizTick(dimX, y2);

        // Draw Extension Lines
        // From dimension line (dimX) to the feature
        // Note: The feature (tote) is inside the rack.
        // Drawing extensions all the way to the tote (featureRightX) would cross the upright.
        // Drawing to offsetX (rack edge) is cleaner.
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(dimX, y1); ctx.lineTo(offsetX + 5, y1); // Top Ext
        ctx.moveTo(dimX, y2); ctx.lineTo(offsetX + 5, y2); // Bottom Ext
        ctx.stroke();
        ctx.lineWidth = 1;

        // Draw Text (Rotated)
        drawText(toteWidth, dimX - 12, (y1 + y2) / 2, true);
    }
}

export function showErrorOnCanvas(ctx, message, canvasWidth, canvasHeight) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const clientWidth = ctx.canvas.clientWidth;
    const clientHeight = ctx.canvas.clientHeight;
    ctx.fillText(message, clientWidth / 2, clientHeight / 2);
    ctx.restore();
}
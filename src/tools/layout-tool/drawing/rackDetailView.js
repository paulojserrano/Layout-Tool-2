import {
    rackDetailCtx,
    rackDetailCanvas,
} from '../dom.js';
import { calculateElevationLayout } from '../calculations.js'; 
import { getViewState } from '../viewState.js';
import {
    drawStructure,
    drawTotes,
    drawDimensions,
    drawDetailDimensions,
    showErrorOnCanvas
} from './drawingUtils.js';

// --- Main Drawing Function (Rack Detail) ---
// MODIFIED: Return Content Scale
export function drawRackDetail(sysLength, sysWidth, sysHeight, config, solverResults = null, targetCanvas = null) {
    const dpr = window.devicePixelRatio || 1;

    const canvas = targetCanvas || rackDetailCanvas;
    const ctx = targetCanvas ? targetCanvas.getContext('2d') : rackDetailCtx;

    let canvasWidth, canvasHeight;
    if (targetCanvas) {
         canvasWidth = targetCanvas.width / dpr;
         canvasHeight = targetCanvas.height / dpr;
    } else {
        canvasWidth = rackDetailCanvas.clientWidth;
        canvasHeight = rackDetailCanvas.clientHeight;

        if (canvasWidth === 0 || canvasHeight === 0) return 1;

        rackDetailCanvas.width = canvasWidth * dpr;
        rackDetailCanvas.height = canvasHeight * dpr;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    let state;
    if (targetCanvas) {
        state = { scale: 1, offsetX: 0, offsetY: 0 };
    } else {
        state = getViewState(rackDetailCanvas);
    }

    ctx.translate(state.offsetX, state.offsetY);
    ctx.scale(state.scale, state.scale);
    
    if (!config) return 1;
    
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

    const bayWidth = (toteQtyPerBay * toteLength) + (2 * toteToUprightDist) + (Math.max(0, toteQtyPerBay - 1) * toteToToteDist) + (uprightLength * 2);
    const bayDepth_total = (totesDeep * toteWidth) + (Math.max(0, totesDeep - 1) * toteBackToBackDist) + hookAllowance;

    if (bayWidth === 0 || bayDepth_total === 0) return 1;
    
    const contentPadding = 100;
    const contentScaleX = (canvasWidth - contentPadding * 2) / bayWidth;
    const contentScaleY = (canvasHeight - contentPadding * 2) / bayDepth_total;
    const contentScale = Math.min(contentScaleX, contentScaleY);
    if (contentScale <= 0 || !isFinite(contentScale)) return 1;

    const drawWidth = bayWidth * contentScale;
    const drawHeight = bayDepth_total * contentScale;
    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = (canvasHeight - drawHeight) / 2;
    
    const params = {
        toteWidth, toteLength, toteToToteDist, toteToUprightDist, toteBackToBackDist,
        toteQtyPerBay, totesDeep,
        uprightLength_world: uprightLength,
        uprightWidth_world: uprightWidth, 

        upLength_c: uprightLength * contentScale,
        upWidth_c: uprightWidth * contentScale,
        toteWidth_c: toteWidth * contentScale,
        toteLength_c: toteLength * contentScale,
        toteToTote_c: toteToToteDist * contentScale,
        toteToUpright_c: toteToUprightDist * contentScale,
        toteBackToBack_c: toteBackToBackDist * contentScale
    };
    
    drawStructure(ctx, offsetX, offsetY, drawWidth, drawHeight, contentScale, params, 'full');
    drawTotes(ctx, offsetX, offsetY, contentScale, params, 'full');
    drawDimensions(ctx, offsetX, offsetY, drawWidth, drawHeight, bayWidth, bayDepth_total, state.scale);
    drawDetailDimensions(ctx, offsetX, offsetY, contentScale, params);

    return contentScale;
}

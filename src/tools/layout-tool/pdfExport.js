const { jsPDF } = window.jspdf;
import {
    clearHeightInput,
    // Metrics DOM elements
    solverResultFootprint,
    solverResultPerfDensity,
    solverResultPDUtil,
    solverResultRobotCount,
    solverResultLocations,
    solverResultGrossVolume,
    solverResultTotalBays,
    solverResultRowsAndBays,
    // Breakdown table elements
    metricRowStdConfig, metricStdConfigLabel, metricStdConfigLocsLvl, metricStdConfigLevels, metricStdConfigBays, metricStdConfigLocsTotal,
    metricRowStdSingle, metricStdSingleLabel, metricStdSingleLocsLvl, metricStdSingleLevels, metricStdSingleBays, metricStdSingleLocsTotal,
    metricRowBpConfig, metricBpConfigLabel, metricBpConfigLocsLvl, metricBpConfigLevels, metricBpConfigBays, metricBpConfigLocsTotal,
    metricRowTunConfig, metricTunConfigLabel, metricTunConfigLocsLvl, metricTunConfigLevels, metricTunConfigBays, metricTunConfigLocsTotal,
    metricTotBays, metricTotLocsTotal
} from './dom.js';
import { selectedSolverResult } from './solver.js';
import { configurations } from './config.js';
import { parseNumber } from '../../core/utils/utils.js';
import { drawWarehouse } from './drawing/warehouseView.js';
import { drawElevationView } from './drawing/elevationView.js';
import { drawRackDetail } from './drawing/rackDetailView.js';

export async function exportSummaryPdf() {
    if (!selectedSolverResult) {
        alert("Please select a solution first.");
        return;
    }

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // A4 Landscape: 297mm x 210mm
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 10;

    // --- Title & Header ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Layout Summary", margin, margin + 5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Config: ${selectedSolverResult.configName}`, margin, margin + 12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, margin + 17);

    // --- Metrics Table (Top Right) ---
    const metrics = [
        ["Locations", solverResultLocations.textContent],
        ["Footprint", solverResultFootprint.textContent + " m2"],
        ["Perf. Density", solverResultPerfDensity.textContent],
        ["PD Util", solverResultPDUtil.textContent],
        ["Est. Robots", solverResultRobotCount.textContent],
        ["Gross Vol.", solverResultGrossVolume.textContent + " m3"],
        ["Total Bays", solverResultTotalBays.textContent],
        ["Rows x Bays", solverResultRowsAndBays.textContent]
    ];

    let metricX = pageWidth - margin - 90;
    let metricY = margin + 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text("Key Metrics", metricX, metricY);
    metricY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setLineWidth(0.1);

    metrics.forEach(([label, value]) => {
        doc.text(label, metricX, metricY);
        doc.text(value, pageWidth - margin, metricY, { align: 'right' });
        metricY += 4;
    });

    // --- Breakdown Table (Below Metrics) ---
    metricY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text("Bay Breakdown", metricX, metricY);
    metricY += 5;

    // Headers
    const colWidths = [30, 15, 15, 15, 15]; // Label, L/L, Lvl, Bays, Tot
    let currX = metricX;
    doc.setFontSize(8);
    doc.text("Type", currX, metricY); currX += colWidths[0];
    doc.text("Loc/Lvl", currX + 10, metricY, { align: 'right' }); currX += colWidths[1];
    doc.text("Levels", currX + 10, metricY, { align: 'right' }); currX += colWidths[2];
    doc.text("Bays", currX + 10, metricY, { align: 'right' }); currX += colWidths[3];
    doc.text("Total", currX + 10, metricY, { align: 'right' });

    metricY += 3;
    doc.line(metricX, metricY - 1, pageWidth - margin, metricY - 1);

    const drawRow = (row, labelId, llId, lvlId, bayId, totId) => {
        if (row && row.style.display !== 'none') {
            let cx = metricX;
            doc.setFont('helvetica', 'normal');
            doc.text(document.getElementById(labelId).textContent, cx, metricY); cx += colWidths[0];
            doc.text(document.getElementById(llId).textContent, cx + 10, metricY, { align: 'right' }); cx += colWidths[1];
            doc.text(document.getElementById(lvlId).textContent, cx + 10, metricY, { align: 'right' }); cx += colWidths[2];
            doc.text(document.getElementById(bayId).textContent, cx + 10, metricY, { align: 'right' }); cx += colWidths[3];
            doc.setFont('helvetica', 'bold');
            doc.text(document.getElementById(totId).textContent, cx + 10, metricY, { align: 'right' });
            metricY += 4;
        }
    };

    drawRow(metricRowStdConfig, 'metric-std-config-label', 'metric-std-config-locs-lvl', 'metric-std-config-levels', 'metric-std-config-bays', 'metric-std-config-locs-total');
    drawRow(metricRowStdSingle, 'metric-std-single-label', 'metric-std-single-locs-lvl', 'metric-std-single-levels', 'metric-std-single-bays', 'metric-std-single-locs-total');
    drawRow(metricRowBpConfig, 'metric-bp-config-label', 'metric-bp-config-locs-lvl', 'metric-bp-config-levels', 'metric-bp-config-bays', 'metric-bp-config-locs-total');
    drawRow(metricRowTunConfig, 'metric-tun-config-label', 'metric-tun-config-locs-lvl', 'metric-tun-config-levels', 'metric-tun-config-bays', 'metric-tun-config-locs-total');

    // Total Row
    metricY += 1;
    doc.line(metricX, metricY - 2, pageWidth - margin, metricY - 2);
    doc.setFont('helvetica', 'bold');
    doc.text("Total", metricX, metricY);
    doc.text(metricTotBays.textContent, metricX + colWidths[0] + colWidths[1] + colWidths[2] + 10, metricY, { align: 'right' });
    doc.text(metricTotLocsTotal.textContent, pageWidth - margin, metricY, { align: 'right' });


    // --- Viewports ---
    const leftWidth = 180;
    const viewY = 25;

    // --- Generate Images ---
    const createOffscreenCanvas = (w, h) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        return c;
    };

    const highResW = 2000;
    const highResH = 1500;

    // 1. Top Down
    const canvasTop = createOffscreenCanvas(highResW, highResH);
    const config = configurations[selectedSolverResult.configKey];

    const drawL = selectedSolverResult.L;
    const drawW = selectedSolverResult.W;
    const sysHeight = selectedSolverResult.sysHeight || parseNumber(clearHeightInput.value);

    drawWarehouse(drawL, drawW, sysHeight, config, selectedSolverResult, canvasTop);
    const imgTop = canvasTop.toDataURL('image/jpeg', 0.8);

    doc.addImage(imgTop, 'JPEG', margin, viewY, leftWidth, (leftWidth * 0.75));
    doc.text("Top View", margin, viewY - 2);

    // 2. Elevation
    const rightX = metricX;
    const rightWidth = pageWidth - margin - rightX;
    const elevationY = metricY + 15;

    const canvasElev = createOffscreenCanvas(highResW, highResW);
    drawElevationView(0, 0, sysHeight, config, selectedSolverResult, canvasElev);
    const imgElev = canvasElev.toDataURL('image/jpeg', 0.8);

    const elevH = rightWidth * 1.0;
    doc.addImage(imgElev, 'JPEG', rightX, elevationY, rightWidth, elevH);
    doc.text("Elevation View", rightX, elevationY - 2);

    // 3. Rack Detail
    const detailY = elevationY + elevH + 10;
    const canvasDetail = createOffscreenCanvas(highResW, highResW);
    drawRackDetail(0, 0, sysHeight, config, selectedSolverResult, canvasDetail);
    const imgDetail = canvasDetail.toDataURL('image/jpeg', 0.8);

    const detailH = rightWidth * 1.0;
    // Check if it fits page
    if (detailY + detailH > pageHeight - margin) {
        doc.addPage();
        doc.text("Rack Detail", margin, margin + 5);
        doc.addImage(imgDetail, 'JPEG', margin, margin + 10, 150, 150);
    } else {
        doc.addImage(imgDetail, 'JPEG', rightX, detailY, rightWidth, detailH);
        doc.text("Rack Detail", rightX, detailY - 2);
    }

    doc.save(`Layout_Summary_${config.name}.pdf`);
}

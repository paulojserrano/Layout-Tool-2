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

const COLORS = {
    primary: [0, 86, 210],   // Hai Blue (#0056D2)
    accent: [243, 112, 33],  // Hai Orange (#F37021)
    text: [60, 60, 60],      // Dark Grey
    lightGrey: [245, 245, 245],
    border: [200, 200, 200],
    white: [255, 255, 255]
};

async function loadImage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Failed to load image:", url, e);
        return null;
    }
}

function drawHeader(doc, logoData, configName) {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Blue strip
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 15, 'F');

    // Logo
    if (logoData) {
        // Adjust logo dimensions as needed. Assuming roughly 3:1 aspect ratio for logo.
        // Fit within height 10mm, with some padding.
        const logoH = 8;
        const logoW = logoH * 3.5; // Approximation
        doc.addImage(logoData, 'PNG', 10, 3.5, logoW, logoH);
    } else {
        // Fallback text if logo fails
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("HAI ROBOTICS", 10, 10);
    }

    // Title
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Layout Summary", pageWidth - 10, 10, { align: 'right' });

    // Metadata Strip (below blue header)
    const metaY = 22;
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const dateStr = new Date().toLocaleDateString();
    doc.text(`Project: ${configName}`, 10, metaY);
    doc.text(`Date: ${dateStr}`, pageWidth - 10, metaY, { align: 'right' });

    return metaY + 5; // Return new Y position
}

function drawFooter(doc) {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.text);
        doc.setFont('helvetica', 'italic');

        doc.text("Hai Robotics - Confidential", 10, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, pageHeight - 10, { align: 'right' });
    }
}

function drawMetricsCards(doc, metrics, startX, startY, availableWidth) {
    const cardGap = 5;
    const cardsPerRow = 4;
    const cardWidth = (availableWidth - (cardGap * (cardsPerRow - 1))) / cardsPerRow;
    const cardHeight = 18;

    let currentX = startX;
    let currentY = startY;

    doc.setFont('helvetica', 'normal');

    metrics.forEach((metric, index) => {
        if (index > 0 && index % cardsPerRow === 0) {
            currentX = startX;
            currentY += cardHeight + cardGap;
        }

        // Card Background
        doc.setDrawColor(...COLORS.border);
        doc.setFillColor(...COLORS.lightGrey);
        doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

        // Label
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.label.toUpperCase(), currentX + cardWidth / 2, currentY + 5, { align: 'center' });

        // Value
        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.value, currentX + cardWidth / 2, currentY + 12, { align: 'center' });

        // Unit (optional, appended to value usually, or separate)
        // If needed, we can split value and unit.

        currentX += cardWidth + cardGap;
    });

    return currentY + cardHeight + 10; // Return next Y
}

function drawBayBreakdown(doc, startX, startY, width) {
    const headers = [["Type", "Loc/Lvl", "Levels", "Bays", "Total"]];
    const data = [];

    const getRowData = (row, labelId, llId, lvlId, bayId, totId) => {
        if (row && row.style.display !== 'none') {
            return [
                document.getElementById(labelId).textContent,
                document.getElementById(llId).textContent,
                document.getElementById(lvlId).textContent,
                document.getElementById(bayId).textContent,
                document.getElementById(totId).textContent
            ];
        }
        return null;
    };

    const rows = [
        getRowData(metricRowStdConfig, 'metric-std-config-label', 'metric-std-config-locs-lvl', 'metric-std-config-levels', 'metric-std-config-bays', 'metric-std-config-locs-total'),
        getRowData(metricRowStdSingle, 'metric-std-single-label', 'metric-std-single-locs-lvl', 'metric-std-single-levels', 'metric-std-single-bays', 'metric-std-single-locs-total'),
        getRowData(metricRowBpConfig, 'metric-bp-config-label', 'metric-bp-config-locs-lvl', 'metric-bp-config-levels', 'metric-bp-config-bays', 'metric-bp-config-locs-total'),
        getRowData(metricRowTunConfig, 'metric-tun-config-label', 'metric-tun-config-locs-lvl', 'metric-tun-config-levels', 'metric-tun-config-bays', 'metric-tun-config-locs-total')
    ];

    rows.forEach(r => { if(r) data.push(r); });

    // Total Row
    data.push([
        { content: 'Total', styles: { fontStyle: 'bold' } },
        '',
        '',
        { content: metricTotBays.textContent, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: metricTotLocsTotal.textContent, styles: { fontStyle: 'bold', halign: 'right' } }
    ]);

    doc.autoTable({
        startY: startY,
        margin: { left: startX },
        tableWidth: width,
        head: headers,
        body: data,
        theme: 'striped',
        headStyles: {
            fillColor: COLORS.primary,
            textColor: 255,
            fontStyle: 'bold',
            halign: 'right' // Default header align
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right', fontStyle: 'bold' }
        },
        styles: {
            fontSize: 8,
            cellPadding: 2
        }
    });

    return doc.lastAutoTable.finalY + 10;
}

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

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    // Load Logo
    const logoUrl = 'src/tools/simple-packer/assets/hai-logo.png';
    const logoData = await loadImage(logoUrl);

    // Initial Cursor
    let cursorY = 0;

    // 1. Header
    cursorY = drawHeader(doc, logoData, selectedSolverResult.configName);

    // 2. Metrics (Dashboard)
    // Gather Metrics
    const metricsData = [
        { label: "Locations", value: solverResultLocations.textContent },
        { label: "Footprint", value: solverResultFootprint.textContent + " m²" },
        { label: "Perf. Density", value: solverResultPerfDensity.textContent },
        { label: "PD Util", value: solverResultPDUtil.textContent },
        { label: "Est. Robots", value: solverResultRobotCount.textContent },
        { label: "Gross Vol.", value: solverResultGrossVolume.textContent + " m³" },
        { label: "Total Bays", value: solverResultTotalBays.textContent },
        { label: "Rows x Bays", value: solverResultRowsAndBays.textContent }
    ];

    // Layout: Top View on Left, Metrics & Table on Right
    const leftColWidth = 180;
    const gap = 10;
    const rightColX = margin + leftColWidth + gap;
    const rightColWidth = pageWidth - rightColX - margin;

    // Draw Metrics in Right Column
    let rightColY = cursorY + 5;
    rightColY = drawMetricsCards(doc, metricsData, rightColX, rightColY, rightColWidth);

    // Draw Breakdown Table below Metrics
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    doc.text("Bay Breakdown", rightColX, rightColY);
    rightColY += 5;

    rightColY = drawBayBreakdown(doc, rightColX, rightColY, rightColWidth);

    // 3. Images (Top View on Left)
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

    const config = configurations[selectedSolverResult.configKey];
    const drawL = selectedSolverResult.L;
    const drawW = selectedSolverResult.W;
    const sysHeight = selectedSolverResult.sysHeight || parseNumber(clearHeightInput.value);

    // Top View
    const canvasTop = createOffscreenCanvas(highResW, highResH);
    drawWarehouse(drawL, drawW, sysHeight, config, selectedSolverResult, canvasTop);
    const imgTop = canvasTop.toDataURL('image/jpeg', 0.8);

    let topViewY = cursorY + 5;
    // Calculate aspect ratio to fit width
    const topViewAspect = canvasTop.width / canvasTop.height;
    let topViewH = leftColWidth / topViewAspect;

    // Constrain height if it exceeds page
    if (topViewY + topViewH > pageHeight - margin - 10) {
        topViewH = pageHeight - margin - 10 - topViewY;
    }

    doc.addImage(imgTop, 'JPEG', margin, topViewY, leftColWidth, topViewH);

    // Caption
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.text);
    const captionY = topViewY + topViewH + 5;
    doc.text("Figure 1: Top View", margin + leftColWidth / 2, captionY, { align: 'center' });

    // 4. Elevation & Rack Detail (New Page if needed, or fill remaining space?)
    // Given the request for professional report, let's put Elevation and Detail on a new page or below if space permits.
    // Usually elevation is wide.

    doc.addPage();
    cursorY = drawHeader(doc, logoData, selectedSolverResult.configName);

    // Elevation View
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text("Elevation View", margin, cursorY + 10);

    const canvasElev = createOffscreenCanvas(highResW, highResW); // Square canvas for elevation? Elevation is usually wide.
    // Adjust canvas aspect for elevation
    canvasElev.width = 2000;
    canvasElev.height = 500;
    drawElevationView(0, 0, sysHeight, config, selectedSolverResult, canvasElev);
    const imgElev = canvasElev.toDataURL('image/jpeg', 0.8);

    const elevW = pageWidth - 2 * margin;
    const elevAspect = canvasElev.width / canvasElev.height;
    const elevH = elevW / elevAspect;

    doc.addImage(imgElev, 'JPEG', margin, cursorY + 15, elevW, elevH);

    // Rack Detail
    const detailY = cursorY + 15 + elevH + 15;

    // Check space
    if (detailY + 100 > pageHeight - margin) {
        doc.addPage();
        cursorY = drawHeader(doc, logoData, selectedSolverResult.configName);
        // Reset detailY
    }

    const currentDetailY = (detailY + 100 > pageHeight - margin) ? cursorY + 10 : detailY;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Rack Detail", margin, currentDetailY);

    const canvasDetail = createOffscreenCanvas(highResW, highResW);
    drawRackDetail(0, 0, sysHeight, config, selectedSolverResult, canvasDetail);
    const imgDetail = canvasDetail.toDataURL('image/jpeg', 0.8);

    const detailSize = 80; // mm square
    doc.addImage(imgDetail, 'JPEG', margin, currentDetailY + 5, detailSize, detailSize);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text("Figure 2: Rack Detail", margin + detailSize/2, currentDetailY + 5 + detailSize + 5, { align: 'center' });

    // Footer
    drawFooter(doc);

    doc.save(`Layout_Summary_${config.name}.pdf`);
}

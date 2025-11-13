import {
    analyzerClearHeightInput,
    analyzerThroughputInput,
    analyzerStorageStartInput,
    analyzerStorageEndInput,
    analyzerStorageStepInput,
    analyzerConfigChecklist,
    runAnalyzerButton,
    analyzerStatus,
    analyzerChartsSection,
    analyzerChartFootprint,
    analyzerChartPerfDensity,
    analyzerChartTotalBays,
    clearHeightInput, // <-- FIXED: Added this import
    solverThroughputReqInput // <-- FIXED: Added this import
} from './dom.js';
import { parseNumber, formatNumber } from './utils.js';
import { configurations } from './config.js';
import { findSolutionForConfig } from './solver.js';

// --- Chart.js Instances ---
let chartFootprint = null;
let chartPerfDensity = null;
let chartTotalBays = null;

// --- Chart Colors ---
const CHART_COLORS = [
    '#2563eb', // blue-600
    '#ca8a04', // yellow-600
    '#dc2626', // red-600
    '#16a34a', // green-600
    '#9333ea', // purple-600
    '#ea580c', // orange-600
    '#db2777', // pink-600
    '#0e7490', // cyan-600
];

/**
 * Populates the config checklist in the Analyzer tab
 */
function populateConfigChecklist() {
    if (!analyzerConfigChecklist) return;

    let html = '';
    let index = 0;
    for (const key in configurations) {
        const config = configurations[key];
        const color = CHART_COLORS[index % CHART_COLORS.length];
        
        html += `
            <div class="analyzer-config-checklist-item" style="border-left-color: ${color}; border-left-width: 6px;">
                <input type="checkbox" id="config-check-${key}" data-config-key="${key}" checked>
                <label for="config-check-${key}">${config.name}</label>
            </div>
        `;
        index++;
    }
    analyzerConfigChecklist.innerHTML = html;
}

/**
 * Runs the full analysis and builds charts
 */
async function runAnalysis() {
    runAnalyzerButton.disabled = true;
    analyzerStatus.textContent = 'Running analysis...';
    analyzerChartsSection.style.display = 'none';

    try {
        // 1. Get Inputs
        const clearHeight = parseNumber(analyzerClearHeightInput.value);
        const throughput = parseNumber(analyzerThroughputInput.value);
        const storageStart = parseNumber(analyzerStorageStartInput.value);
        const storageEnd = parseNumber(analyzerStorageEndInput.value);
        const storageStep = parseNumber(analyzerStorageStepInput.value);

        const selectedConfigCheckboxes = analyzerConfigChecklist.querySelectorAll('input[type="checkbox"]:checked');
        const selectedConfigKeys = Array.from(selectedConfigCheckboxes).map(cb => cb.dataset.configKey);

        if (selectedConfigKeys.length === 0) {
            throw new Error('Please select at least one configuration to analyze.');
        }
        if (storageEnd <= storageStart || storageStep <= 0) {
            throw new Error('Invalid storage range. End must be greater than Start, Step must be positive.');
        }

        // 2. Create Storage Steps (Labels for X-Axis)
        const labels = [];
        for (let s = storageStart; s <= storageEnd; s += storageStep) {
            labels.push(s);
        }

        // 3. Build Task List
        const tasks = [];
        selectedConfigKeys.forEach(configKey => {
            const config = configurations[configKey];
            labels.forEach(storageReq => {
                tasks.push(
                    findSolutionForConfig(
                        storageReq,
                        throughput,
                        clearHeight,
                        config,
                        configKey,
                        true,  // Always expand for performance in analysis
                        false, // Do not reduce levels (we want max capacity at that footprint)
                        0, 0, false, // Do not respect constraints
                        { method: 'aspectRatio', value: 1.0 } // Use default aspect ratio solver
                    ).then(result => ({ configKey, storageReq, result })) // Tag result
                );
            });
        });

        analyzerStatus.textContent = `Running ${tasks.length} simulations...`;
        const allResults = await Promise.all(tasks);
        
        // 4. Process Results into Datasets
        const datasets = {}; // { 'configKey': { footprint: [], perfDensity: [], totalBays: [] } }

        selectedConfigKeys.forEach((key, index) => {
            const color = CHART_COLORS[index % CHART_COLORS.length];
            datasets[key] = {
                label: configurations[key].name,
                dataFootprint: [],
                dataPerfDensity: [],
                dataTotalBays: [],
                borderColor: color,
                backgroundColor: `${color}33`, // Transparent version
                fill: false,
                tension: 0.1
            };
        });

        // Collate data
        allResults.forEach(taskResult => {
            const { configKey, storageReq, result } = taskResult;
            if (!result) return; // Skip failed solutions

            // Find the correct index in the labels array
            const labelIndex = labels.indexOf(storageReq);
            if (labelIndex === -1) return;
            
            datasets[configKey].dataFootprint[labelIndex] = result.footprint;
            datasets[configKey].dataPerfDensity[labelIndex] = result.density;
            datasets[configKey].dataTotalBays[labelIndex] = result.totalBays;
        });

        // 5. Build Final Chart.js datasets
        const chartDataFootprint = {
            labels: labels.map(l => formatNumber(l)),
            datasets: Object.values(datasets).map(d => ({ ...d, data: d.dataFootprint }))
        };
        const chartDataPerfDensity = {
            labels: labels.map(l => formatNumber(l)),
            datasets: Object.values(datasets).map(d => ({ ...d, data: d.dataPerfDensity }))
        };
        const chartDataTotalBays = {
            labels: labels.map(l => formatNumber(l)),
            datasets: Object.values(datasets).map(d => ({ ...d, data: d.dataTotalBays }))
        };

        // 6. Render Charts
        renderChart(analyzerChartFootprint, chartFootprint, 'chartFootprint', chartDataFootprint, 'Footprint (m²)');
        renderChart(analyzerChartPerfDensity, chartPerfDensity, 'chartPerfDensity', chartDataPerfDensity, 'Perf. Density (PPH/m²)');
        renderChart(analyzerChartTotalBays, chartTotalBays, 'chartTotalBays', chartDataTotalBays, 'Total Bays');
        
        analyzerChartsSection.style.display = 'block';
        analyzerStatus.textContent = `Analysis complete for ${selectedConfigKeys.length} systems.`;

    } catch (error) {
        console.error("Analyzer Error:", error);
        analyzerStatus.textContent = `Error: ${error.message}`;
    }

    runAnalyzerButton.disabled = false;
}

/**
 * Helper to render a chart
 */
function renderChart(canvas, chartInstance, instanceName, data, yLabel) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window[instanceName]) {
        window[instanceName].destroy();
    }
    
    window[instanceName] = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: "'Space Mono', monospace", weight: '700' },
                        boxWidth: 20,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    titleFont: { family: "'Space Mono', monospace", weight: '700' },
                    bodyFont: { family: "'Space Mono', monospace" },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toLocaleString('en-US', {maximumFractionDigits: 2});
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Storage Locations',
                        font: { family: "'Inter', sans-serif", weight: '700', size: 14 },
                    },
                    ticks: { font: { family: "'Space Mono', monospace" } }
                },
                y: {
                    title: {
                        display: true,
                        text: yLabel,
                        font: { family: "'Inter', sans-serif", weight: '700', size: 14 },
                    },
                    ticks: { font: { family: "'Space Mono', monospace" } },
                    beginAtZero: true
                }
            }
        }
    });
}


/**
 * Initializes the Analyzer tab
 */
export function initializeAnalyzer() {
    if (!runAnalyzerButton) return; // Analyzer tab isn't loaded

    populateConfigChecklist();
    runAnalyzerButton.addEventListener('click', runAnalysis);

    // Set default value for analyzer height from main solver input
    if (analyzerClearHeightInput && clearHeightInput) {
        analyzerClearHeightInput.value = clearHeightInput.value;
    }
     // Set default value for analyzer throughput from main solver input
    if (analyzerThroughputInput && solverThroughputReqInput) {
        analyzerThroughputInput.value = solverThroughputReqInput.value;
    }
}
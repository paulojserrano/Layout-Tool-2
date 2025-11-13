import { initializeUI } from './ui.js';
import { initializeSolver } from './solver.js';
import { configurations } from './config.js'; // Import configurations
import {
    // --- MAIN SOLVER TAB INPUTS ---
    warehouseLengthInput, warehouseWidthInput, clearHeightInput,
    detailViewToggle,

    // --- SOLVER INPUTS (for number formatting only) ---
    solverStorageReqInput, solverThroughputReqInput, solverAspectRatioInput,

    // --- NEW READ-ONLY CONTAINER ---
    readOnlyConfigContainer,

    // --- CONDITIONAL INPUTS ---
    solverRespectConstraintsCheckbox,
    warehouseLengthContainer,
    warehouseWidthContainer,

    // --- NEW SOLVER METHOD INPUTS ---
    // MODIFIED: Changed to select
    solverMethodSelect,
    aspectRatioInputContainer,
    fixedLengthInputContainer,
    fixedWidthInputContainer,
    solverFixedLength,
    solverFixedWidth

} from './dom.js';

// --- Creates a display card for a single configuration parameter ---
function createParamHTML(label, value, unit = '') {
    // Format layout mode for readability
    if (label === "Layout Mode") {
        value = value === 's-d-s' ? 'Single-Double-Single' : 'All Singles';
    }
    // Format booleans
    else if (typeof value === 'boolean') {
        value = value ? 'Yes' : 'No';
    }
    // Format numbers
    else if (typeof value === 'number') {
        // Special case for Max Perf. Density (allow decimals)
        if (label === "Max Perf. Density") {
             value = value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
        } else {
            value = value.toLocaleString('en-US');
        }
    }

    return `
        <div class="config-param-row">
            <span class="config-param-label">${label}</span>
            <span class="config-param-value">${value}${unit ? ` ${unit}` : ''}</span>
        </div>
    `;
}

// --- Builds the read-only configuration page from the config.js object ---
function buildReadOnlyConfigPage() {
    if (!readOnlyConfigContainer) return;

    let allConfigsHTML = '';

    for (const key in configurations) {
        const config = configurations[key];

        // We'll build the HTML string for one card
        const configCardHTML = `
            <section class="config-card">
                <h3>
                    ${config.name}
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                    
                    <!-- Col 1: Rack Specs (Tote) -->
                    <div>
                        <h4 class="text-sm font-black text-black mb-3 uppercase border-b-2 border-black pb-1">
                            1. Rack Specs (Tote)
                        </h4>
                        <div class="space-y-1">
                            ${createParamHTML("Tote Width", config['tote-width'], 'mm')}
                            ${createParamHTML("Tote Length", config['tote-length'], 'mm')}
                            ${createParamHTML("Tote Height", config['tote-height'], 'mm')}
                            ${createParamHTML("Totes per Bay", config['tote-qty-per-bay'], 'qty')}
                            ${createParamHTML("Totes Deep", config['totes-deep'], 'qty')}
                            ${createParamHTML("Tote-to-Tote", config['tote-to-tote-dist'], 'mm')}
                            ${createParamHTML("Tote-to-Upright", config['tote-to-upright-dist'], 'mm')}
                            ${createParamHTML("Tote Back-to-Back", config['tote-back-to-back-dist'], 'mm')}
                        </div>
                    </div>

                    <!-- Col 2: Rack Specs (Structure) -->
                    <div>
                        <h4 class="text-sm font-black text-black mb-3 uppercase border-b-2 border-black pb-1">
                            2. Rack Specs (Structure)
                        </h4>
                        <div class="space-y-1">
                            ${createParamHTML("Upright Length", config['upright-length'], 'mm')}
                            ${createParamHTML("Upright Width", config['upright-width'], 'mm')}
                            ${createParamHTML("Hook Allowance", config['hook-allowance'], 'mm')}
                            ${createParamHTML("Aisle Width", config['aisle-width'], 'mm')}
                            ${createParamHTML("Rack Flue Space", config['rack-flue-space'], 'mm')}
                            ${createParamHTML("Top Setback", config['top-setback'], 'mm')}
                            ${createParamHTML("Bottom Setback", config['bottom-setback'], 'mm')}
                            ${createParamHTML("Left Setback", config['setback-left'], 'mm')}
                            ${createParamHTML("Right Setback", config['setback-right'], 'mm')}
                            ${createParamHTML("Layout Mode", config['layout-mode'])}
                        </div>
                    </div>

                    <!-- Col 3: Vertical & Logic -->
                    <div>
                        <h4 class="text-sm font-black text-black mb-3 uppercase border-b-2 border-black pb-1">
                            3. Vertical & Logic
                        </h4>
                        <div class="space-y-1">
                            ${createParamHTML("Base Beam Height", config['base-beam-height'], 'mm')}
                            ${createParamHTML("Beam Width", config['beam-width'], 'mm')}
                            ${createParamHTML("Min. Clearance", config['min-clearance'], 'mm')}
                            ${createParamHTML("Overhead Clearance", config['overhead-clearance'], 'mm')}
                            ${createParamHTML("Sprinkler Threshold", config['sprinkler-threshold'], 'mm')}
                            ${createParamHTML("Sprinkler Clearance", config['sprinkler-clearance'], 'mm')}
                            ${createParamHTML("Max Perf. Density", config['max-perf-density'])}
                            ${createParamHTML("Consider Tunnels", config['considerTunnels'])}
                            ${createParamHTML("Consider Backpacks", config['considerBackpacks'])}
                            ${createParamHTML("Buffer Layer", config['hasBufferLayer'])}
                        </div>
                    </div>

                </div>
            </section>
        `;
        allConfigsHTML += configCardHTML;
    }

    readOnlyConfigContainer.innerHTML = allConfigsHTML;
}

// --- MODIFIED: Combined UI update logic ---
function updateSolverMethodUI() {
    const method = solverMethodSelect.value;
    const respectConstraints = solverRespectConstraintsCheckbox.checked;

    // 1. Toggle method-specific inputs
    aspectRatioInputContainer.style.display = (method === 'aspectRatio') ? 'block' : 'none';
    fixedLengthInputContainer.style.display = (method === 'fixedLength') ? 'block' : 'none';
    fixedWidthInputContainer.style.display = (method === 'fixedWidth') ? 'block' : 'none';

    // 2. Toggle constraint inputs (L/W) based on checkbox AND method
    if (respectConstraints) {
        if (method === 'aspectRatio') {
            warehouseLengthContainer.style.display = 'block';
            warehouseWidthContainer.style.display = 'block';
        } else if (method === 'fixedLength') {
            warehouseLengthContainer.style.display = 'none'; // Fixed by user input, not a constraint
            warehouseWidthContainer.style.display = 'block'; // This is the only constraint
        } else if (method === 'fixedWidth') {
            warehouseLengthContainer.style.display = 'block'; // This is the only constraint
            warehouseWidthContainer.style.display = 'none'; // Fixed by user input, not a constraint
        }
    } else {
        // If not respecting constraints, hide both
        warehouseLengthContainer.style.display = 'none';
        warehouseWidthContainer.style.display = 'none';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    
    // Build the read-only config page
    buildReadOnlyConfigPage();

    // All inputs that trigger a canvas redraw
    const redrawInputs = [
        warehouseLengthInput, warehouseWidthInput, clearHeightInput,
        detailViewToggle,
    ];

    // All inputs that should be formatted as numbers
    const numberInputs = [
        warehouseLengthInput, warehouseWidthInput, clearHeightInput,
        solverStorageReqInput, solverThroughputReqInput,
        solverFixedLength,
        solverFixedWidth
    ];

    // Inputs that should be formatted as decimals
    const decimalInputs = [
        solverAspectRatioInput,
    ];

    initializeUI(redrawInputs, numberInputs, decimalInputs);
    initializeSolver();

    // --- MODIFIED: Add listeners for new UI ---
    solverRespectConstraintsCheckbox.addEventListener('change', updateSolverMethodUI);
    solverMethodSelect.addEventListener('change', updateSolverMethodUI);
    // Run once on load to set initial state
    updateSolverMethodUI();
});
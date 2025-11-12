import { initializeUI } from './ui.js';
import { initializeSolver } from './solver.js'; // MODIFIED
import { configurations } from './config.js'; // Import configurations
import {
    // --- MAIN SOLVER TAB INPUTS ---
    systemLengthInput, systemWidthInput, clearHeightInput,
    solverConfigSelect, // Import solverConfigSelect
    detailViewToggle,

    // --- CONFIG TAB INPUTS (REMOVED) ---
    
    // --- SOLVER INPUTS (for number formatting only) ---
    solverStorageReqInput, solverThroughputReqInput, solverAspectRatioInput,

    // --- NEW READ-ONLY CONTAINER ---
    readOnlyConfigContainer

    // --- NEW COMPARISON BUTTON (REMOVED) ---
    // MODIFIED: Removed the problematic import line that was here

} from './dom.js';

// --- NEW FUNCTION ---
// Populates the solver's configuration dropdown
function populateConfigSelect() {
    if (!solverConfigSelect) return;

    solverConfigSelect.innerHTML = ''; // Clear existing static options

    // Create an option for each entry in the configurations object
    for (const key in configurations) {
        const config = configurations[key];
        const option = document.createElement('option');
        option.value = key; // The value is the unique key (e.g., "hps3-e2-650-dd")
        option.textContent = config.name; // The text is the friendly name
        solverConfigSelect.appendChild(option);
    }
}

// --- NEW FUNCTION ---
// Creates a display card for a single configuration parameter
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
        <div class="flex justify-between items-center text-sm">
            <span class="text-slate-600">${label}</span>
            <span class="font-medium text-slate-900">${value}${unit ? ` ${unit}` : ''}</span>
        </div>
    `;
}

// --- NEW FUNCTION ---
// Builds the read-only configuration page from the config.js object
function buildReadOnlyConfigPage() {
    if (!readOnlyConfigContainer) return;

    let allConfigsHTML = '';

    for (const key in configurations) {
        const config = configurations[key];

        // We'll build the HTML string for one card
        const configCardHTML = `
            <section class="bg-white p-6 rounded-lg shadow-lg">
                <h3 class="text-lg font-semibold text-blue-600 border-b border-slate-300 pb-3 mb-5">
                    ${config.name}
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                    
                    <!-- Col 1: Rack Specs (Tote) -->
                    <div>
                        <h4 class="text-base font-semibold text-slate-900 mb-3">
                            1. Rack Specs (Tote)
                        </h4>
                        <div class="space-y-3">
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
                        <h4 class="text-base font-semibold text-slate-900 mb-3">
                            2. Rack Specs (Structure)
                        </h4>
                        <div class="space-y-3">
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
                        <h4 class="text-base font-semibold text-slate-900 mb-3">
                            3. Vertical & Logic
                        </h4>
                        <div class="space-y-3">
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


document.addEventListener('DOMContentLoaded', () => {

    // --- NEW ---
    // Populate the dropdown first
    populateConfigSelect();
    
    // --- NEW ---
    // Build the read-only config page
    buildReadOnlyConfigPage();

    // All inputs that trigger a canvas redraw
    const redrawInputs = [
        // ONLY inputs from the Solver tab should trigger a redraw
        systemLengthInput, systemWidthInput, clearHeightInput,
        detailViewToggle,
        solverConfigSelect // Redraw when the config changes
    ];

    // All inputs that should be formatted as numbers
    // MODIFIED: Drastically simplified list
    const numberInputs = [
        // Solver tab inputs
        systemLengthInput, systemWidthInput, clearHeightInput,
        solverStorageReqInput, solverThroughputReqInput, 
        // MODIFIED: solverAspectRatioInput REMOVED
    ];

    // NEW: Inputs that should be formatted as decimals
    const decimalInputs = [
        solverAspectRatioInput,
    ];

    initializeUI(redrawInputs, numberInputs, decimalInputs); // MODIFIED
    initializeSolver();

    // --- MODIFIED: Removed listener for Comparison tab button ---
});
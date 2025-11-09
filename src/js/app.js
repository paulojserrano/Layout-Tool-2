import { initializeUI } from './ui.js';
import { initializeSolver } from './solver.js';
import { configurations } from './config.js'; // Import configurations
import {
    // --- MAIN SOLVER TAB INPUTS ---
    systemLengthInput, systemWidthInput, clearHeightInput,
    inboundPPHInput, outboundPPHInput, inboundWSRateInput, outboundWSRateInput,
    solverConfigSelect, // Import solverConfigSelect
    detailViewToggle,

    // --- CONFIG TAB INPUTS (for number formatting only) ---
    toteWidthInput, toteLengthInput, toteHeightInput,
    toteQtyPerBayInput, totesDeepSelect,
    toteToToteDistInput, toteToUprightDistInput, toteBackToBackDistInput,
    uprightLengthInput, uprightWidthInput, hookAllowanceInput,
    aisleWidthInput, setbackTopInput, setbackBottomInput,
    layoutModeSelect, flueSpaceInput,
    baseBeamHeightInput, beamWidthInput, minClearanceInput,
    overheadClearanceInput, sprinklerThresholdInput, sprinklerClearanceInput,

    // --- SOLVER INPUTS (for number formatting only) ---
    solverStorageReqInput, solverThroughputReqInput, solverAspectRatioInput, solverMaxPerfDensityInput,
} from './dom.js';

// --- NEW FUNCTION ---
// Populates the solver's configuration dropdown
function populateConfigSelect() {
    if (!solverConfigSelect) return;

    solverConfigSelect.innerHTML = ''; // Clear existing static options

    // Create an option for each entry in the configurations object
    Object.keys(configurations).forEach(key => {
        const config = configurations[key];
        const option = document.createElement('option');
        option.value = key; // The value is the unique key (e.g., "hps3-e2-650-dd")
        option.textContent = config.name; // The text is the friendly name
        solverConfigSelect.appendChild(option);
    });
}

document.addEventListener('DOMContentLoaded', () => {

    // --- NEW ---
    // Populate the dropdown first
    populateConfigSelect();

    // All inputs that trigger a canvas redraw
    const redrawInputs = [
        // ONLY inputs from the Solver tab should trigger a redraw
        systemLengthInput, systemWidthInput, clearHeightInput,
        inboundPPHInput, outboundPPHInput,
        inboundWSRateInput, outboundWSRateInput,
        detailViewToggle,
        solverConfigSelect // Redraw when the config changes
    ];

    // All inputs that should be formatted as numbers
    const numberInputs = [
        // Solver tab inputs
        systemLengthInput, systemWidthInput, clearHeightInput,
        inboundPPHInput, outboundPPHInput, inboundWSRateInput, outboundWSRateInput,
        solverStorageReqInput, solverThroughputReqInput, solverAspectRatioInput, solverMaxPerfDensityInput,

        // Config tab inputs (still need formatting)
        toteWidthInput, toteLengthInput, toteHeightInput,
        toteQtyPerBayInput,
        toteToToteDistInput, toteToUprightDistInput, toteBackToBackDistInput,
        uprightLengthInput, uprightWidthInput, hookAllowanceInput,
        aisleWidthInput, setbackTopInput, setbackBottomInput, flueSpaceInput,
        baseBeamHeightInput, beamWidthInput, minClearanceInput,
        overheadClearanceInput, sprinklerThresholdInput, sprinklerClearanceInput,
    ];

    initializeUI(redrawInputs, numberInputs);
    initializeSolver();
});

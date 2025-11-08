import { initializeUI } from './ui.js';
import { initializeSolver } from './solver.js';
import {
    systemLengthInput, systemWidthInput, clearHeightInput,
    toteWidthInput, toteLengthInput, toteHeightInput,
    toteQtyPerBayInput, totesDeepSelect,
    toteToToteDistInput, toteToUprightDistInput, toteBackToBackDistInput,
    uprightLengthInput, uprightWidthInput, hookAllowanceInput,
    aisleWidthInput, setbackTopInput, setbackBottomInput,
    layoutModeSelect, flueSpaceInput,
    baseBeamHeightInput, beamWidthInput, minClearanceInput,
    overheadClearanceInput, sprinklerThresholdInput, sprinklerClearanceInput,
    inboundPPHInput, outboundPPHInput, inboundWSRateInput, outboundWSRateInput,
    solverStorageReqInput, solverThroughputReqInput, solverAspectRatioInput, solverMaxPerfDensityInput
} from './dom.js';

document.addEventListener('DOMContentLoaded', () => {
    const redrawInputs = [
        systemLengthInput, systemWidthInput, clearHeightInput,
        toteWidthInput, toteLengthInput, toteHeightInput, // Added toteHeight
        toteQtyPerBayInput, totesDeepSelect,
        toteToToteDistInput, toteToUprightDistInput, toteBackToBackDistInput,
        uprightLengthInput, uprightWidthInput, hookAllowanceInput,
        aisleWidthInput, setbackTopInput, setbackBottomInput,
        layoutModeSelect, flueSpaceInput,
        // Add new vertical inputs
        baseBeamHeightInput, beamWidthInput, minClearanceInput,
        overheadClearanceInput, sprinklerThresholdInput, sprinklerClearanceInput,
        // Add performance inputs, as they trigger results recalculation
        inboundPPHInput, outboundPPHInput,
        inboundWSRateInput, outboundWSRateInput
    ];

    const numberInputs = [
        systemLengthInput, systemWidthInput, clearHeightInput,
        toteWidthInput, toteLengthInput, toteHeightInput, // Added toteHeight
        toteQtyPerBayInput,
        toteToToteDistInput, toteToUprightDistInput, toteBackToBackDistInput,
        uprightLengthInput, uprightWidthInput, hookAllowanceInput,
        aisleWidthInput, setbackTopInput, setbackBottomInput, flueSpaceInput,
        // Add new vertical inputs
        baseBeamHeightInput, beamWidthInput, minClearanceInput,
        overheadClearanceInput, sprinklerThresholdInput, sprinklerClearanceInput,
        // Add performance inputs
        inboundPPHInput, outboundPPHInput, inboundWSRateInput, outboundWSRateInput,
        // Add solver inputs
        solverStorageReqInput, solverThroughputReqInput, solverAspectRatioInput, solverMaxPerfDensityInput
    ];

    initializeUI(redrawInputs, numberInputs);
    initializeSolver();
});

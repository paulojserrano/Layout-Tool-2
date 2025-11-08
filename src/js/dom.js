// --- Get All Inputs ---
// Warehouse Constraints
export const systemLengthInput = document.getElementById('systemLength');
export const systemWidthInput = document.getElementById('systemWidth');
export const clearHeightInput = document.getElementById('clearHeight');
// Rack Specifications
export const toteWidthInput = document.getElementById('toteWidth');
export const toteLengthInput = document.getElementById('toteLength');
export const toteHeightInput = document.getElementById('toteHeight'); // New
export const toteQtyPerBayInput = document.getElementById('toteQtyPerBay');
export const totesDeepSelect = document.getElementById('totesDeep');
export const toteToToteDistInput = document.getElementById('toteToToteDist');
export const toteToUprightDistInput = document.getElementById('toteToUprightDist');
export const toteBackToBackDistInput = document.getElementById('toteBackToBackDist');
export const uprightLengthInput = document.getElementById('uprightLength');
export const uprightWidthInput = document.getElementById('uprightWidth');
export const hookAllowanceInput = document.getElementById('hookAllowance');
export const aisleWidthInput = document.getElementById('aisleWidth');
export const setbackTopInput = document.getElementById('setbackTop');
export const setbackBottomInput = document.getElementById('setbackBottom');
export const layoutModeSelect = document.getElementById('layoutMode');
export const flueSpaceInput = document.getElementById('flueSpace');
export const flueSpaceContainer = document.getElementById('flueSpaceContainer');
// Vertical Constraints (New)
export const baseBeamHeightInput = document.getElementById('baseBeamHeight');
export const beamWidthInput = document.getElementById('beamWidth');
export const minClearanceInput = document.getElementById('minClearance');
export const overheadClearanceInput = document.getElementById('overheadClearance');
export const sprinklerThresholdInput = document.getElementById('sprinklerThreshold');
export const sprinklerClearanceInput = document.getElementById('sprinklerClearance');
// Performance
export const inboundPPHInput = document.getElementById('inboundPPH');
export const outboundPPHInput = document.getElementById('outboundPPH');
export const inboundWSRateInput = document.getElementById('inboundWSRate');
export const outboundWSRateInput = document.getElementById('outboundWSRate');

// Get summary elements (on config tab)
export const summaryTotalBays = document.getElementById('summaryTotalBays');
export const summaryMaxLevels = document.getElementById('summaryMaxLevels'); // New
export const summaryTotalLocations = document.getElementById('summaryTotalLocations'); // New
export const summaryFootprint = document.getElementById('summaryFootprint');
export const summaryPerfDensity = document.getElementById('summaryPerfDensity');
export const summaryInboundWS = document.getElementById('summaryInboundWS');
export const summaryOutboundWS = document.getElementById('summaryOutboundWS');

// Get Canvases and Contexts
export const warehouseCanvas = document.getElementById('warehouseCanvas');
export const warehouseCtx = warehouseCanvas.getContext('2d');
export const rackDetailCanvas = document.getElementById('rackDetailCanvas');
export const rackDetailCtx = rackDetailCanvas.getContext('2d');
export const elevationCanvas = document.getElementById('elevationCanvas'); // New
export const elevationCtx = elevationCanvas.getContext('2d'); // New

// Get Tab elements
export const mainViewTabs = document.getElementById('mainViewTabs'); // NEW
export const viewSubTabs = document.getElementById('viewSubTabs'); // Renamed

// --- NEW: Solver Elements ---
export const solverConfigSelect = document.getElementById('solverConfigSelect'); // NEW
export const solverStorageReqInput = document.getElementById('solverStorageReq');
export const solverThroughputReqInput = document.getElementById('solverThroughputReq');
export const solverAspectRatioInput = document.getElementById('solverAspectRatio');
export const solverMaxPerfDensityInput = document.getElementById('solverMaxPerfDensity');
export const runSolverButton = document.getElementById('runSolverButton');
export const solverStatus = document.getElementById('solverStatus');
export const solverResultLength = document.getElementById('solverResultLength');
export const solverResultWidth = document.getElementById('solverResultWidth');
export const solverResultFootprint = document.getElementById('solverResultFootprint');
export const solverResultLocations = document.getElementById('solverResultLocations');
export const solverResultPerfDensity = document.getElementById('solverResultPerfDensity');
export const applySolverButton = document.getElementById('applySolverButton');
export const solverModal = document.getElementById('solverModal');
export const solverModalMessage = document.getElementById('solverModalMessage');
export const solverModalContinue = document.getElementById('solverModalContinue');
export const solverModalStop = document.getElementById('solverModalStop');
export const solverModalBackdrop = document.getElementById('solverModalBackdrop');

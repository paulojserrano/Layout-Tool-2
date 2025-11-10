// --- Get All Inputs ---
// Warehouse Constraints (Global)
export const systemLengthInput = document.getElementById('systemLength');
export const systemWidthInput = document.getElementById('systemWidth');
export const clearHeightInput = document.getElementById('clearHeight');

// --- Config Tab Inputs (ALL REMOVED) ---
// All inputs from the config tab are gone.

// Get Canvases and Contexts
export const warehouseCanvas = document.getElementById('warehouseCanvas');
export const warehouseCtx = warehouseCanvas.getContext('2d');
export const rackDetailCanvas = document.getElementById('rackDetailCanvas');
export const rackDetailCtx = rackDetailCanvas.getContext('2d');
export const elevationCanvas = document.getElementById('elevationCanvas'); // New
export const elevationCtx = elevationCanvas.getContext('2d'); // New

// Get Tab elements
export const mainViewTabs = document.getElementById('mainViewTabs'); // NEW
// MODIFICATION: Removed viewSubTabs
// export const viewSubTabs = document.getElementById('viewSubTabs'); // Renamed

// --- NEW: Solver Elements ---
export const solverConfigSelect = document.getElementById('solverConfigSelect'); // NEW
export const solverStorageReqInput = document.getElementById('solverStorageReq');
export const solverThroughputReqInput = document.getElementById('solverThroughputReq');
export const solverAspectRatioInput = document.getElementById('solverAspectRatio');
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

// --- NEW: Solver Result Metrics ---
export const solverResultGrossVolume = document.getElementById('solverResultGrossVolume');
export const solverResultTotalBays = document.getElementById('solverResultTotalBays');
export const solverResultCapacityUtil = document.getElementById('solverResultCapacityUtil');
export const solverResultRowsAndBays = document.getElementById('solverResultRowsAndBays');


// --- NEW: Detail View Toggle ---
export const detailViewToggle = document.getElementById('detailViewToggle');

// --- NEW: Read-Only Config Container ---
export const readOnlyConfigContainer = document.getElementById('readOnlyConfigContainer');

// --- NEW: Comparison Tab Elements ---
export const comparisonTabButton = document.getElementById('comparisonTabButton');
export const comparisonTabContent = document.getElementById('comparisonTabContent');
export const runAllOptionsContainer = document.getElementById('runAllOptionsContainer');
export const runAllOptionsButton = document.getElementById('runAllOptionsButton');
export const runAllStatus = document.getElementById('runAllStatus');
export const comparisonResultsContainer = document.getElementById('comparisonResultsContainer');
// --- Get All Inputs ---
// Warehouse Constraints (Global)
export let warehouseLengthInput;
export let warehouseWidthInput;
export let clearHeightInput;
export let warehouseLengthContainer;
export let warehouseWidthContainer;

// Get Canvases and Contexts
export let warehouseCanvas;
export let warehouseCtx;
export let rackDetailCanvas;
export let rackDetailCtx;
export let elevationCanvas;
export let elevationCtx;

// NEW: 3D View Container
export let viewContainer3D;
export let bomList; // NEW

// Get Tab elements
export let mainViewTabs;

// --- NEW: Layout Panels (For full width toggling) ---
export let leftPanel;
export let rightPanel;
export let manualTabContent;
export let runButtonText;

// --- NEW: Solver Elements ---
export let solverStorageReqInput;
export let solverThroughputReqInput;
export let solverToteSizeSelect;
// NEW: Solver Height Select
export let solverToteHeightSelect;

export let solverEquivalentVolumeCheckbox;
export let solverExpandPDCheckbox;
export let solverReduceLevelsCheckbox;
export let solverRespectConstraintsCheckbox;
export let runSolverButton;

// --- NEW: Solver Method ---
export let solverMethodSelect;
export let aspectRatioInputContainer;
export let fixedLengthInputContainer;
export let fixedWidthInputContainer;
export let solverAspectRatioInput;
export let solverFixedLength;
export let solverFixedWidth;

// --- NEW: Manual Mode Inputs ---
export let manualInputContainer;
export let solverManualLength;
export let solverManualWidth;
export let manualSystemConfigSelect;
// NEW: Manual Elements
export let manualToteSizeSelect;
export let manualToteHeightSelect;
export let manualThroughputInput;
export let manualClearHeightInput;
export let manualLengthSlider;
export let manualWidthSlider;
export let manualLengthValue;
export let manualWidthValue;
export let solverFooter;

// --- NEW: Solver Input Containers ---
export let solverRequirementsContainer;
export let solverStorageReqContainer;
export let solverEquivalentVolumeContainer;
export let solverOptionsContainer;

// --- NEW: Robot Path Inputs ---
export let robotPathTopLinesInput;
export let robotPathBottomLinesInput;
export let robotPathAddLeftACRCheckbox;
export let robotPathAddRightACRCheckbox;
export let robotPathACRContainer;

// --- NEW: Setback Inputs ---
export let userSetbackTopInput;
export let userSetbackBottomInput;
export let userSetbackLeftInput;
export let userSetbackRightInput;

// --- NEW: Live Metrics ---
export let adjustedLocationsDisplay;

// Results & Layout
export let solverConfigStatus;
export let solverParametersSection;
export let solverResultsSection;
export let solverVisualizationsSection;
export let solverConfigResultsContainer;
export let solverConfigResultsScroller;
export let solverResultLength;
export let solverResultWidth;
export let solverResultFootprint;
export let solverResultLocations;
export let solverResultPerfDensity;
export let solverResultLengthWarning;
export let solverResultWidthWarning;
export let exportResultsButton;

// --- NEW: Solver Result Metrics ---
export let solverResultGrossVolume;
export let solverResultTotalBays;
export let solverResultCapacityUtil;
export let solverResultRowsAndBays;
// NEW: PD Utilization
export let solverResultPDUtil;
export let solverResultRobotCount;

// NEW: Unit Toggle Elements
export let unitToggle;
export let solverResultFootprintUnit;
export let solverResultGrossVolumeUnit;
// NEW: PD Util Card for Color Styling
export let pdUtilCard;


export let detailViewToggle;
export let readOnlyConfigContainer;

// --- NEW: Layout Metrics Table Elements ---
export let metricRowStdConfig;
export let metricStdConfigLabel;
export let metricStdConfigLocsLvl;
export let metricStdConfigLevels;
export let metricStdConfigBays;
export let metricStdConfigLocsTotal;

export let metricRowStdSingle;
export let metricStdSingleLabel;
export let metricStdSingleLocsLvl;
export let metricStdSingleLevels;
export let metricStdSingleBays;
export let metricStdSingleLocsTotal;

export let metricRowBpConfig;
export let metricBpConfigLabel;
export let metricBpConfigLocsLvl;
export let metricBpConfigLevels;
export let metricBpConfigBays;
export let metricBpConfigLocsTotal;

export let metricRowTunConfig;
export let metricTunConfigLabel;
export let metricTunConfigLocsLvl;
export let metricTunConfigLevels;
export let metricTunConfigBays;
export let metricTunConfigLocsTotal;

export let metricTotBays;
export let metricTotLocsTotal;

// --- NEW: Debug Tab ---
export let debugBayListBody;

// --- NEW: Auth Elements ---
export let userProfileContainer;
export let userProfileName;

// --- NEW: Visualization Tabs & Containers ---
export let visTabsNav;
export let viewContainerWarehouse;
export let viewContainerElevation;
export let viewContainerDetail;

// Placeholders for other tools
export let btnFetchSharePoint;
export let sharepointStatus;
export let sharepointTableBody;
export let sharepointRawOutput;

export let analyzerClearHeightInput;
export let analyzerThroughputInput;
export let analyzerStorageStartInput;
export let analyzerStorageEndInput;
export let analyzerStorageStepInput;
export let analyzerConfigChecklist;
export let runAnalyzerButton;
export let analyzerStatus;
export let analyzerChartsSection;
export let analyzerChartFootprint;
export let analyzerChartPerfDensity;
export let analyzerChartTotalBays;

export let calculatorFileInput;
export let exportCalculatorButton;
export let calculatorStatus;

export function refreshDOMElements() {
    warehouseLengthInput = document.getElementById('warehouseLength');
    warehouseWidthInput = document.getElementById('warehouseWidth');
    clearHeightInput = document.getElementById('clearHeight');
    warehouseLengthContainer = document.getElementById('warehouseLengthContainer');
    warehouseWidthContainer = document.getElementById('warehouseWidthContainer');

    warehouseCanvas = document.getElementById('warehouseCanvas');
    if (warehouseCanvas) warehouseCtx = warehouseCanvas.getContext('2d');
    rackDetailCanvas = document.getElementById('rackDetailCanvas');
    if (rackDetailCanvas) rackDetailCtx = rackDetailCanvas.getContext('2d');
    elevationCanvas = document.getElementById('elevationCanvas');
    if (elevationCanvas) elevationCtx = elevationCanvas.getContext('2d');

    viewContainer3D = document.getElementById('viewContainer-3d');
    bomList = document.getElementById('bomList');

    mainViewTabs = document.getElementById('mainViewTabs');

    leftPanel = document.getElementById('leftPanel');
    rightPanel = document.getElementById('rightPanel');
    manualTabContent = document.getElementById('manualTabContent');
    runButtonText = document.getElementById('runButtonText');

    solverStorageReqInput = document.getElementById('solverStorageReq');
    solverThroughputReqInput = document.getElementById('solverThroughputReq');
    solverToteSizeSelect = document.getElementById('solverToteSizeSelect');
    solverToteHeightSelect = document.getElementById('solverToteHeightSelect');

    solverEquivalentVolumeCheckbox = document.getElementById('solverEquivalentVolumeCheckbox');
    solverExpandPDCheckbox = document.getElementById('solverExpandPDCheckbox');
    solverReduceLevelsCheckbox = document.getElementById('solverReduceLevelsCheckbox');
    solverRespectConstraintsCheckbox = document.getElementById('solverRespectConstraintsCheckbox');
    runSolverButton = document.getElementById('runSolverButton');

    solverMethodSelect = document.getElementById('solverMethodSelect');
    aspectRatioInputContainer = document.getElementById('aspectRatioInputContainer');
    fixedLengthInputContainer = document.getElementById('fixedLengthInputContainer');
    fixedWidthInputContainer = document.getElementById('fixedWidthInputContainer');
    solverAspectRatioInput = document.getElementById('solverAspectRatio');
    solverFixedLength = document.getElementById('solverFixedLength');
    solverFixedWidth = document.getElementById('solverFixedWidth');

    manualInputContainer = document.getElementById('manualInputContainer');
    solverManualLength = document.getElementById('solverManualLength');
    solverManualWidth = document.getElementById('solverManualWidth');
    manualSystemConfigSelect = document.getElementById('manualSystemConfigSelect');
    manualToteSizeSelect = document.getElementById('manualToteSizeSelect');
    manualToteHeightSelect = document.getElementById('manualToteHeightSelect');
    manualThroughputInput = document.getElementById('manualThroughputInput');
    manualClearHeightInput = document.getElementById('manualClearHeightInput');
    manualLengthSlider = document.getElementById('manualLengthSlider');
    manualWidthSlider = document.getElementById('manualWidthSlider');
    manualLengthValue = document.getElementById('manualLengthValue');
    manualWidthValue = document.getElementById('manualWidthValue');
    solverFooter = document.getElementById('solverFooter');

    solverRequirementsContainer = document.getElementById('solverRequirementsContainer');
    solverStorageReqContainer = document.getElementById('solverStorageReqContainer');
    solverEquivalentVolumeContainer = document.getElementById('solverEquivalentVolumeContainer');
    solverOptionsContainer = document.getElementById('solverOptionsContainer');

    robotPathTopLinesInput = document.getElementById('robotPathTopLines');
    robotPathBottomLinesInput = document.getElementById('robotPathBottomLines');
    robotPathAddLeftACRCheckbox = document.getElementById('robotPathAddLeftACR');
    robotPathAddRightACRCheckbox = document.getElementById('robotPathAddRightACR');
    robotPathACRContainer = document.getElementById('robotPathACRContainer');

    userSetbackTopInput = document.getElementById('userSetbackTop');
    userSetbackBottomInput = document.getElementById('userSetbackBottom');
    userSetbackLeftInput = document.getElementById('userSetbackLeft');
    userSetbackRightInput = document.getElementById('userSetbackRight');

    adjustedLocationsDisplay = document.getElementById('adjustedLocationsDisplay');

    solverConfigStatus = document.getElementById('solverConfigStatus');
    solverParametersSection = document.getElementById('solverParametersSection');
    solverResultsSection = document.getElementById('solverResultsSection');
    solverVisualizationsSection = document.getElementById('solverVisualizationsSection');
    solverConfigResultsContainer = document.getElementById('solverConfigResultsContainer');
    solverConfigResultsScroller = document.getElementById('solverConfigResultsScroller');
    solverResultLength = document.getElementById('solverResultLength');
    solverResultWidth = document.getElementById('solverResultWidth');
    solverResultFootprint = document.getElementById('solverResultFootprint');
    solverResultLocations = document.getElementById('solverResultLocations');
    solverResultPerfDensity = document.getElementById('solverResultPerfDensity');
    solverResultLengthWarning = document.getElementById('solverResultLengthWarning');
    solverResultWidthWarning = document.getElementById('solverResultWidthWarning');
    exportResultsButton = document.getElementById('exportResultsButton');

    solverResultGrossVolume = document.getElementById('solverResultGrossVolume');
    solverResultTotalBays = document.getElementById('solverResultTotalBays');
    solverResultCapacityUtil = document.getElementById('solverResultCapacityUtil');
    solverResultRowsAndBays = document.getElementById('solverResultRowsAndBays');
    solverResultPDUtil = document.getElementById('solverResultPDUtil');
    solverResultRobotCount = document.getElementById('solverResultRobotCount');

    unitToggle = document.getElementById('unitToggle');
    solverResultFootprintUnit = document.getElementById('solverResultFootprintUnit');
    solverResultGrossVolumeUnit = document.getElementById('solverResultGrossVolumeUnit');
    pdUtilCard = document.getElementById('pdUtilCard');

    detailViewToggle = document.getElementById('detailViewToggle');
    readOnlyConfigContainer = document.getElementById('readOnlyConfigContainer');

    metricRowStdConfig = document.getElementById('metric-row-std-config');
    metricStdConfigLabel = document.getElementById('metric-std-config-label');
    metricStdConfigLocsLvl = document.getElementById('metric-std-config-locs-lvl');
    metricStdConfigLevels = document.getElementById('metric-std-config-levels');
    metricStdConfigBays = document.getElementById('metric-std-config-bays');
    metricStdConfigLocsTotal = document.getElementById('metric-std-config-locs-total');

    metricRowStdSingle = document.getElementById('metric-row-std-single');
    metricStdSingleLabel = document.getElementById('metric-std-single-label');
    metricStdSingleLocsLvl = document.getElementById('metric-std-single-locs-lvl');
    metricStdSingleLevels = document.getElementById('metric-std-single-levels');
    metricStdSingleBays = document.getElementById('metric-std-single-bays');
    metricStdSingleLocsTotal = document.getElementById('metric-std-single-locs-total');

    metricRowBpConfig = document.getElementById('metric-row-bp-config');
    metricBpConfigLabel = document.getElementById('metric-bp-config-label');
    metricBpConfigLocsLvl = document.getElementById('metric-bp-config-locs-lvl');
    metricBpConfigLevels = document.getElementById('metric-bp-config-levels');
    metricBpConfigBays = document.getElementById('metric-bp-config-bays');
    metricBpConfigLocsTotal = document.getElementById('metric-bp-config-locs-total');

    metricRowTunConfig = document.getElementById('metric-row-tun-config');
    metricTunConfigLabel = document.getElementById('metric-tun-config-label');
    metricTunConfigLocsLvl = document.getElementById('metric-tun-config-locs-lvl');
    metricTunConfigLevels = document.getElementById('metric-tun-config-levels');
    metricTunConfigBays = document.getElementById('metric-tun-config-bays');
    metricTunConfigLocsTotal = document.getElementById('metric-tun-config-locs-total');

    metricTotBays = document.getElementById('metric-tot-bays');
    metricTotLocsTotal = document.getElementById('metric-tot-locs-total');

    debugBayListBody = document.getElementById('debugBayListBody');

    userProfileContainer = document.getElementById('userProfileContainer');
    userProfileName = document.getElementById('userProfileName');

    visTabsNav = document.getElementById('visTabsNav');
    viewContainerWarehouse = document.getElementById('viewContainer-warehouse');
    viewContainerElevation = document.getElementById('viewContainer-elevation');
    viewContainerDetail = document.getElementById('viewContainer-detail');

    btnFetchSharePoint = document.getElementById('btnFetchSharePoint');
    sharepointStatus = document.getElementById('sharepointStatus');
    sharepointTableBody = document.getElementById('sharepointTableBody');
    sharepointRawOutput = document.getElementById('sharepointRawOutput');

    analyzerClearHeightInput = document.getElementById('analyzerClearHeight');
    analyzerThroughputInput = document.getElementById('analyzerThroughput');
    analyzerStorageStartInput = document.getElementById('analyzerStorageStart');
    analyzerStorageEndInput = document.getElementById('analyzerStorageEnd');
    analyzerStorageStepInput = document.getElementById('analyzerStorageStep');
    analyzerConfigChecklist = document.getElementById('analyzerConfigChecklist');
    runAnalyzerButton = document.getElementById('runAnalyzerButton');
    analyzerStatus = document.getElementById('analyzerStatus');
    analyzerChartsSection = document.getElementById('analyzerChartsSection');
    analyzerChartFootprint = document.getElementById('analyzerChartFootprint');
    analyzerChartPerfDensity = document.getElementById('analyzerChartPerfDensity');
    analyzerChartTotalBays = document.getElementById('analyzerChartTotalBays');

    calculatorFileInput = document.getElementById('calculatorFileInput');
    exportCalculatorButton = document.getElementById('exportCalculatorButton');
    calculatorStatus = document.getElementById('calculatorStatus');
}

// Initial call to populate with initial DOM state (which might be empty until refreshed)
refreshDOMElements();

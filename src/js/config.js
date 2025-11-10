/* This file now defines all available, hardcoded configurations.
Each configuration object must contain ALL parameters needed for a full calculation.
The `defaultConfig` variable is no longer used by the solver but is kept
as a template for creating new configurations.
*/

// This object is a template for creating new configs.
export const configTemplate = {
    "name": "TEMPLATE: System - ToteSize - Depth",
    
    // NEW: Grouped LISP export properties
    "lispExportProps": {
        "standard": {
            "blockName": "BAY_STD_TEMPLATE",
            "color": 256, // 256 = ByLayer
            "rotation": 0,
            "xOffset": 0,
            "yOffset": 0
        },
        "backpack": {
            "blockName": "BAY_BP_TEMPLATE",
            "color": 5, // Blue
            "rotation": 0,
            "xOffset": 0,
            "yOffset": 0
        },
        "tunnel": {
            "blockName": "BAY_TUN_TEMPLATE",
            "color": 2, // Yellow
            "rotation": 90,
            "xOffset": 0,
            "yOffset": 0
        }
    },
    "dynamicPropName": "BayType", // NEW: For LISP export
    
    "layout-mode": "s-d-s",
    "top-setback": 3000,
    "bottom-setback": 3000,
    "setback-left": 1500, // NEW
    "setback-right": 1500, // NEW
    "considerTunnels": true, // NEW
    "considerBackpacks": true, // NEW
    "tote-width": 400,
    "tote-length": 600,
    "tote-height": 320,
    "tote-qty-per-bay": 4,
    "totes-deep": 2,
    "tote-to-tote-dist": 25,
    "tote-to-upright-dist": 50,
    "tote-back-to-back-dist": 0,
    "upright-length": 100,
    "upright-width": 100,
    "hook-allowance": 0,
    "aisle-width": 2400,
    "rack-flue-space": 150,
    "base-beam-height": 150,
    "beam-width": 127,
    "min-clearance": 100,
    "overhead-clearance": 500,
    "sprinkler-threshold": 7620,
    "sprinkler-clearance": 450,
    "max-perf-density": 50, // REQ 4: Added
};

// This is the main object that will power the application.
// The KEY (e.g., "hps3-e2-650-dd") is a unique ID.
// The "name" property is what the user will see in the dropdown.
export const configurations = {
    "hps3-e2-650-dd": {
        "name": "HPS3-E2 - 650x450x300 - Double Deep",
        // NEW: Grouped LISP export properties
        "lispExportProps": {
            "standard": {
                "blockName": "Robots-RKKK_1-Double Row Double Deep Rack-4×2",
                "color": 256, // ByLayer
                "rotation": 90,
                "xOffset": 0,
                "yOffset": 0
            },
            "backpack": {
                "blockName": "Robots-RK_1-Double Row Double Deep Rack-4×2",
                "color": 5, // Blue
                "rotation": 90,
                "xOffset": 0,
                "yOffset": 0
            },
            "tunnel": {
                "blockName": "Robots-RK_1-Double Row Double Deep Rack-4×2",
                "color": 2, // Yellow
                "rotation": 90,
                "xOffset": 0,
                "yOffset": 0
            }
        },
        "dynamicPropName": "BayType", // NEW: For LISP export
        "layout-mode": "s-d-s",
        "top-setback": 3000,
        "bottom-setback": 3000,
        "setback-left": 1500, // NEW
        "setback-right": 1500, // NEW
        "considerTunnels": true, // NEW
        "considerBackpacks": true, // NEW
        "tote-width": 650,
        "tote-length": 450,
        "tote-height": 300,
        "tote-qty-per-bay": 4,
        "totes-deep": 2,
        "tote-to-tote-dist": 40,
        "tote-to-upright-dist": 70,
        "tote-back-to-back-dist": 0,
        "upright-length": 90,
        "upright-width": 70,
        "hook-allowance": 90,
        "aisle-width": 1160,
        "rack-flue-space": 150,
        "base-beam-height": 430,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4572,
        "sprinkler-clearance": 200,
        "max-perf-density": 1.2, // REQ 4: Added
    },
    "hps3-e2-650-td": {
        "name": "HPS3-E2 - 650x450x300 - Triple Deep",
        // NEW: Grouped LISP export properties
        "lispExportProps": {
            "standard": {
                "blockName": "HPS3-E2-650-TD-STD",
                "color": 256,
                "rotation": 0,
                "xOffset": 0,
                "yOffset": 0
            },
            "backpack": {
                "blockName": "HPS3-E2-650-TD-BP",
                "color": 5,
                "rotation": 0,
                "xOffset": 0,
                "yOffset": 0
            },
            "tunnel": {
                "blockName": "HPS3-E2-650-TD-TUN",
                "color": 2,
                "rotation": 90,
                "xOffset": 0,
                "yOffset": 0
            }
        },
        "dynamicPropName": "BayType", // NEW: For LISP export
        "layout-mode": "s-d-s",
        "top-setback": 3000,
        "bottom-setback": 3000,
        "setback-left": 1500, // NEW
        "setback-right": 1500, // NEW
        "considerTunnels": true, // NEW
        "considerBackpacks": true, // NEW
        "tote-width": 650,
        "tote-length": 450,
        "tote-height": 300,
        "tote-qty-per-bay": 4,
        "totes-deep": 3,
        "tote-to-tote-dist": 40,
        "tote-to-upright-dist": 70,
        "tote-back-to-back-dist": 0,
        "upright-length": 90,
        "upright-width": 70,
        "hook-allowance": 90,
        "aisle-width": 1160,
        "rack-flue-space": 150,
        "base-beam-height": 430,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4572,
        "sprinkler-clearance": 200,
        "max-perf-density": 0.65, // REQ 4: Added
    },
    "hps3-e2-850-dd": {
        "name": "HPS3-E2 - 850x650x400 - Double Deep",
        // NEW: Grouped LISP export properties
        "lispExportProps": {
            "standard": {
                "blockName": "HPS3-E2-850-DD-STD",
                "color": 256,
                "rotation": 0,
                "xOffset": 0,
                "yOffset": 0
            },
            "backpack": {
                "blockName": "HPS3-E2-850-DD-BP",
                "color": 5,
                "rotation": 0,
                "xOffset": 0,
                "yOffset": 0
            },
            "tunnel": {
                "blockName": "HPS3-E2-850-DD-TUN",
                "color": 2,
                "rotation": 90,
                "xOffset": 0,
                "yOffset": 0
            }
        },
        "dynamicPropName": "BayType", // NEW: For LISP export
        "layout-mode": "s-d-s",
        "top-setback": 3000,
        "bottom-setback": 3000,
        "setback-left": 1500, // NEW
        "setback-right": 1500, // NEW
        "considerTunnels": true, // NEW
        "considerBackpacks": true, // NEW
        "tote-width": 850,
        "tote-length": 650,
        "tote-height": 400,
        "tote-qty-per-bay": 3, // Example change
        "totes-deep": 2,
        "tote-to-tote-dist": 50, // Example change
        "tote-to-upright-dist": 75, // Example change
        "tote-back-to-back-dist": 0,
        "upright-length": 100, // Example change
        "upright-width": 80, // Example change
        "hook-allowance": 90,
        "aisle-width": 1380, // Example change
        "rack-flue-space": 150,
        "base-beam-height": 430,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4572,
        "sprinkler-clearance": 500,
        "max-perf-density": 1, // REQ 4: Added
    },
    "HPC": {
        "name": "HPC - Single Deep",
        // NEW: Grouped LISP export properties
        "lispExportProps": {
            "standard": {
                "blockName": "HPS3-E2-850-DD-STD",
                "color": 256,
                "rotation": 0,
                "xOffset": 0,
                "yOffset": 0
            },
            "backpack": {
                "blockName": "HPS3-E2-850-DD-BP",
                "color": 5,
                "rotation": 0,
                "xOffset": 0,
                "yOffset": 0
            },
            "tunnel": {
                "blockName": "HPS3-E2-850-DD-TUN",
                "color": 2,
                "rotation": 90,
                "xOffset": 0,
                "yOffset": 0
            }
        },
        "dynamicPropName": "BayType", // NEW: For LISP export
        "layout-mode": "all-singles",
        "top-setback": 1500,
        "bottom-setback": 3950,
        "setback-left": 200, // NEW
        "setback-right": 200, // NEW
        "considerTunnels": false, // NEW
        "considerBackpacks": false, // NEW
        "tote-width": 650,
        "tote-length": 450,
        "tote-height": 300,
        "tote-qty-per-bay": 3, // Example change
        "totes-deep": 2,
        "tote-to-tote-dist": 140, // Example change
        "tote-to-upright-dist": 25, // Example change
        "tote-back-to-back-dist": 30,
        "upright-length": 90, // Example change
        "upright-width": 70, // Example change
        "hook-allowance": 0,
        "aisle-width": 900, // Example change
        "rack-flue-space": 150,
        "base-beam-height": 900,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4572,
        "sprinkler-clearance": 200,
        "max-perf-density": 2.5, // REQ 4: Added
    },
    "hps3-e2-850-td": {
        "name": "HPS3-E2 - 850x650x400 - Triple Deep",
        // NEW: Grouped LISP export properties
        "lispExportProps": {
            "standard": {
                "blockName": "HPS3-E2-850-TD-STD",
                "color": 256,
                "rotation": 0,
                "xOffset": 0,
                "yOffset": 0
            },
            "backpack": {
                "blockName": "HPS3-E2-850-TD-BP",
                "color": 5,
                "rotation": 0,
                "xOffset": 0,
                "yOffset": 0
            },
            "tunnel": {
                "blockName": "HPS3-E2-850-TD-TUN",
                "color": 2,
                "rotation": 90,
                "xOffset": 0,
                "yOffset": 0
            }
        },
        "dynamicPropName": "BayType", // NEW: For LISP export
        "layout-mode": "s-d-s",
        "top-setback": 3000,
        "bottom-setback": 3000,
        "setback-left": 1500, // NEW
        "setback-right": 1500, // NEW
        "considerTunnels": true, // NEW
        "considerBackpacks": true, // NEW
        "tote-width": 850,
        "tote-length": 650,
        "tote-height": 400,
        "tote-qty-per-bay": 3,
        "totes-deep": 3,
        "tote-to-tote-dist": 50,
        "tote-to-upright-dist": 75,
        "tote-back-to-back-dist": 0,
        "upright-length": 100,
        "upright-width": 80,
        "hook-allowance": 90,
        "aisle-width": 1380,
        "rack-flue-space": 150,
        "base-beam-height": 430,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4000,
        "sprinkler-clearance": 500,
        "max-perf-density": 0.4, // REQ 4: Added
    }
    // Add more configurations here following the same pattern
};

// This export is no longer needed by the solver, but we keep it
// in case other files were importing it.
export const defaultConfig = {};
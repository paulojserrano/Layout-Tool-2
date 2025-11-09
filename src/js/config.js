/* This file now defines all available, hardcoded configurations.
Each configuration object must contain ALL parameters needed for a full calculation.
The `defaultConfig` variable is no longer used by the solver but is kept
as a template for creating new configurations.
*/

// This object is a template for creating new configs.
export const configTemplate = {
    "name": "TEMPLATE: System - ToteSize - Depth",
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
    "flue-space": 150,
    "base-beam-height": 150,
    "beam-width": 127,
    "min-clearance": 100,
    "overhead-clearance": 500,
    "sprinkler-threshold": 7620,
    "sprinkler-clearance": 450,
};

// This is the main object that will power the application.
// The KEY (e.g., "hps3-e2-650-dd") is a unique ID.
// The "name" property is what the user will see in the dropdown.
export const configurations = {
    "hps3-e2-650-dd": {
        "name": "HPS3-E2 - 650x450x300 - Double Deep",
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
        "aisle-width": 1500,
        "flue-space": 150,
        "base-beam-height": 430,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4000,
        "sprinkler-clearance": 500,
    },
    "hps3-e2-650-td": {
        "name": "HPS3-E2 - 650x450x300 - Triple Deep",
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
        "aisle-width": 1500,
        "flue-space": 150,
        "base-beam-height": 430,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4000,
        "sprinkler-clearance": 500,
    },
    "hps3-e2-850-dd": {
        "name": "HPS3-E2 - 850x650x400 - Double Deep",
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
        "aisle-width": 1600, // Example change
        "flue-space": 150,
        "base-beam-height": 430,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4000,
        "sprinkler-clearance": 500,
    },
    "hps3-e2-850-td": {
        "name": "HPS3-E2 - 850x650x400 - Triple Deep",
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
        "aisle-width": 1600,
        "flue-space": 150,
        "base-beam-height": 430,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4000,
        "sprinkler-clearance": 500,
    }
    // Add more configurations here following the same pattern
};

// This export is no longer needed by the solver, but we keep it
// in case other files were importing it.
export const defaultConfig = {};

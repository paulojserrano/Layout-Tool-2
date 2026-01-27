/* CONFIG.JS
   Defines the static properties of the system (Dimensions, Block Names, Layers)
   AND the export-specific logic (Rotations, Offsets).
   Dynamic properties are defined once per rackType.
*/

export const configTemplate = {
    "name": "TEMPLATE",
    "lispExportProps": {
        "singleRack": {
            "base": { "rotation": 0, "xOffset": 0, "yOffset": 0 },
            "overrides": {
                "oddRow": { "rotation": 180, "xOffset": 0, "yOffset": 0 },
                "lastRow": { "rotation": 180, "xOffset": 0, "yOffset": 0 }
            },
            "dynamicProps": [
                { "name": "Tote width", "configKey": "tote-length" },
                { "name": "Tote length", "configKey": "tote-width" },
                { "name": "Tote height", "configKey": "tote-height" }
            ],
            "standard": { "blockName": "BAY_STD_S", "color": 256, "layer": "RACK-STD" },
            "backpack": { "blockName": "BAY_BP_S", "color": 5, "layer": "RACK-BP" },
            "tunnel": { "blockName": "BAY_TUN_S", "color": 2, "layer": "RACK-TUN" }
        },
        "doubleRack": {
            "base": { "rotation": 0, "xOffset": 0, "yOffset": 0 },
            "overrides": {
                "oddRow": { "rotation": 180, "xOffset": 0, "yOffset": 0 }
            },
            "dynamicProps": [
                { "name": "Tote width", "configKey": "tote-length" },
                { "name": "Tote length", "configKey": "tote-width" },
                { "name": "Tote height", "configKey": "tote-height" }
            ],
            "standard": { "blockName": "BAY_STD_D", "color": 256, "layer": "RACK-STD" },
            "backpack": { "blockName": "BAY_BP_D", "color": 5, "layer": "RACK-BP" },
            "tunnel": { "blockName": "BAY_TUN_D", "color": 2, "layer": "RACK-TUN" }
        }
    },
    // ... standard dimensions ...
    "layout-mode": "s-d-s",
    "top-setback": 3000,
    "bottom-setback": 3000,
    "setback-left": 1500,
    "setback-right": 1500,
    "considerTunnels": true,
    "considerBackpacks": true,
    "hasBufferLayer": false,
    "tote-width": 400,
    "tote-length": 600,
    // "tote-height": 320, // Removed, now user input
    "tote-qty-per-bay": 4,
    "totes-deep": 2,
    "tote-to-tote-dist": 25,
    "tote-to-upright-dist": 50,
    "tote-back-to-back-dist": 0,
    "upright-length": 100,
    "upright-width": 100,
    "hook-allowance": 0,
    "aisle-width-low": 2400, // < 10m
    "aisle-width-high": 2400, // > 10m
    "rack-flue-space": 152.4,
    "base-beam-height": 150,
    "beam-width": 127,
    "min-clearance": 100,
    "overhead-clearance": 500,
    "sprinkler-threshold": 7620,
    "sprinkler-clearance": 450,
    "max-perf-density": 50,
};

export const configurations = {
    "hps3-e2-650-dd": {
        "name": "HPS3-E2 - 650x450 - Double Deep",
        "lispExportProps": {
            "singleRack": {
                "base": { "rotation": 90, "xOffset": 0, "yOffset": 0 },
                "overrides": {
                    "physicalOddRow": { "rotation": 270, "xOffset": { "type": "calculatedRackDepthNegative" }, "yOffset": { "type": "calculatedBayLength", "add": { "type": "toteToUprightMinus", "value": 40 } } }
                },
                "dynamicProps": [

                    { "name": "Tote width", "configKey": "tote-length" },
                    { "name": "Tote length", "configKey": "tote-width" },
                    { "name": "Back-to-back Spacing", "configKey": "tote-back-to-back-dist" },
                    { "name": "Tote-to-rack Spacing1", "configKey": "tote-to-upright-dist" },
                    { "name": "Tote-to-rack Spacing2", "configKey": "tote-to-upright-dist" },
                    { "name": "Rack width", "type": "calculatedRackWidth" }
                ],
                "standard": { "blockName": "Robots-RKKK_1-Double Row Double Deep Rack-4x2", "color": 161, "layer": "RACK-STD" },
                "backpack": { "blockName": "Robots-RK_1-Double Row Double Deep Rack-4x2", "color": 4, "layer": "RACK-BP" },
                "tunnel": { "blockName": "Robots-RK_1-Double Row Double Deep Rack-4x2", "color": 6, "layer": "RACK-TUN" }
            },
            "doubleRack": {
                "base": { "rotation": 90, "xOffset": 0, "yOffset": 0 },
                "overrides": {
                    "physicalOddRow": { "rotation": 270, "xOffset": { "type": "calculatedRackDepthNegative" }, "yOffset": { "type": "calculatedBayLength", "add": { "type": "toteToUprightMinus", "value": 40 } } }
                },
                "dynamicProps": [
                    { "name": "Tote width", "configKey": "tote-length" },
                    { "name": "Tote length", "configKey": "tote-width" },
                    { "name": "Back-to-back Spacing", "configKey": "tote-back-to-back-dist" },
                    { "name": "Tote-to-rack Spacing1", "configKey": "tote-to-upright-dist" },
                    { "name": "Tote-to-rack Spacing2", "configKey": "tote-to-upright-dist" },
                    { "name": "Rack width", "type": "calculatedRackWidth" }
                ],
                "standard": { "blockName": "Robots-RKKK_1-Double Row Double Deep Rack-4x2", "color": 161, "layer": "RACK-STD" },
                "backpack": { "blockName": "Robots-RK_1-Double Row Double Deep Rack-4x2", "color": 4, "layer": "RACK-BP" },
                "tunnel": { "blockName": "Robots-RK_1-Double Row Double Deep Rack-4x2", "color": 6, "layer": "RACK-TUN" }
            }
        },
        "layout-mode": "s-d-s",
        "top-setback": 3000,
        "bottom-setback": 3000,
        "setback-left": 1500,
        "setback-right": 1500,
        "considerTunnels": true,
        "considerBackpacks": true,
        "hasBufferLayer": true,
        "tote-width": 650,
        "tote-length": 450,
        // "tote-height": 300,
        "tote-qty-per-bay": 4,
        "totes-deep": 2,
        "tote-to-tote-dist": 40,
        "tote-to-upright-dist": 70,
        "tote-back-to-back-dist": 0,
        "upright-length": 90,
        "upright-width": 70,
        "hook-allowance": 90,
        "aisle-width-low": 1160,
        "aisle-width-high": 1200,
        "rack-flue-space": 152.4,
        "base-beam-height": 370,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4572,
        "sprinkler-clearance": 200,
        "max-perf-density": 1.2,
        "robot-path-first-offset": 500,
        "robot-path-gap": 600,
        "acr-path-offset-top": 1000,
        "acr-path-offset-bottom": 1000,
        "amr-path-offset": 850,
        "robot-efficiencies": { "K50": 18, "ACR": 45 }
    },
    "hps3-e2-650-td": {
        "name": "HPS3-E2 - 650x450 - Triple Deep",
        "lispExportProps": {
            "singleRack": {
                "base": { "rotation": 90, "xOffset": 0, "yOffset": 0 },
                "overrides": {
                    "physicalOddRow": { "rotation": 270, "xOffset": { "type": "calculatedRackDepthNegative" }, "yOffset": { "type": "calculatedBayLength", "add": { "type": "toteToUprightMinus", "value": 40 } } }
                },
                "dynamicProps": [

                    { "name": "Tote width", "configKey": "tote-length" },
                    { "name": "Tote length", "configKey": "tote-width" },
                    { "name": "Back-to-back Spacing", "configKey": "tote-back-to-back-dist" },
                    { "name": "Tote-to-rack Spacing1", "configKey": "tote-to-upright-dist" },
                    { "name": "Tote-to-rack Spacing2", "configKey": "tote-to-upright-dist" },
                    { "name": "Rack width", "type": "calculatedRackWidth" }
                ],
                "standard": { "blockName": "Robots-RKKK_1-Triple Row Triple Deep Rack-4x3", "color": 161, "layer": "RACK-STD" },
                "backpack": { "blockName": "Robots-RK_1-Triple Row Triple Deep Rack-4x3", "color": 4, "layer": "RACK-BP" },
                "tunnel": { "blockName": "Robots-RK_1-Triple Row Triple Deep Rack-4x3", "color": 6, "layer": "RACK-TUN" }
            },
            "doubleRack": {
                "base": { "rotation": 90, "xOffset": 0, "yOffset": 0 },
                "overrides": {
                    "physicalOddRow": { "rotation": 270, "xOffset": { "type": "calculatedRackDepthNegative" }, "yOffset": { "type": "calculatedBayLength", "add": { "type": "toteToUprightMinus", "value": 40 } } }
                },
                "dynamicProps": [
                    { "name": "Tote width", "configKey": "tote-length" },
                    { "name": "Tote length", "configKey": "tote-width" },
                    { "name": "Back-to-back Spacing", "configKey": "tote-back-to-back-dist" },
                    { "name": "Tote-to-rack Spacing1", "configKey": "tote-to-upright-dist" },
                    { "name": "Tote-to-rack Spacing2", "configKey": "tote-to-upright-dist" },
                    { "name": "Rack width", "type": "calculatedRackWidth" }
                ],
                "standard": { "blockName": "Robots-RKKK_1-Triple Row Triple Deep Rack-4x3", "color": 161, "layer": "RACK-STD" },
                "backpack": { "blockName": "Robots-RK_1-Triple Row Triple Deep Rack-4x3", "color": 4, "layer": "RACK-BP" },
                "tunnel": { "blockName": "Robots-RK_1-Triple Row Triple Deep Rack-4x3", "color": 6, "layer": "RACK-TUN" }
            }
        },
        "layout-mode": "s-d-s",
        "top-setback": 3000,
        "bottom-setback": 3000,
        "setback-left": 1500,
        "setback-right": 1500,
        "considerTunnels": true,
        "considerBackpacks": true,
        "hasBufferLayer": true,
        "tote-width": 650,
        "tote-length": 450,
        // "tote-height": 300,
        "tote-qty-per-bay": 4,
        "totes-deep": 3,
        "tote-to-tote-dist": 40,
        "tote-to-upright-dist": 70,
        "tote-back-to-back-dist": 0,
        "upright-length": 90,
        "upright-width": 70,
        "hook-allowance": 90,
        "aisle-width-low": 1160,
        "aisle-width-high": 1200,
        "rack-flue-space": 152.4,
        "base-beam-height": 370,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915, 
        "sprinkler-threshold": 4572,
        "sprinkler-clearance": 200,
        "max-perf-density": 0.9,
        "robot-path-first-offset": 500,
        "robot-path-gap": 600,
        "acr-path-offset-top": 1000,
        "acr-path-offset-bottom": 1000,
        "amr-path-offset": 850,
        "robot-efficiencies": { "K50": 18, "ACR": 45 }
    },
    "hps3-e2-850-dd": {
        "name": "HPS3-E2 - 850x650 - Double Deep",
        "lispExportProps": {
            "singleRack": {
                "base": { "rotation": 90, "xOffset": 0, "yOffset": 0 },
                "overrides": {
                    "physicalOddRow": { "rotation": 270, "xOffset": { "type": "calculatedRackDepthNegative" }, "yOffset": { "type": "calculatedBayLength", "add": { "type": "toteToUprightMinus", "value": 20 } } }
                },
                "dynamicProps": [

                    { "name": "Tote width", "configKey": "tote-length" },
                    { "name": "Tote length", "configKey": "tote-width" },
                    { "name": "Tote-to-tote Spacing", "configKey": "tote-to-tote-dist" },
                    { "name": "Back-to-back Spacing", "configKey": "tote-back-to-back-dist" },
                    { "name": "Tote-to-rack Spacing1", "configKey": "tote-to-upright-dist" },
                    { "name": "Tote-to-rack Spacing2", "configKey": "tote-to-upright-dist" },
                    { "name": "Rack width", "type": "calculatedRackWidth" }
                ],
                "standard": { "blockName": "Robots-RKKK_1-Double Row Double Deep Rack-3x2", "color": 161, "layer": "RACK-STD" },
                "backpack": { "blockName": "Robots-RK_1-Double Row Double Deep Rack-3x2", "color": 4, "layer": "RACK-BP" },
                "tunnel": { "blockName": "Robots-RK_1-Double Row Double Deep Rack-3x2", "color": 6, "layer": "RACK-TUN" }
            },
            "doubleRack": {
                "base": { "rotation": 90, "xOffset": 0, "yOffset": 0 },
                "overrides": {
                    "physicalOddRow": { "rotation": 270, "xOffset": { "type": "calculatedRackDepthNegative" }, "yOffset": { "type": "calculatedBayLength", "add": { "type": "toteToUprightMinus", "value": 20 } } }
                },
                "dynamicProps": [
                    { "name": "Tote width", "configKey": "tote-length" },
                    { "name": "Tote length", "configKey": "tote-width" },
                    { "name": "Tote-to-tote Spacing", "configKey": "tote-to-tote-dist" },
                    { "name": "Back-to-back Spacing", "configKey": "tote-back-to-back-dist" },
                    { "name": "Tote-to-rack Spacing1", "configKey": "tote-to-upright-dist" },
                    { "name": "Tote-to-rack Spacing2", "configKey": "tote-to-upright-dist" },
                    { "name": "Rack width", "type": "calculatedRackWidth" }
                ],
                "standard": { "blockName": "Robots-RKKK_1-Double Row Double Deep Rack-3x2", "color": 161, "layer": "RACK-STD" },
                "backpack": { "blockName": "Robots-RK_1-Double Row Double Deep Rack-3x2", "color": 4, "layer": "RACK-BP" },
                "tunnel": { "blockName": "Robots-RK_1-Double Row Double Deep Rack-3x2", "color": 6, "layer": "RACK-TUN" }
            }
        },
        "layout-mode": "s-d-s",
        "top-setback": 3000,
        "bottom-setback": 3000,
        "setback-left": 1500,
        "setback-right": 1500,
        "considerTunnels": true,
        "considerBackpacks": true,
        "hasBufferLayer": true,
        "tote-width": 850,
        "tote-length": 650,
        // "tote-height": 400,
        "tote-qty-per-bay": 3,
        "totes-deep": 2,
        "tote-to-tote-dist": 50,
        "tote-to-upright-dist": 70,
        "tote-back-to-back-dist": 0,
        "upright-length": 90,
        "upright-width": 70,
        "hook-allowance": 90,
        "aisle-width-low": 1380,
        "aisle-width-high": 1400,
        "rack-flue-space": 152.4,
        "base-beam-height": 370,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4572,
        "sprinkler-clearance": 200,
        "max-perf-density": 0.8,
        "robot-path-first-offset": 465,
        "robot-path-gap": 810,
        "acr-path-offset-top": 1000,
        "acr-path-offset-bottom": 1000,
        "amr-path-offset": 850,
        "robot-efficiencies": { "K50": 18, "ACR": 45 }
    },
    "hps3-e2-850-td": {
        "name": "HPS3-E2 - 850x650 - Triple Deep",
        "lispExportProps": {
            "singleRack": {
                "base": { "rotation": 90, "xOffset": 0, "yOffset": 0 },
                "overrides": {
                    "physicalOddRow": { "rotation": 270, "xOffset": { "type": "calculatedRackDepthNegative" }, "yOffset": { "type": "calculatedBayLength", "add": { "type": "toteToUprightMinus", "value": 20 } } }
                },
                "dynamicProps": [

                    { "name": "Tote width", "configKey": "tote-length" },
                    { "name": "Tote length", "configKey": "tote-width" },
                    { "name": "Tote-to-tote Spacing", "configKey": "tote-to-tote-dist" },
                    { "name": "Back-to-back Spacing", "configKey": "tote-back-to-back-dist" },
                    { "name": "Tote-to-rack Spacing1", "configKey": "tote-to-upright-dist" },
                    { "name": "Tote-to-rack Spacing2", "configKey": "tote-to-upright-dist" },
                    { "name": "Rack width", "type": "calculatedRackWidth" }

                ],
                "standard": { "blockName": "Robots-RKKK_1-Triple Row Triple Deep Rack-3x3", "color": 161, "layer": "RACK-STD" },
                "backpack": { "blockName": "Robots-RK_1-Triple Row Triple Deep Rack-3x3", "color": 4, "layer": "RACK-BP" },
                "tunnel": { "blockName": "Robots-RK_1-Triple Row Triple Deep Rack-3x3", "color": 6, "layer": "RACK-TUN" }
            },
            "doubleRack": {
                "base": { "rotation": 90, "xOffset": 0, "yOffset": 0 },
                "overrides": {
                    "physicalOddRow": { "rotation": 270, "xOffset": { "type": "calculatedRackDepthNegative" }, "yOffset": { "type": "calculatedBayLength", "add": { "type": "toteToUprightMinus", "value": 20 } } }
                },
                "dynamicProps": [
                    { "name": "Tote width", "configKey": "tote-length" },
                    { "name": "Tote length", "configKey": "tote-width" },
                    { "name": "Tote-to-tote Spacing", "configKey": "tote-to-tote-dist" },
                    { "name": "Back-to-back Spacing", "configKey": "tote-back-to-back-dist" },
                    { "name": "Tote-to-rack Spacing1", "configKey": "tote-to-upright-dist" },
                    { "name": "Tote-to-rack Spacing2", "configKey": "tote-to-upright-dist" },
                    { "name": "Rack width", "type": "calculatedRackWidth" }
                ],
                "standard": { "blockName": "Robots-RKKK_1-Triple Row Triple Deep Rack-3x3", "color": 161, "layer": "RACK-STD" },
                "backpack": { "blockName": "Robots-RK_1-Triple Row Triple Deep Rack-3x3", "color": 4, "layer": "RACK-BP" },
                "tunnel": { "blockName": "Robots-RK_1-Triple Row Triple Deep Rack-3x3", "color": 6, "layer": "RACK-TUN" }
            }
        },
        "layout-mode": "s-d-s",
        "top-setback": 3000,
        "bottom-setback": 3000,
        "setback-left": 1500,
        "setback-right": 1500,
        "considerTunnels": true,
        "considerBackpacks": true,
        "hasBufferLayer": true,
        "tote-width": 850,
        "tote-length": 650,
        // "tote-height": 400,
        "tote-qty-per-bay": 3,
        "totes-deep": 3,
        "tote-to-tote-dist": 50,
        "tote-to-upright-dist": 70,
        "tote-back-to-back-dist": 0,
        "upright-length": 90,
        "upright-width": 70,
        "hook-allowance": 90,
        "aisle-width-low": 1400,
        "aisle-width-high": 1400,
        "rack-flue-space": 152.4,
        "base-beam-height": 370,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4572,
        "sprinkler-clearance": 200,
        "max-perf-density": 0.6,
        "robot-path-first-offset": 465,
        "robot-path-gap": [810, 850],
        "acr-path-offset-top": 1000,
        "acr-path-offset-bottom": 1000,
        "amr-path-offset": 850,
        "robot-efficiencies": { "K50": 18, "ACR": 45 }
    },
    "HPC": {
        "name": "HPC - Single Deep",
        "lispExportProps": {
            "singleRack": { 
                "base": { "rotation": 90, "xOffset": 0, "yOffset": 0 },
                "overrides": {
                    "lastRow": { "rotation": 270, "xOffset": -460, "yOffset": 1860 }
                },
                "dynamicProps": [
                    { "name": "Tote width", "configKey": "tote-length" },
                    { "name": "Tote length", "configKey": "tote-width" },
                    { "name": "Tote-to-tote spacing", "configKey": "tote-to-tote-dist" },
                    { "name": "Tote-to-rack spacing", "configKey": "tote-to-upright-dist" },
                    { "name": "Visibility1", "value": "Single Guide Rail" }
                ],
                "standard": { "blockName": "Robots-RXLX_1-Single Row Single Deep Rack-3x1", "color": 161, "layer": "RACK-STD-HPC" }
            },
            "doubleRack": { 
                "base": { "rotation": 90, "xOffset": 340, "yOffset": 0 },
                "overrides": {
                    // No overrides needed for middle rows
                },
                "dynamicProps": [
                    { "name": "Tote width", "configKey": "tote-length" },
                    { "name": "Tote length", "configKey": "tote-width" },
                    { "name": "Tote-to-tote spacing", "configKey": "tote-to-tote-dist" },
                    { "name": "Tote-to-rack spacing", "configKey": "tote-to-upright-dist" },
                    { "name": "Visibility1", "value": "Single Guide Rail" }
                ],
                "standard": { "blockName": "Robots-RXLX_1-Double Row Single Deep Rack-3x2x1", "color": 161, "layer": "RACK-STD-HPC" }
            }
        },
        "layout-mode": "all-singles",
        "top-setback": 1500,
        "bottom-setback": 3950,
        "setback-left": 200,
        "setback-right": 200,
        "considerTunnels": false,
        "considerBackpacks": false,
        "hasBufferLayer": false,
        "tote-width": 650,
        "tote-length": 450,
        // "tote-height": 300,
        "tote-qty-per-bay": 3,
        "totes-deep": 2,
        "tote-to-tote-dist": 140,
        "tote-to-upright-dist": 25,
        "tote-back-to-back-dist": 30,
        "upright-length": 90,
        "upright-width": 70,
        "hook-allowance": 0,
        "aisle-width-low": 900,
        "aisle-width-high": 900,
        "rack-flue-space": 152.4,
        "base-beam-height": 840,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4572,
        "sprinkler-clearance": 200,
        "max-perf-density": 2.5,
        "robot-efficiencies": { "Climber": 20 }
    },
    "HPC-DD": {
        "name": "HPC - Double Deep",
        "lispExportProps": {
            "singleRack": { 
                "base": { "rotation": 90, "xOffset": 0, "yOffset": 0 },
                "overrides": {
                    "physicalOddRow": { "rotation": 270, "xOffset": { "type": "calculatedRackDepthNegative" }, "yOffset": { "type": "calculatedBayLength", "add": { "type": "toteToUprightMinus", "value": 25 } } }
                },
                "dynamicProps": [
                    { "name": "Tote width", "configKey": "tote-length" },
                    { "name": "Tote length", "configKey": "tote-width" },
                    { "name": "Tote-to-tote spacing", "configKey": "tote-to-tote-dist" },
                    { "name": "Tote-to-rack spacing", "configKey": "tote-to-upright-dist" },
                    { "name": "Visibility1", "value": "Single Guide Rail" },
                    { "name": "Rack width", "type": "calculatedRackWidth" }
                ],
                "standard": { "blockName": "Robots-RXLX_1-Single Row Double Deep Rack-3x2", "color": 161, "layer": "RACK-STD-HPC" }
            },
            "doubleRack": { 
                "base": { "rotation": 90, "xOffset": 0, "yOffset": 0 },
                "overrides": {
                    "physicalOddRow": { "rotation": 270, "xOffset": { "type": "calculatedRackDepthNegative" }, "yOffset": { "type": "calculatedBayLength", "add": { "type": "toteToUprightMinus", "value": 25 } } }
                },
                "dynamicProps": [
                    { "name": "Tote width", "configKey": "tote-length" },
                    { "name": "Tote length", "configKey": "tote-width" },
                    { "name": "Tote-to-tote spacing", "configKey": "tote-to-tote-dist" },
                    { "name": "Tote-to-rack spacing", "configKey": "tote-to-upright-dist" },
                    { "name": "Visibility1", "value": "Single Guide Rail" },
                    { "name": "Rack width", "type": "calculatedRackWidth" }
                ],
                "standard": { "blockName": "Robots-RXLX_1-Double Row Double Deep Rack-3x2", "color": 161, "layer": "RACK-STD-HPC" }
            }
        },
        "layout-mode": "s-d-s",
        "top-setback": 1500,
        "bottom-setback": 3950,
        "setback-left": 200,
        "setback-right": 200,
        "considerTunnels": false,
        "considerBackpacks": false,
        "hasBufferLayer": false,
        "tote-width": 650,
        "tote-length": 450,
        "tote-qty-per-bay": 3,
        "totes-deep": 2,
        "tote-to-tote-dist": 140,
        "tote-to-upright-dist": 25,
        "tote-back-to-back-dist": 30,
        "upright-length": 90,
        "upright-width": 70,
        "hook-allowance": 0,
        "aisle-width-low": 900,
        "aisle-width-high": 900,
        "rack-flue-space": 152.4,
        "base-beam-height": 840,
        "beam-width": 60,
        "min-clearance": 40,
        "overhead-clearance": 915,
        "sprinkler-threshold": 4572,
        "sprinkler-clearance": 200,
        "max-perf-density": 2.5,
        "robot-efficiencies": { "Climber": 20 }
    }
};

export const defaultConfig = {};